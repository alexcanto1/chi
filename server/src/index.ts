import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { agendaRouter } from "./routes/agenda.js";
import { employeesRouter } from "./routes/employees.js";
import { waitlistRouter } from "./routes/waitlist.js";
import { whatsappWebhookRouter } from "./whatsapp/webhook.js";
import { startScheduler } from "./scheduler.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    eposnowDemoMode: env.eposnowDemoMode,
    whatsappDemoMode: env.whatsappDemoMode,
  });
});

app.use("/api/agenda", agendaRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/webhooks/whatsapp", whatsappWebhookRouter);

app.listen(env.port, () => {
  console.log(`Chicomalo Agenda API escuchando en http://localhost:${env.port}`);
  if (env.eposnowDemoMode) console.log("→ EposNow en modo demo (sin EPOSNOW_API_KEY)");
  if (env.whatsappDemoMode) console.log("→ WhatsApp en modo demo (sin WHATSAPP_ACCESS_TOKEN)");
  startScheduler();
});
