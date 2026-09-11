import { useState } from "react";
import { Booking } from "../api";

interface Props {
  booking: Booking;
  customerName: string;
  color: string;
  top: number;
  height: number;
  onCancel: () => void;
}

export default function AppointmentCard({ booking, customerName, color, top, height, onCancel }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="appointment-card"
      style={{ top, height, borderLeftColor: color, background: `${color}22` }}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
    >
      <div className="appointment-title">{customerName}</div>
      <div className="appointment-service">{booking.ServiceName}</div>

      {open && (
        <div className="appointment-popover" onClick={(e) => e.stopPropagation()}>
          <p>
            {new Date(booking.StartDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} –{" "}
            {new Date(booking.EndDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <button className="danger" onClick={onCancel}>
            Cancelar cita
          </button>
        </div>
      )}
    </div>
  );
}
