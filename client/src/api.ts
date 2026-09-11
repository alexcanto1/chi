export interface Staff {
  Id: number;
  FirstName: string;
  LastName: string;
  Active: boolean;
}

export interface Customer {
  Id: number;
  FirstName: string;
  LastName: string;
  MobileNumber?: string;
}

export interface Booking {
  Id: number;
  CustomerId: number | null;
  StaffId: number;
  ServiceName: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  Notes?: string;
}

export interface Employee {
  id: number;
  name: string;
  colorHex: string;
  workingHours: Record<string, [string, string][]>;
  hasCustomSchedule: boolean;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  phoneNumber: string;
  serviceName: string;
  preferredEmployeeId?: string | null;
  preferredEmployeeName?: string | null;
  earliestDate: string;
  latestDate: string;
  status: string;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  agenda: (from: Date, to: Date) =>
    request<{ bookings: Booking[]; staff: Staff[]; customers: Customer[] }>(
      `/api/agenda?from=${from.toISOString()}&to=${to.toISOString()}`,
    ),

  createBooking: (input: {
    customerId: number | null;
    staffId: number;
    serviceName: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) => request<Booking>("/api/agenda/bookings", { method: "POST", body: JSON.stringify(input) }),

  cancelBooking: (id: number) =>
    request<void>(`/api/agenda/bookings/${id}/cancel`, { method: "PUT" }),

  employees: () => request<Employee[]>("/api/employees"),

  saveEmployeeSchedule: (
    staffId: number,
    data: { displayName: string; colorHex: string; workingHours: Record<string, [string, string][]> },
  ) =>
    request(`/api/employees/${staffId}/schedule`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  waitlist: () => request<WaitlistEntry[]>("/api/waitlist"),

  addToWaitlist: (input: {
    customerName: string;
    phoneNumber: string;
    serviceName: string;
    preferredEmployeeId?: string;
    preferredEmployeeName?: string;
    earliestDate: string;
    latestDate: string;
  }) => request<WaitlistEntry>("/api/waitlist", { method: "POST", body: JSON.stringify(input) }),

  removeFromWaitlist: (id: string) => request<void>(`/api/waitlist/${id}`, { method: "DELETE" }),
};
