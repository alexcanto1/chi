import { FormEvent, useEffect, useState } from "react";
import { api, WaitlistEntry } from "../api";

const STATUS_LABELS: Record<string, string> = {
  waiting: "En espera",
  notified: "Avisado por WhatsApp",
  confirmed_pending_booking: "Confirmó — falta reservar",
  booked: "Reservado",
};

export default function WaitlistPanel() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    setEntries(await api.waitlist());
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="waitlist-page">
      <div className="waitlist-header">
        <h2>Lista de espera</h2>
        <button className="primary" onClick={() => setShowForm(true)}>
          + Añadir a la lista
        </button>
      </div>
      <p className="muted">
        Cuando se cancela una cita, avisamos automáticamente por WhatsApp al primer cliente compatible en fecha
        (y barbero, si lo pidió). Si confirma "SÍ", queda marcado aquí para convertirlo en cita.
      </p>

      {loading && <div className="banner">Cargando…</div>}

      <div className="waitlist-list">
        {entries.map((entry) => (
          <div key={entry.id} className="waitlist-row">
            <div>
              <strong>{entry.customerName}</strong> · {entry.serviceName}
              <div className="muted small">
                {entry.phoneNumber} · desde{" "}
                {new Date(entry.earliestDate).toLocaleDateString("es-ES")} hasta{" "}
                {new Date(entry.latestDate).toLocaleDateString("es-ES")}
                {entry.preferredEmployeeName ? ` · prefiere a ${entry.preferredEmployeeName}` : ""}
              </div>
            </div>
            <div className="waitlist-actions">
              <span className={`status-pill status-${entry.status}`}>{STATUS_LABELS[entry.status] ?? entry.status}</span>
              <button
                className="link danger"
                onClick={async () => {
                  await api.removeFromWaitlist(entry.id);
                  reload();
                }}
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        {!loading && entries.length === 0 && <p className="muted">No hay nadie en la lista de espera.</p>}
      </div>

      {showForm && (
        <AddWaitlistModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AddWaitlistModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+34");
  const [serviceName, setServiceName] = useState("Corte");
  const [earliestDate, setEarliestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [latestDate, setLatestDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.addToWaitlist({
        customerName,
        phoneNumber,
        serviceName,
        earliestDate: new Date(`${earliestDate}T00:00:00`).toISOString(),
        latestDate: new Date(`${latestDate}T23:59:59`).toISOString(),
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Añadir a la lista de espera</h3>
        <label>
          Nombre del cliente
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </label>
        <label>
          WhatsApp
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </label>
        <label>
          Servicio deseado
          <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
        </label>
        <label>
          Desde
          <input type="date" value={earliestDate} onChange={(e) => setEarliestDate(e.target.value)} required />
        </label>
        <label>
          Hasta
          <input type="date" value={latestDate} onChange={(e) => setLatestDate(e.target.value)} required />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Guardando…" : "Añadir"}
          </button>
        </div>
      </form>
    </div>
  );
}
