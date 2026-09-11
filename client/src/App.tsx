import { useState } from "react";
import AgendaView from "./components/AgendaView";
import EmployeesPage from "./components/EmployeesPage";
import WaitlistPanel from "./components/WaitlistPanel";

type Tab = "agenda" | "empleados" | "espera";

export default function App() {
  const [tab, setTab] = useState<Tab>("agenda");

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">✂</span>
          <span>Chicomalo · Agenda</span>
        </div>
        <nav className="tabs">
          <button className={tab === "agenda" ? "active" : ""} onClick={() => setTab("agenda")}>
            Agenda
          </button>
          <button className={tab === "empleados" ? "active" : ""} onClick={() => setTab("empleados")}>
            Empleados
          </button>
          <button className={tab === "espera" ? "active" : ""} onClick={() => setTab("espera")}>
            Lista de espera
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === "agenda" && <AgendaView />}
        {tab === "empleados" && <EmployeesPage />}
        {tab === "espera" && <WaitlistPanel />}
      </main>
    </div>
  );
}
