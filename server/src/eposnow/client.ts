import { env } from "../env.js";
import { demoBookings, demoCustomers, demoStaff } from "./fixtures.js";
import type {
  CreateBookingInput,
  EposNowBooking,
  EposNowCustomer,
  EposNowStaff,
} from "./types.js";

// Envuelve la API de EposNow (https://developer.eposnowhq.com/Docs/Api).
// Si no hay EPOSNOW_API_KEY configurada, responde con datos de ejemplo
// (modo demo) para poder desarrollar y probar la agenda sin credenciales.
//
// Nota: los nombres exactos de campos/endpoints deben confirmarse contra
// la documentación oficial en cuanto tengas acceso de desarrollador; ver
// el comentario al principio de ./types.ts.

let nextDemoBookingId = 9000;
const demoBookingsStore: EposNowBooking[] = [...demoBookings];

async function eposnowFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.eposnowBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${env.eposnowApiKey}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EposNow API ${res.status} ${res.statusText}: ${body}`);
  }

  return (await res.json()) as T;
}

export async function listStaff(): Promise<EposNowStaff[]> {
  if (env.eposnowDemoMode) return demoStaff;
  return eposnowFetch<EposNowStaff[]>("/Staff");
}

export async function listCustomers(): Promise<EposNowCustomer[]> {
  if (env.eposnowDemoMode) return demoCustomers;
  return eposnowFetch<EposNowCustomer[]>("/Customer");
}

export async function listBookings(range: { from: Date; to: Date }): Promise<EposNowBooking[]> {
  if (env.eposnowDemoMode) {
    return demoBookingsStore.filter((b) => {
      const start = new Date(b.StartDate);
      return start >= range.from && start <= range.to;
    });
  }
  const bookings = await eposnowFetch<EposNowBooking[]>("/Booking");
  return bookings.filter((b) => {
    const start = new Date(b.StartDate);
    return start >= range.from && start <= range.to;
  });
}

export async function createBooking(input: CreateBookingInput): Promise<EposNowBooking> {
  if (env.eposnowDemoMode) {
    const booking: EposNowBooking = {
      Id: nextDemoBookingId++,
      CustomerId: input.customerId,
      StaffId: input.staffId,
      ServiceName: input.serviceName,
      StartDate: input.startDate,
      EndDate: input.endDate,
      Status: "Confirmed",
      Notes: input.notes,
    };
    demoBookingsStore.push(booking);
    return booking;
  }

  return eposnowFetch<EposNowBooking>("/Booking", {
    method: "POST",
    body: JSON.stringify({
      CustomerId: input.customerId,
      StaffId: input.staffId,
      ServiceName: input.serviceName,
      StartDate: input.startDate,
      EndDate: input.endDate,
      Notes: input.notes,
      Status: "Confirmed",
    }),
  });
}

export async function cancelBooking(bookingId: number): Promise<void> {
  if (env.eposnowDemoMode) {
    const booking = demoBookingsStore.find((b) => b.Id === bookingId);
    if (booking) booking.Status = "Cancelled";
    return;
  }

  await eposnowFetch(`/Booking/${bookingId}`, {
    method: "PUT",
    body: JSON.stringify({ Status: "Cancelled" }),
  });
}
