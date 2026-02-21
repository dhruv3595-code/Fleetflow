import { useState, useEffect } from "react";
import "../Styles/global.css";
import "../styles/modal.css";
import { Sidebar } from './Dashboard';
import api from '../api';
import { FiUsers, FiCheckCircle, FiAlertTriangle, FiSearch, FiUserPlus, FiEdit, FiTruck, FiAlertOctagon } from "react-icons/fi";

const EMPTY_FORM = { name: "", license: "", category: "Van", expiry: "", phone: "" };
const CATEGORIES = ["Van", "Truck", "Bike"];

const daysUntil = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
const licenseValid = (expiry) => daysUntil(expiry) > 0;
const expiryColor = (days) => days < 0 ? "var(--danger)" : days < 30 ? "var(--warning)" : "var(--success)";
const scoreColor = (s) => s >= 85 ? "" : s >= 65 ? "mid" : "low";
const driverColor = (status) => ({ available: "var(--success)", "on-duty": "var(--accent)", "off-duty": "var(--muted)", suspended: "var(--danger)" }[status] || "var(--accent)");

export default function DriverProfiles({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [successMsg, setSuccessMsg] = useState("");

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (d) => {
    setEditTarget(d.id);
    // Format date string to YYYY-MM-DD for input type="date" if needed
    const fExpiry = d.expiry ? d.expiry.split('T')[0] : "";
    setForm({ name: d.name, license: d.license, category: d.category, expiry: fExpiry, phone: d.phone });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.license || !form.expiry) return;
    try {
      if (editTarget) {
        await api.put(`/ drivers / ${editTarget} `, { ...form });
      } else {
        const tempId = `DR - ${Date.now().toString().slice(-4)} `;
        await api.post('/drivers', { ...form, id: tempId, status: "available", trips: 0, safetyScore: 100 });
      }
      fetchDrivers();
      setShowModal(false);
      setSuccessMsg(editTarget ? `${form.name} updated` : `${form.name} added to fleet`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving driver:", err);
    }
  };

  const setStatus = async (d, status) => {
    try {
      await api.put(`/ drivers / ${d.id} `, { ...d, status });
      fetchDrivers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filtered = drivers.filter(d => {
    const matchFilter = filter === "All" || d.status === filter.toLowerCase().replace(" ", "-");
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.license && d.license.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const counts = {
    total: drivers.length,
    available: drivers.filter(d => d.status === "available").length,
    onDuty: drivers.filter(d => d.status === "on-duty").length,
    suspended: drivers.filter(d => d.status === "suspended").length,
    expiring: drivers.filter(d => daysUntil(d.expiry) < 30 && daysUntil(d.expiry) > 0).length,
  };

  return (
    <div className="app-shell">
      {/* ✅ permissions prop passed to Sidebar */}
      <Sidebar
        user={user}
        currentPage="drivers"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Driver Profiles</div>
            <div className="topbar-sub">HR & compliance management — license tracking & safety scores</div>
          </div>
          <div className="topbar-right">
            {counts.expiring > 0 && (
              <div className="topbar-pill" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.2)", color: "var(--warning)" }}>
                <FiAlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {counts.expiring} License{counts.expiring > 1 ? "s" : ""} Expiring Soon
              </div>
            )}
            <div className="topbar-pill"><div className="status-dot" />{counts.total} Drivers</div>
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
              { icon: <FiUsers size={18} />, val: counts.total, label: "Total Drivers" },
              { icon: <FiCheckCircle size={18} />, val: counts.available, label: "Available" },
              { icon: <FiTruck size={18} />, val: counts.onDuty, label: "On Duty" },
              { icon: <FiAlertTriangle size={18} />, val: counts.suspended, label: "Suspended" },
              { icon: <FiAlertTriangle size={18} />, val: counts.expiring, label: "Expiring Soon" },
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

          <div className="page-header">
            <div className="page-header-left">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", "Available", "On Duty", "Off Duty", "Suspended"].map(f => (
                  <button key={f} className={`filter - btn ${filter === f ? "active" : ""} `}
                    onClick={() => setFilter(f)}>{f}</button>
                ))}
                <div className="filter-search" style={{ marginLeft: 8 }}>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}><FiSearch size={12} /></span>
                  <input placeholder="Search name or license..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={openAdd}>+ Add Driver</button>
          </div>

          <div className="drivers-grid">
            {filtered.map(d => {
              const days = daysUntil(d.expiry);
              const valid = licenseValid(d.expiry);
              const pct = Math.min(Math.max((days / 365) * 100, 0), 100);
              return (
                <div className={`driver - card ${d.status === "suspended" ? "suspended" : ""} `}
                  key={d.id} style={{ "--driver-color": driverColor(d.status) }}>
                  <div className="driver-card-top">
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="driver-avatar">{d.name[0]}</div>
                      <div>
                        <div className="driver-name">{d.name}</div>
                        <div className="driver-id">{d.id} · {d.phone}</div>
                      </div>
                    </div>
                    <span className={`status - pill ${d.status} `}>{d.status.replace("-", " ")}</span>
                  </div>
                  {!valid && <div className="expired-banner">⛔ License expired — blocked from dispatch</div>}
                  <div className="driver-info-grid">
                    <div className="driver-info-item">
                      <div className="driver-info-label">License No.</div>
                      <div className="driver-info-val" style={{ fontSize: 11, fontFamily: "monospace" }}>{d.license}</div>
                    </div>
                    <div className="driver-info-item">
                      <div className="driver-info-label">Category</div>
                      <div className="driver-info-val">{d.category}</div>
                    </div>
                    <div className="driver-info-item">
                      <div className="driver-info-label">Trips Completed</div>
                      <div className="driver-info-val">{d.trips}</div>
                    </div>
                    <div className="driver-info-item">
                      <div className="driver-info-label">Expiry Date</div>
                      <div className="driver-info-val" style={{ color: expiryColor(days), fontSize: 11 }}>
                        {d.expiry} {days < 30 && days > 0 ? `(${days}d left)` : days < 0 ? "(Expired)" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="license-expiry-bar">
                    <div className="license-expiry-label">
                      <span>License Validity</span>
                      <span style={{ color: expiryColor(days) }}>{days < 0 ? "Expired" : `${days} days left`}</span>
                    </div>
                    <div className="util-bar-track">
                      <div className="util-bar-fill" style={{ width: `${pct}% `, background: expiryColor(days) }} />
                    </div>
                  </div>
                  <div className="driver-card-footer">
                    <div className="score-badge">
                      <span>Safety</span>
                      <span className={`score - val ${scoreColor(d.safetyScore)} `}>{d.safetyScore}</span>
                      <span style={{ fontSize: 9 }}>/100</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div className="duty-toggle-row">
                        {[
                          { label: "On", val: "available", cls: "active-on" },
                          { label: "Off", val: "off-duty", cls: "active-off" },
                          { label: "Sus", val: "suspended", cls: "active-sus" },
                        ].map(btn => (
                          <button key={btn.val}
                            className={`duty - btn ${d.status === btn.val || (btn.val === "available" && d.status === "on-duty") ? btn.cls : ""} `}
                            onClick={() => setStatus(d, btn.val)}>{btn.label}</button>
                        ))}
                      </div>
                      <button className="btn-edit" style={{ padding: "5px 10px", fontSize: 10 }}
                        onClick={() => openEdit(d)}>✏</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--muted)", padding: 60, fontSize: 13 }}>
                No drivers match the current filter
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editTarget ? <><FiEdit size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Edit Driver</> : <><FiUserPlus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Add New Driver</>}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-field">
                  <label>Full Name</label>
                  <input placeholder="e.g. Alex Sharma" value={form.name} onChange={e => setField("name", e.target.value)} />
                </div>
                <div className="modal-field">
                  <label>Phone</label>
                  <input type="text" maxLength={10} placeholder="e.g. 9876543210" value={form.phone} onChange={e => {
                    const val = e.target.value.replace(/\D/g, ''); // keep only digits
                    if (val.length <= 10) setField("phone", val);
                  }} />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>License Number</label>
                  <input placeholder="e.g. GJ-D-12345" value={form.license} onChange={e => setField("license", e.target.value)} />
                </div>
                <div className="modal-field">
                  <label>License Category</label>
                  <select value={form.category} onChange={e => setField("category", e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label>License Expiry Date</label>
                <input type="date" value={form.expiry} onChange={e => setField("expiry", e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>{editTarget ? "Save Changes" : "Add Driver"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}