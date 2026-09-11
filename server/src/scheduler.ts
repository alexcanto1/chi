import cron from "node-cron";
import { runReminderSweep } from "./jobs/reminders.js";
import { expireStaleWaitlistNotifications } from "./jobs/waitlistExpiry.js";

export function startScheduler(): void {
  // Cada 15 minutos: enviar recordatorios de citas próximas (24h/2h).
  cron.schedule("*/15 * * * *", () => {
    runReminderSweep().catch((err) => console.error("Fallo en runReminderSweep", err));
  });

  // Cada 10 minutos: liberar avisos de lista de espera sin respuesta.
  cron.schedule("*/10 * * * *", () => {
    expireStaleWaitlistNotifications().catch((err) =>
      console.error("Fallo en expireStaleWaitlistNotifications", err),
    );
  });
}
