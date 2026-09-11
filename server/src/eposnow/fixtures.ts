import type { EposNowBooking, EposNowCustomer, EposNowStaff } from "./types.js";

// Datos de ejemplo para poder desarrollar y probar la agenda sin tener
// aún credenciales reales de EposNow. Se activan automáticamente cuando
// no hay EPOSNOW_API_KEY en el entorno (ver env.ts).

export const demoStaff: EposNowStaff[] = [
  { Id: 1, FirstName: "Marcos", LastName: "Ruiz", Active: true },
  { Id: 2, FirstName: "Diego", LastName: "Fernández", Active: true },
  { Id: 3, FirstName: "Laura", LastName: "Gómez", Active: true },
];

export const demoCustomers: EposNowCustomer[] = [
  { Id: 101, FirstName: "Pablo", LastName: "Serrano", MobileNumber: "+34611111111" },
  { Id: 102, FirstName: "Iván", LastName: "Molina", MobileNumber: "+34622222222" },
  { Id: 103, FirstName: "Sergio", LastName: "Ortiz", MobileNumber: "+34633333333" },
];

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function iso(d: Date): string {
  return d.toISOString();
}

export const demoBookings: EposNowBooking[] = [
  {
    Id: 5001,
    CustomerId: 101,
    StaffId: 1,
    ServiceName: "Corte + barba",
    StartDate: iso(todayAt(10, 0)),
    EndDate: iso(todayAt(10, 45)),
    Status: "Confirmed",
  },
  {
    Id: 5002,
    CustomerId: 102,
    StaffId: 2,
    ServiceName: "Corte clásico",
    StartDate: iso(todayAt(11, 0)),
    EndDate: iso(todayAt(11, 30)),
    Status: "Confirmed",
  },
  {
    Id: 5003,
    CustomerId: 103,
    StaffId: 3,
    ServiceName: "Afeitado a navaja",
    StartDate: iso(todayAt(12, 30)),
    EndDate: iso(todayAt(13, 0)),
    Status: "Confirmed",
  },
];
