import { Router } from "express";
import { env } from "../env.js";
import { prisma } from "../db/prisma.js";

// Webhook de WhatsApp Cloud API. Meta lo llama:
//  - con GET para verificar la URL al configurarla en su panel.
//  - con POST cada vez que llega un mensaje entrante (p.ej. un cliente
//    respondiendo "SI" para confirmar un hueco libre de la lista de
//    espera).

export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.whatsappVerifyToken) {
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
});

whatsappWebhookRouter.post("/", async (req, res) => {
  // Responder rápido; procesamos el mensaje sin bloquear a Meta.
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) return;

    const fromPhone: string = message.from;
    const text: string = message.text?.body?.trim().toLowerCase() ?? "";

    const affirmative = ["si", "sí", "yes", "ok", "confirmo"].includes(text);
    if (!affirmative) return;

    const entryWaiting = await prisma.waitlistEntry.findFirst({
      where: { phoneNumber: { contains: fromPhone.slice(-9) }, status: "notified" },
      orderBy: { notifiedAt: "desc" },
    });

    if (entryWaiting) {
      await prisma.waitlistEntry.update({
        where: { id: entryWaiting.id },
        data: { status: "confirmed_pending_booking" },
      });
      // La creación de la cita real en EposNow para esta confirmación
      // se gestiona desde la agenda por el equipo de la barbería
      // (POST /api/waitlist/:id/convert), que revisa el hueco y elige
      // hora exacta antes de guardarla en EposNow.
    }
  } catch (err) {
    console.error("Error procesando webhook de WhatsApp", err);
  }
});
