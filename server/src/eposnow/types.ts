// Formas de datos que esperamos de la API de EposNow (endpoints Booking,
// Staff, Customer: https://developer.eposnowhq.com/Docs/Api).
//
// IMPORTANTE: no pude leer el esquema JSON exacto de esos endpoints
// (el acceso a developer.eposnowhq.com está bloqueado en este entorno).
// Estos tipos son una hipótesis razonable basada en el nombrado habitual
// de la API de EposNow. En cuanto tengas una cuenta de desarrollador,
// hay que contrastar `EposNowBooking`/`EposNowStaff` contra la respuesta
// real y ajustar los campos en este archivo y en `client.ts`.

export interface EposNowStaff {
  Id: number;
  FirstName: string;
  LastName: string;
  Email?: string;
  Active: boolean;
}

export interface EposNowCustomer {
  Id: number;
  FirstName: string;
  LastName: string;
  MobileNumber?: string;
  Email?: string;
}

export interface EposNowBooking {
  Id: number;
  CustomerId: number | null;
  StaffId: number;
  ServiceName: string;
  StartDate: string; // ISO 8601
  EndDate: string; // ISO 8601
  Status: string; // Confirmed | Cancelled | Completed | NoShow ...
  Notes?: string;
}

export interface CreateBookingInput {
  customerId: number | null;
  staffId: number;
  serviceName: string;
  startDate: string;
  endDate: string;
  notes?: string;
}
