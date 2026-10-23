import { useState } from "react";
import FlaggedQueue from "./components/FlaggedQueue";
import SubmitTransaction from "./components/SubmitTransaction";

type Tab = "queue" | "submit";

export default function App() {
  const [tab, setTab] = useState<Tab>("queue");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <div className="brand-title">RiskPulse</div>
            <div className="brand-sub">Fraud &amp; Risk Operations</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-group">
            <button
              className={`nav-item ${tab === "queue" ? "is-active" : ""}`}
              onClick={() => setTab("queue")}
            >
              Flagged Queue
            </button>
            <button
              className={`nav-item ${tab === "submit" ? "is-active" : ""}`}
              onClick={() => setTab("submit")}
            >
              Submit Transaction
            </button>
          </div>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">RiskPulse Console</div>
        </header>
        <main>{tab === "queue" ? <FlaggedQueue /> : <SubmitTransaction />}</main>
      </div>
    </div>
  );
}
