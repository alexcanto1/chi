import { Router } from "express";
import { z } from "zod";
import * as eposnow from "../eposnow/client.js";

export const agendaRouter = Router();

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

// GET /api/agenda?from=ISO&to=ISO
// Devuelve citas + el staff y clientes necesarios para pintarlas,
// listo para consumir directamente en la vista de calendario.
agendaRouter.get("/", async (req, res) => {
  const parsed = rangeSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros from/to inválidos (ISO 8601)" });
    return;
  }

  const { from, to } = parsed.data;
  const [bookings, staff, customers] = await Promise.all([
    eposnow.listBookings({ from: new Date(from), to: new Date(to) }),
    eposnow.listStaff(),
    eposnow.listCustomers(),
  ]);

  res.json({ bookings, staff, customers });
});

const createBookingSchema = z.object({
  customerId: z.number().nullable(),
  staffId: z.number(),
  serviceName: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().optional(),
});

agendaRouter.post("/bookings", async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const booking = await eposnow.createBooking(parsed.data);
  res.status(201).json(booking);
});

agendaRouter.put("/bookings/:id/cancel", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  await eposnow.cancelBooking(id);
  res.status(204).send();
});
