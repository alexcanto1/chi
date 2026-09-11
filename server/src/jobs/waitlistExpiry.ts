import { prisma } from "../db/prisma.js";

// Si a alguien se le avisó de un hueco libre y no responde en 30
// minutos, liberamos la entrada (vuelve a "waiting") para poder
// ofrecérselo al siguiente de la lista en la próxima notificación.
const RESPONSE_WINDOW_MINUTES = 30;

export async function expireStaleWaitlistNotifications(): Promise<void> {
  const cutoff = new Date(Date.now() - RESPONSE_WINDOW_MINUTES * 60_000);

  await prisma.waitlistEntry.updateMany({
    where: { status: "notified", notifiedAt: { lte: cutoff } },
    data: { status: "waiting", notifiedAt: null },
  });

  // También caduca a los que quedaron esperando una fecha ya pasada.
  await prisma.waitlistEntry.updateMany({
    where: { status: { in: ["waiting", "notified"] }, latestDate: { lt: new Date() } },
    data: { status: "expired" },
  });
}
