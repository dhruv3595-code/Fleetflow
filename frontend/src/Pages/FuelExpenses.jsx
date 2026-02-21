import { useState, useEffect } from "react";
import "../Styles/global.css";
import "../styles/modal.css";
import { Sidebar } from './Dashboard';

import api from '../api';
import { FiTruck, FiDollarSign, FiDroplet, FiTool } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

const TYPE_ICONS = { Van: <FiTruck size={14} />, Truck: <FiTruck size={14} />, Bike: <LuBike size={14} /> };
const EMPTY_FORM = { vehicleId: "", type: "fuel", date: "", liters: "", pricePerL: "106.5", cost: "", tripId: "", note: "" };

export default function FuelExpenses({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("All");
  const [vFilter, setVFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const setField = (k, v) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      if ((k === "liters" || k === "pricePerL") && updated.type === "fuel") {
        const l = parseFloat(k === "liters" ? v : updated.liters);
        const p = parseFloat(k === "pricePerL" ? v : updated.pricePerL);
        if (!isNaN(l) && !isNaN(p)) updated.cost = (l * p).toFixed(2);
      }
      return updated;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, eRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/expenses')
      ]);
      setVehicles(vRes.data);
      setLogs(eRes.data);
    } catch (err) {
      console.error("Error fetching fuel expenses data:", err);
    }
  };

  const handleSave = async () => {
    if (!form.vehicleId || !form.cost || !form.date) return;
    try {
      const vehicle = vehicles.find(v => v.id === form.vehicleId);
      const newLogId = `EX-${Date.now().toString().slice(-4)}`;

      await api.post('/expenses', {
        id: newLogId,
        vehicleId: form.vehicleId,
        type: form.type,
        date: form.date,
        liters: form.liters ? parseFloat(form.liters) : null,
        pricePerL: form.pricePerL ? parseFloat(form.pricePerL) : null,
        tripId: form.tripId || null,
        cost: parseFloat(form.cost),
        note: form.note,
      });

      fetchData();
      setForm(EMPTY_FORM);
      setShowModal(false);
      setSuccessMsg(`Expense logged for ${vehicle?.name || 'Vehicle'} — ₹${parseFloat(form.cost).toLocaleString()}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving expense:", err);
    }
  };

  const totalCost = logs.reduce((s, l) => s + parseFloat(l.cost || 0), 0);
  const fuelCost = logs.filter(l => l.type === "fuel").reduce((s, l) => s + parseFloat(l.cost || 0), 0);
  const maintCost = logs.filter(l => l.type === "maintenance").reduce((s, l) => s + parseFloat(l.cost || 0), 0);
  const totalLiters = logs.filter(l => l.liters).reduce((s, l) => s + parseFloat(l.liters || 0), 0);

  const vehicleCosts = vehicles.map(v => ({
    ...v,
    fuel: logs.filter(l => l.vehicleId === v.id && l.type === "fuel").reduce((s, l) => s + parseFloat(l.cost), 0),
    maintenance: logs.filter(l => l.vehicleId === v.id && l.type === "maintenance").reduce((s, l) => s + parseFloat(l.cost), 0),
    total: logs.filter(l => l.vehicleId === v.id).reduce((s, l) => s + parseFloat(l.cost), 0),
  })).sort((a, b) => b.total - a.total);

  const filtered = logs.filter(l => {
    const matchType = filter === "All" || l.type === filter.toLowerCase();
    const matchV = vFilter === "All" || l.vehicleId === vFilter;
    return matchType && matchV;
  });

  return (
    <div className="app-shell">
      {/* ✅ permissions prop passed to Sidebar */}
      <Sidebar
        user={user}
        currentPage="fuel"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Fuel & Expense Logs</div>
            <div className="topbar-sub">Financial tracking per asset — fuel, maintenance & tolls</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-pill"><div className="status-dot" />₹{totalCost.toLocaleString()} Total Spend</div>
          </div>
        </div>

        <div className="page-body">
          {successMsg && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              background: "rgba(34,211,165,0.08)", border: "1px solid rgba(34,211,165,0.2)",
              borderRadius: 10, fontSize: 11, color: "var(--success)", marginBottom: 16
            }}>
              ✅ {successMsg}
            </div>
          )}

          <div className="summary-strip" style={{ marginBottom: 20 }}>
            {[
              { icon: <FiDollarSign size={18} />, val: `₹${totalCost.toLocaleString()}`, label: "Total Operational Cost" },
              { icon: <FiDroplet size={18} />, val: `₹${fuelCost.toLocaleString()}`, label: "Fuel Cost" },
              { icon: <FiTool size={18} />, val: `₹${maintCost.toLocaleString()}`, label: "Maintenance Cost" },
              { icon: <FiDroplet size={18} />, val: `${totalLiters.toFixed(0)}L`, label: "Total Fuel Used" },
            ].map(s => (
              <div className="summary-card" key={s.label}>
                <div className="summary-icon">{s.icon}</div>
                <div className="summary-info">
                  <div className="summary-val">{s.val}</div>
                  <div className="summary-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="fuel-layout">
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Expense Records</div>
                  <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }}
                    onClick={() => setShowModal(true)}>+ Log Expense</button>
                </div>

                <div className="filter-bar">
                  {["All", "Fuel", "Maintenance", "Toll", "Other"].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                      onClick={() => setFilter(f)}>{f}</button>
                  ))}
                  <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />
                  <select style={{
                    background: "transparent", border: "1px solid var(--border)", borderRadius: 6,
                    padding: "4px 8px", color: "var(--text)", fontSize: 11, outline: "none", cursor: "pointer"
                  }}
                    value={vFilter} onChange={e => setVFilter(e.target.value)}>
                    <option value="All">All Vehicles</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Vehicle</th><th>Type</th><th>Liters</th><th>Rate/L</th><th>Total Cost</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{log.date}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{TYPE_ICONS[vehicles.find(v => v.id === log.vehicleId)?.type] || "🚛"}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 12 }}>{log.vehicleName}</div>
                              <div style={{ fontSize: 10, color: "var(--muted)" }}>{log.vehicleId}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`expense-type-badge ${log.type}`}>{log.type}</span></td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{log.liters ? `${log.liters}L` : "—"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{log.pricePerL ? `₹${log.pricePerL}` : "—"}</td>
                        <td><span className="fuel-cost-tag">₹{parseFloat(log.cost).toLocaleString()}</span></td>
                        <td style={{ fontSize: 11, color: "var(--muted)", maxWidth: 160 }}>{log.note || "—"}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No expense records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Cost per Vehicle</div></div>
                <div>
                  {vehicleCosts.map(v => (
                    <div className="vehicle-cost-row" key={v.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{TYPE_ICONS[v.type]}</span>
                        <div>
                          <div className="vehicle-cost-name">{v.name}</div>
                          <div className="vehicle-cost-sub"><FiDroplet size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} /> ₹{v.fuel.toLocaleString()} &nbsp;·&nbsp; <FiTool size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} /> ₹{v.maintenance.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="vehicle-cost-amount">₹{v.total.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><div className="panel-title"><FiDroplet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Fuel Efficiency</div></div>
                <div style={{ padding: "16px 20px" }}>
                  {vehicles.map(v => {
                    const vLogs = logs.filter(l => l.vehicleId === v.id && l.type === "fuel" && l.liters);
                    const liters = vLogs.reduce((s, l) => s + l.liters, 0);
                    const km = { "VH-001": 380, "VH-002": 620, "VH-003": 95, "VH-004": 0, "VH-005": 210 }[v.id] || 0;
                    const eff = liters > 0 && km > 0 ? (km / liters).toFixed(1) : null;
                    return (
                      <div key={v.id} style={{ marginBottom: 14 }}>
                        <div className="util-bar-label">
                          <span>{TYPE_ICONS[v.type]} {v.name}</span>
                          <span style={{ color: eff ? "var(--success)" : "var(--muted)" }}>{eff ? `${eff} km/L` : "N/A"}</span>
                        </div>
                        <div className="util-bar-track">
                          <div className="util-bar-fill green" style={{ width: eff ? `${Math.min(parseFloat(eff) / 15 * 100, 100)}%` : "0%" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><FiDroplet size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Log Expense</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-field">
                  <label>Vehicle</label>
                  <select value={form.vehicleId} onChange={e => setField("vehicleId", e.target.value)}>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Expense Type</label>
                  <select value={form.type} onChange={e => setField("type", e.target.value)}>
                    <option value="fuel">Fuel</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="toll">Toll</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setField("date", e.target.value)} />
                </div>
                <div className="modal-field">
                  <label>Trip ID (optional)</label>
                  <input placeholder="e.g. TR-001" value={form.tripId} onChange={e => setField("tripId", e.target.value)} />
                </div>
              </div>
              {form.type === "fuel" && (
                <div className="modal-row">
                  <div className="modal-field">
                    <label>Liters</label>
                    <input type="number" placeholder="e.g. 42" value={form.liters} onChange={e => setField("liters", e.target.value)} />
                  </div>
                  <div className="modal-field">
                    <label>Price per Liter (₹)</label>
                    <input type="number" placeholder="e.g. 106.5" value={form.pricePerL} onChange={e => setField("pricePerL", e.target.value)} />
                  </div>
                </div>
              )}
              <div className="modal-field">
                <label>Total Cost (₹) {form.type === "fuel" ? "— Auto calculated" : ""}</label>
                <input type="number" placeholder="e.g. 4473" value={form.cost} onChange={e => setField("cost", e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Note</label>
                <input placeholder="e.g. Full tank after Rajkot trip" value={form.note} onChange={e => setField("note", e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}