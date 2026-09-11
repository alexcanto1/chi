import { MouseEvent, useEffect, useMemo, useState } from "react";
import { api, Booking, Customer, Employee } from "../api";
import AppointmentCard from "./AppointmentCard";
import NewAppointmentModal from "./NewAppointmentModal";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 21;
const PX_PER_MINUTE = 1.6;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export default function AgendaView() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ staffId: number; startDate: Date } | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [agenda, employeeList] = await Promise.all([
        api.agenda(startOfDay(selectedDate), endOfDay(selectedDate)),
        api.employees(),
      ]);
      setBookings(agenda.bookings);
      setCustomers(agenda.customers);
      setEmployees(employeeList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) marks.push(h);
    return marks;
  }, []);

  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * 60 * PX_PER_MINUTE;

  function minutesFromDayStart(date: Date): number {
    return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  }

  function handleColumnClick(staffId: number, e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = offsetY / PX_PER_MINUTE;
    const snapped = Math.round(rawMinutes / 15) * 15;
    const start = new Date(selectedDate);
    start.setHours(DAY_START_HOUR, 0, 0, 0);
    start.setMinutes(start.getMinutes() + snapped);
    setDraft({ staffId, startDate: start });
  }

  async function handleCancel(bookingId: number) {
    if (!confirm("¿Cancelar esta cita? Se avisará a la lista de espera si hay hueco compatible.")) return;
    const booking = bookings.find((b) => b.Id === bookingId);
    await api.cancelBooking(bookingId);
    if (booking) {
      await fetch("/api/waitlist/notify-for-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStart: booking.StartDate,
          slotEnd: booking.EndDate,
          staffId: String(booking.StaffId),
        }),
      }).catch(() => {});
    }
    reload();
  }

  return (
    <div className="agenda-view">
      <div className="agenda-toolbar">
        <button onClick={() => setSelectedDate((d) => new Date(d.getTime() - 86400000))}>‹</button>
        <div className="agenda-date">
          <strong>{formatDayLabel(selectedDate)}</strong>
          <button className="link" onClick={() => setSelectedDate(new Date())}>
            Hoy
          </button>
        </div>
        <button onClick={() => setSelectedDate((d) => new Date(d.getTime() + 86400000))}>›</button>
      </div>

      {error && <div className="banner error">{error}</div>}
      {loading && <div className="banner">Cargando agenda…</div>}

      {!loading && !error && (
        <div className="agenda-grid" style={{ gridTemplateColumns: `64px repeat(${employees.length}, 1fr)` }}>
          <div className="agenda-corner" />
          {employees.map((emp) => (
            <div key={emp.id} className="agenda-employee-header">
              <span className="dot" style={{ background: emp.colorHex }} />
              {emp.name}
            </div>
          ))}

          <div className="agenda-time-axis" style={{ height: gridHeight }}>
            {hourMarks.map((h) => (
              <div key={h} className="hour-mark" style={{ top: (h - DAY_START_HOUR) * 60 * PX_PER_MINUTE }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {employees.map((emp) => (
            <div
              key={emp.id}
              className="agenda-column"
              style={{ height: gridHeight }}
              onClick={(e) => handleColumnClick(emp.id, e)}
            >
              {hourMarks.map((h) => (
                <div key={h} className="hour-line" style={{ top: (h - DAY_START_HOUR) * 60 * PX_PER_MINUTE }} />
              ))}
              {bookings
                .filter((b) => b.StaffId === emp.id && b.Status !== "Cancelled")
                .map((b) => {
                  const start = new Date(b.StartDate);
                  const end = new Date(b.EndDate);
                  const top = minutesFromDayStart(start) * PX_PER_MINUTE;
                  const height = Math.max(24, ((end.getTime() - start.getTime()) / 60000) * PX_PER_MINUTE);
                  const customer = customers.find((c) => c.Id === b.CustomerId);
                  return (
                    <AppointmentCard
                      key={b.Id}
                      booking={b}
                      customerName={customer ? `${customer.FirstName} ${customer.LastName}` : "Cliente"}
                      color={emp.colorHex}
                      top={top}
                      height={height}
                      onCancel={() => handleCancel(b.Id)}
                    />
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {draft && (
        <NewAppointmentModal
          staffId={draft.staffId}
          employeeName={employees.find((e) => e.id === draft.staffId)?.name ?? ""}
          startDate={draft.startDate}
          customers={customers}
          onClose={() => setDraft(null)}
          onCreated={() => {
            setDraft(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
