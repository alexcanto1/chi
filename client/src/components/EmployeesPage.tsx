import { useEffect, useState } from "react";
import { api, Employee } from "../api";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function reload() {
    setLoading(true);
    setEmployees(await api.employees());
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  if (loading) return <div className="banner">Cargando empleados…</div>;

  return (
    <div className="employees-page">
      <h2>Empleados</h2>
      <p className="muted">
        El nombre y el alta/baja se gestionan en EposNow. Aquí solo configuras el color en la agenda y el horario de
        trabajo de cada barbero.
      </p>

      <div className="employee-list">
        {employees.map((emp) => (
          <EmployeeRow
            key={emp.id}
            employee={emp}
            editing={editingId === emp.id}
            onEdit={() => setEditingId(emp.id)}
            onClose={() => setEditingId(null)}
            onSaved={reload}
          />
        ))}
      </div>
    </div>
  );
}

function EmployeeRow({
  employee,
  editing,
  onEdit,
  onClose,
  onSaved,
}: {
  employee: Employee;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [colorHex, setColorHex] = useState(employee.colorHex);
  const [hours, setHours] = useState(employee.workingHours);
  const [saving, setSaving] = useState(false);

  function setDayRange(day: string, idx: number, which: 0 | 1, value: string) {
    setHours((prev) => {
      const dayRanges = [...(prev[day] ?? [])];
      const range = [...(dayRanges[idx] ?? ["09:00", "18:00"])] as [string, string];
      range[which] = value;
      dayRanges[idx] = range;
      return { ...prev, [day]: dayRanges };
    });
  }

  function toggleDayOff(day: string) {
    setHours((prev) => ({ ...prev, [day]: prev[day]?.length ? [] : [["09:00", "18:00"]] }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveEmployeeSchedule(employee.id, { displayName: employee.name, colorHex, workingHours: hours });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="employee-row">
      <div className="employee-summary" onClick={editing ? onClose : onEdit}>
        <span className="dot" style={{ background: employee.colorHex }} />
        <strong>{employee.name}</strong>
        {!employee.hasCustomSchedule && <span className="badge">horario por defecto</span>}
        <span className="chevron">{editing ? "▲" : "▼"}</span>
      </div>

      {editing && (
        <div className="employee-editor">
          <label className="inline">
            Color en la agenda
            <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
          </label>

          <table className="hours-table">
            <tbody>
              {DAYS.map(({ key, label }) => {
                const dayRanges = hours[key] ?? [];
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <label className="inline">
                        <input type="checkbox" checked={dayRanges.length > 0} onChange={() => toggleDayOff(key)} />
                        trabaja
                      </label>
                    </td>
                    {dayRanges.length > 0 && (
                      <td>
                        {dayRanges.map((range, idx) => (
                          <span key={idx} className="range-inputs">
                            <input type="time" value={range[0]} onChange={(e) => setDayRange(key, idx, 0, e.target.value)} />
                            <span> – </span>
                            <input type="time" value={range[1]} onChange={(e) => setDayRange(key, idx, 1, e.target.value)} />
                          </span>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="modal-actions">
            <button onClick={onClose}>Cerrar</button>
            <button className="primary" onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar horario"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
