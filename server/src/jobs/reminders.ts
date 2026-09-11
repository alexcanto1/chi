import { prisma } from "../db/prisma.js";
import * as eposnow from "../eposnow/client.js";
import { sendWhatsappTemplate } from "../whatsapp/client.js";

interface ReminderWindow {
  type: "24h" | "2h";
  hoursBefore: number;
  toleranceMinutes: number;
}

// Ventanas en las que se envía recordatorio. La tolerancia evita que un
// job que corre cada 15 min se salte una cita por estar justo entre dos
// ejecuciones.
const WINDOWS: ReminderWindow[] = [
  { type: "24h", hoursBefore: 24, toleranceMinutes: 15 },
  { type: "2h", hoursBefore: 2, toleranceMinutes: 15 },
];

export async function runReminderSweep(): Promise<void> {
  const now = new Date();
  const staff = await eposnow.listStaff();
  const customers = await eposnow.listCustomers();
  const staffById = new Map(staff.map((s) => [s.Id, s]));
  const customersById = new Map(customers.map((c) => [c.Id, c]));

  for (const window of WINDOWS) {
    const targetStart = new Date(now.getTime() + (window.hoursBefore * 60 - window.toleranceMinutes) * 60_000);
    const targetEnd = new Date(now.getTime() + (window.hoursBefore * 60 + window.toleranceMinutes) * 60_000);

    const bookings = await eposnow.listBookings({ from: targetStart, to: targetEnd });

    for (const booking of bookings) {
      if (booking.Status !== "Confirmed") continue;
      if (!booking.CustomerId) continue;

      const alreadySent = await prisma.reminderLog.findUnique({
        where: {
          eposnowBookingId_reminderType: {
            eposnowBookingId: String(booking.Id),
            reminderType: window.type,
          },
        },
      });
      if (alreadySent) continue;

      const customer = customersById.get(booking.CustomerId);
      const employee = staffById.get(booking.StaffId);
      if (!customer?.MobileNumber) continue;

      const when = new Date(booking.StartDate).toLocaleString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

      await sendWhatsappTemplate({
        toPhone: customer.MobileNumber,
        templateName: window.type === "24h" ? "recordatorio_cita_24h" : "recordatorio_cita_2h",
        bodyParams: [
          customer.FirstName,
          booking.ServiceName,
          when,
          employee ? `${employee.FirstName} ${employee.LastName}` : "tu barbero",
        ],
      });

      await prisma.reminderLog.create({
        data: { eposnowBookingId: String(booking.Id), reminderType: window.type },
      });
    }
  }
}
