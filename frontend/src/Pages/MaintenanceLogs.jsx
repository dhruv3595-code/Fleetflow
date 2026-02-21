import { useState, useEffect } from "react";
import "../Styles/global.css";
import { Sidebar } from './Dashboard';
import "../styles/modal.css";
import api from '../api';
import { FiTruck, FiTool, FiAlertCircle, FiCheckCircle, FiDollarSign, FiCalendar, FiUser } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

const TYPE_ICONS = { Van: <FiTruck size={16} />, Truck: <FiTruck size={16} />, Bike: <LuBike size={16} /> };
const SERVICE_TYPES = ["preventive", "reactive", "scheduled"];
const EMPTY_FORM = { vehicleId: "", type: "preventive", title: "", desc: "", cost: "", tech: "" };

export default function MaintenanceLogs({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, lRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/maintenance')
      ]);
      setVehicles(vRes.data);
      setLogs(lRes.data);
    } catch (err) {
      console.error("Error fetching maintenance data:", err);
    }
  };

  const handleSave = async () => {
    if (!form.vehicleId || !form.title || !form.cost) return;
    try {
      const vehicle = vehicles.find(v => v.id === form.vehicleId);
      const newLogId = `SV-${Date.now().toString().slice(-4)}`;

      await api.post('/maintenance', {
        id: newLogId,
        vehicleId: vehicle.id,
        type: form.type,
        title: form.title,
        desc: form.desc,
        date: new Date().toISOString().split("T")[0],
        cost: Number(form.cost),
        status: "in-shop",
        tech: form.tech || "In-house",
      });

      await api.put(`/vehicles/${vehicle.id}`, { status: "in-shop" });

      fetchData();
      setForm(EMPTY_FORM);
      setShowModal(false);
      setSuccessMsg(`Service log added — ${vehicle.name} moved to In Shop`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving maintenance log:", err);
    }
  };

  const handleComplete = async (logId) => {
    try {
      const log = logs.find(l => l.id === logId);
      await api.put(`/maintenance/${logId}`, { status: "completed" });
      await api.put(`/vehicles/${log.vehicleId}`, { status: "available" });
      fetchData();
    } catch (err) {
      console.error("Error completing maintenance:", err);
    }
  };

  const filtered = logs.filter(l => filter === "All" || l.type === filter.toLowerCase() || l.status === filter.toLowerCase());
  const inShopCount = logs.filter(l => l.status === "in-shop").length;
  const totalCost = logs.reduce((s, l) => s + l.cost, 0);
  const completedCount = logs.filter(l => l.status === "completed").length;

  return (
    <div className="app-shell">
      {/* ✅ permissions prop passed to Sidebar */}
      <Sidebar
        user={user}
        currentPage="maintenance"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Maintenance & Service Logs</div>
            <div className="topbar-sub">Preventative & reactive health tracking</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-pill">
              <div className="status-dot" style={{ background: "var(--danger)" }} />
              {inShopCount} In Shop
            </div>
          </div>
        </div>

        <div className="page-body">
          {successMsg && (
            <div className="in-shop-banner" style={{ background: "rgba(34,211,165,0.08)", borderColor: "rgba(34,211,165,0.2)", color: "var(--success)", marginBottom: 16 }}>
              ✅ {successMsg}
            </div>
          )}

          <div className="summary-strip" style={{ marginBottom: 20 }}>
            {[
              { icon: <FiTool size={18} />, val: logs.length, label: "Total Logs" },
              { icon: <FiAlertCircle size={18} />, val: inShopCount, label: "In Shop" },
              { icon: <FiCheckCircle size={18} />, val: completedCount, label: "Completed" },
              { icon: <FiDollarSign size={18} />, val: `₹${totalCost.toLocaleString()}`, label: "Total Spent" },
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

          <div className="maintenance-layout">
            {/* ── Left: Logs ── */}
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Service History</div>
                  <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }}
                    onClick={() => setShowModal(true)}>+ Log Service</button>
                </div>

                <div className="filter-bar">
                  {["All", "Preventive", "Reactive", "Scheduled", "In-shop", "Completed"].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                      onClick={() => setFilter(f)}>{f}</button>
                  ))}
                </div>

                <div style={{ padding: "12px 16px" }}>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontSize: 13 }}>No service logs found</div>
                  )}
                  {filtered.map(log => (
                    <div className="service-card" key={log.id}>
                      <div className="service-card-header">
                        <div className="service-card-title">{log.title}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className={`service-type-badge ${log.type}`}>{log.type}</span>
                          <span className={`status-pill ${log.status === "in-shop" ? "in-shop" : "available"}`}>
                            {log.status === "in-shop" ? "In Shop" : "Completed"}
                          </span>
                        </div>
                      </div>
                      <div className="service-card-meta">
                        <span>{TYPE_ICONS[vehicles.find(v => v.id === log.vehicleId)?.type] || "🚛"} {log.vehicleName}</span>
                        <span><FiCalendar size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {log.date}</span>
                        <span><FiUser size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {log.tech}</span>
                        <span><FiDollarSign size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> ₹{log.cost.toLocaleString()}</span>
                      </div>
                      {log.desc && <div className="service-card-desc">{log.desc}</div>}
                      <div className="service-card-footer">
                        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>{log.id}</span>
                        {log.status === "in-shop" && (
                          <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 11 }}
                            onClick={() => handleComplete(log.id)}><FiCheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Mark Complete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: In Shop Status ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title"><FiTool size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Currently In Shop</div>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {vehicles.filter(v => v.status === "in-shop").length === 0 && (
                    <div style={{ fontSize: 12, color: "var(--muted)", padding: "16px 0", textAlign: "center" }}>No vehicles in shop 🎉</div>
                  )}
                  {vehicles.filter(v => v.status === "in-shop").map(v => (
                    <div key={v.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)",
                      borderRadius: 10, marginBottom: 8
                    }}>
                      <span style={{ fontSize: 20 }}>{TYPE_ICONS[v.type]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                        <div style={{ fontSize: 10, color: "var(--danger)" }}>Hidden from Dispatcher</div>
                      </div>
                      <span className="status-pill in-shop">In Shop</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Cost Breakdown</div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  {["preventive", "reactive", "scheduled"].map(type => {
                    const typeLogs = logs.filter(l => l.type === type);
                    const typeCost = typeLogs.reduce((s, l) => s + l.cost, 0);
                    const pct = totalCost > 0 ? Math.round((typeCost / totalCost) * 100) : 0;
                    const colors = { preventive: "var(--success)", reactive: "var(--danger)", scheduled: "var(--accent)" };
                    return (
                      <div key={type} style={{ marginBottom: 16 }}>
                        <div className="util-bar-label">
                          <span style={{ textTransform: "capitalize" }}>{type}</span>
                          <span>₹{typeCost.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="util-bar-track">
                          <div className="util-bar-fill" style={{ width: `${pct}%`, background: colors[type] }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12, fontWeight: 700 }}>
                    <span>Total Maintenance Cost</span>
                    <span style={{ color: "var(--accent)" }}>₹{totalCost.toLocaleString()}</span>
                  </div>
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
              <div className="modal-title"><FiTool size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Log New Service</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="in-shop-banner">
                ⚠ Adding a service log will automatically move the vehicle to <strong>&nbsp;In Shop</strong> — hiding it from the Dispatcher.
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Vehicle</label>
                  <select value={form.vehicleId} onChange={e => setField("vehicleId", e.target.value)}>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.status})</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Service Type</label>
                  <select value={form.type} onChange={e => setField("type", e.target.value)}>
                    {SERVICE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label>Service Title</label>
                <input placeholder="e.g. Oil Change, Brake Pad Replace"
                  value={form.title} onChange={e => setField("title", e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Description</label>
                <input placeholder="Details about the service..."
                  value={form.desc} onChange={e => setField("desc", e.target.value)} />
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Cost (₹)</label>
                  <input type="number" placeholder="e.g. 1800"
                    value={form.cost} onChange={e => setField("cost", e.target.value)} />
                </div>
                <div className="modal-field">
                  <label>Technician / Garage</label>
                  <input placeholder="e.g. Ravi Auto Works"
                    value={form.tech} onChange={e => setField("tech", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Log Service</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}