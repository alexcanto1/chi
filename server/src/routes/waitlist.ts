import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import * as eposnow from "../eposnow/client.js";
import { sendWhatsappTemplate } from "../whatsapp/client.js";

export const waitlistRouter = Router();

waitlistRouter.get("/", async (_req, res) => {
  const entries = await prisma.waitlistEntry.findMany({
    where: { status: { in: ["waiting", "notified", "confirmed_pending_booking"] } },
    orderBy: { createdAt: "asc" },
  });
  res.json(entries);
});

const createSchema = z.object({
  customerName: z.string().min(1),
  phoneNumber: z.string().min(6),
  serviceName: z.string().min(1),
  preferredEmployeeId: z.string().optional(),
  preferredEmployeeName: z.string().optional(),
  earliestDate: z.string().datetime(),
  latestDate: z.string().datetime(),
});

// Un cliente se apunta a la lista de espera cuando no hay hueco libre
// para el día/franja que quiere.
waitlistRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      customerName: parsed.data.customerName,
      phoneNumber: parsed.data.phoneNumber,
      serviceName: parsed.data.serviceName,
      preferredEmployeeId: parsed.data.preferredEmployeeId,
      preferredEmployeeName: parsed.data.preferredEmployeeName,
      earliestDate: new Date(parsed.data.earliestDate),
      latestDate: new Date(parsed.data.latestDate),
    },
  });

  res.status(201).json(entry);
});

// Se llama cuando se libera un hueco (p.ej. al cancelar una cita) para
// avisar por WhatsApp al primero de la lista que encaje en fecha y,
// si lo pidió, con el mismo empleado.
waitlistRouter.post("/notify-for-slot", async (req, res) => {
  const schema = z.object({
    slotStart: z.string().datetime(),
    slotEnd: z.string().datetime(),
    staffId: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const slotStart = new Date(parsed.data.slotStart);

  const candidate = await prisma.waitlistEntry.findFirst({
    where: {
      status: "waiting",
      earliestDate: { lte: slotStart },
      latestDate: { gte: slotStart },
      ...(parsed.data.staffId
        ? { OR: [{ preferredEmployeeId: null }, { preferredEmployeeId: parsed.data.staffId }] }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  if (!candidate) {
    res.json({ notified: false });
    return;
  }

  const formattedDate = slotStart.toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  await sendWhatsappTemplate({
    toPhone: candidate.phoneNumber,
    templateName: "hueco_libre_lista_espera",
    bodyParams: [candidate.customerName, candidate.serviceName, formattedDate],
  });

  await prisma.waitlistEntry.update({
    where: { id: candidate.id },
    data: { status: "notified", notifiedAt: new Date() },
  });

  res.json({ notified: true, entry: candidate });
});

// Convierte una entrada confirmada por WhatsApp en una cita real en
// EposNow.
waitlistRouter.post("/:id/convert", async (req, res) => {
  const schema = z.object({
    staffId: z.number(),
    customerId: z.number().nullable(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.waitlistEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }

  const booking = await eposnow.createBooking({
    customerId: parsed.data.customerId,
    staffId: parsed.data.staffId,
    serviceName: entry.serviceName,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    notes: "Convertida desde lista de espera",
  });

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { status: "booked", eposnowBookingId: String(booking.Id) },
  });

  res.status(201).json(booking);
});

waitlistRouter.delete("/:id", async (req, res) => {
  await prisma.waitlistEntry.update({
    where: { id: req.params.id },
    data: { status: "cancelled" },
  });
  res.status(204).send();
});
