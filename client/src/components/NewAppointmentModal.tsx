import { FormEvent, useState } from "react";
import { api, Customer } from "../api";

interface Props {
  staffId: number;
  employeeName: string;
  startDate: Date;
  customers: Customer[];
  onClose: () => void;
  onCreated: () => void;
}

const DURATIONS = [15, 30, 45, 60, 90];

export default function NewAppointmentModal({ staffId, employeeName, startDate, customers, onClose, onCreated }: Props) {
  const [customerId, setCustomerId] = useState<number | "new">(customers[0]?.Id ?? "new");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [serviceName, setServiceName] = useState("Corte");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const end = new Date(startDate.getTime() + duration * 60000);
      await api.createBooking({
        customerId: customerId === "new" ? null : customerId,
        staffId,
        serviceName: customerId === "new" ? `${serviceName} (${newCustomerName || "walk-in"})` : serviceName,
        startDate: startDate.toISOString(),
        endDate: end.toISOString(),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Nueva cita — {employeeName}</h3>
        <p className="muted">
          {startDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
          {startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </p>

        <label>
          Cliente
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value === "new" ? "new" : Number(e.target.value))}>
            {customers.map((c) => (
              <option key={c.Id} value={c.Id}>
                {c.FirstName} {c.LastName}
              </option>
            ))}
            <option value="new">Cliente nuevo / walk-in…</option>
          </select>
        </label>

        {customerId === "new" && (
          <label>
            Nombre del cliente
            <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Nombre y apellido" />
          </label>
        )}

        <label>
          Servicio
          <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
        </label>

        <label>
          Duración
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </label>

        {error && <div className="banner error">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Guardando…" : "Reservar"}
          </button>
        </div>
      </form>
    </div>
  );
}
