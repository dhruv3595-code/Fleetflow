import { useState, useEffect } from "react";
import "../Styles/global.css";
import { Sidebar } from './Dashboard';
import "../styles/modal.css";
import api from '../api';
import { FiTruck, FiCheckCircle, FiMapPin, FiFlag, FiPackage, FiSearch, FiSend, FiUser } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

const TYPE_ICONS = { Van: <FiTruck size={14} />, Truck: <FiTruck size={14} />, Bike: <LuBike size={14} /> };
const EMPTY_FORM = { from: "", to: "", cargo: "", vehicleId: "", driverId: "" };

export default function TripDispatcher({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("All");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/trips')
      ]);
      setVehicles(vRes.data);

      // Compute license validity for drivers on the fly
      const _drivers = dRes.data.map(d => {
        const _days = Math.ceil((new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24));
        return { ...d, licenseValid: _days > 0 };
      });
      setDrivers(_drivers);
      setTrips(tRes.data);
    } catch (err) {
      console.error("Error fetching trip dispatcher data:", err);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
  const selectedDriver = drivers.find(d => d.id === form.driverId);
  const availableVehicles = vehicles.filter(v => v.status === "available");
  const availableDrivers = drivers.filter(d => d.status === "available");

  const getValidation = () => {
    if (!form.vehicleId || !form.driverId || !form.cargo) return null;
    const cargo = Number(form.cargo);
    const v = selectedVehicle;
    const d = selectedDriver;
    if (!v || !d) return null;
    if (!d.licenseValid) return { pass: false, msg: `⛔ Driver license expired — cannot dispatch` };
    if (cargo > v.capacity) return { pass: false, msg: `⛔ Cargo ${cargo}kg exceeds ${v.name} capacity of ${v.capacity}kg` };
    return { pass: true, msg: `✅ Check passed — ${cargo}kg < ${v.capacity}kg capacity. Ready to dispatch!` };
  };

  const validationResult = getValidation();

  const handleFieldChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleDispatch = async () => {
    if (!form.from || !form.to || !form.cargo || !form.vehicleId || !form.driverId) return;
    if (!validationResult?.pass) return;
    try {
      const v = selectedVehicle;
      const d = selectedDriver;
      const newTripId = `TR-${Date.now().toString().slice(-4)}`;

      await api.post('/trips', {
        id: newTripId,
        vehicleId: v.id,
        driverId: d.id,
        fromLocation: form.from,
        toLocation: form.to,
        cargo: Number(form.cargo),
        status: "dispatched",
        date: new Date().toISOString().split("T")[0]
      });

      await api.put(`/vehicles/${v.id}`, { status: "on-trip" });
      await api.put(`/drivers/${d.id}`, { status: "on-duty" });

      fetchData();
      setForm(EMPTY_FORM);
      setSuccessMsg(`Trip ${newTripId} dispatched successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error dispatching trip:", err);
    }
  };

  const handleComplete = async (tripId) => {
    try {
      const trip = trips.find(t => t.id === tripId);
      await api.put(`/trips/${tripId}`, { status: "completed" });
      await api.put(`/vehicles/${trip.vehicleId}`, { status: "available" });
      await api.put(`/drivers/${trip.driverId}`, { status: "available" });
      fetchData();
    } catch (err) {
      console.error("Error completing trip:", err);
    }
  };

  const handleCancel = async (tripId) => {
    try {
      const trip = trips.find(t => t.id === tripId);
      await api.put(`/trips/${tripId}`, { status: "cancelled" });
      if (trip.status === "dispatched") {
        await api.put(`/vehicles/${trip.vehicleId}`, { status: "available" });
        await api.put(`/drivers/${trip.driverId}`, { status: "available" });
      }
      fetchData();
    } catch (err) {
      console.error("Error cancelling trip:", err);
    }
  };

  const filtered = trips.filter(t => filter === "All" || t.status === filter.toLowerCase());
  const counts = {
    all: trips.length,
    draft: trips.filter(t => t.status === "draft").length,
    dispatched: trips.filter(t => t.status === "dispatched").length,
    completed: trips.filter(t => t.status === "completed").length,
    cancelled: trips.filter(t => t.status === "cancelled").length,
  };

  return (
    <div className="app-shell">
      {/* ✅ permissions prop passed to Sidebar */}
      <Sidebar
        user={user}
        currentPage="trips"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Trip Dispatcher</div>
            <div className="topbar-sub">Create & manage trips — Point A to Point B</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-pill"><div className="status-dot" />{counts.dispatched} Active Trips</div>
          </div>
        </div>

        <div className="page-body">
          {successMsg && (
            <div className="trip-status-bar success" style={{ marginBottom: 16 }}>✅ {successMsg}</div>
          )}

          <div className="summary-strip" style={{ gridTemplateColumns: "repeat(5,1fr)", marginBottom: 20 }}>
            {[
              { label: "Total Trips", val: counts.all, icon: <FiSearch size={18} /> },
              { label: "Draft", val: counts.draft, icon: <FiSearch size={18} /> },
              { label: "Dispatched", val: counts.dispatched, icon: <FiTruck size={18} /> },
              { label: "Completed", val: counts.completed, icon: <FiCheckCircle size={18} /> },
              { label: "Cancelled", val: counts.cancelled, icon: <FiFlag size={18} /> },
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

          <div className="trip-layout">
            {/* ── Left: Trip List ── */}
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">All Trips</div>
                </div>
                <div className="filter-bar">
                  {["All", "Draft", "Dispatched", "Completed", "Cancelled"].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                      onClick={() => setFilter(f)}>{f}</button>
                  ))}
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontSize: 13 }}>No trips found</div>
                  )}
                  {filtered.map(trip => (
                    <div className="trip-card" key={trip.id}>
                      <div className="trip-card-header">
                        <span className="trip-card-id">{trip.id} · {trip.date}</span>
                        <span className={`lifecycle-badge ${trip.status}`}>{trip.status}</span>
                      </div>
                      <div className="trip-card-route">
                        <span className="trip-point"><FiMapPin size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {trip.fromlocation}</span>
                        <div className="trip-arrow"><div className="trip-arrow-line" /></div>
                        <span className="trip-point"><FiFlag size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {trip.tolocation}</span>
                      </div>
                      <div className="trip-card-meta">
                        <span className="trip-meta-item">
                          {TYPE_ICONS[vehicles.find(v => v.id === trip.vehicleId)?.type] || <FiTruck size={14} />} {trip.vehicleName}
                        </span>
                        <span className="trip-meta-item"><FiUser size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {trip.driverName}</span>
                        <span className="trip-meta-item"><FiPackage size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {trip.cargo} kg</span>
                      </div>
                      {(trip.status === "dispatched" || trip.status === "draft") && (
                        <div className="trip-card-actions">
                          {trip.status === "dispatched" && (
                            <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 11 }}
                              onClick={() => handleComplete(trip.id)}><FiCheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Mark Complete</button>
                          )}
                          <button className="btn-danger" onClick={() => handleCancel(trip.id)}>✕ Cancel</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Create Trip Form ── */}
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">＋ Create New Trip</div>
                </div>
                <div style={{ padding: "20px" }}>
                  <div className="form-section-title">Route Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    <div className="modal-field">
                      <label>From</label>
                      <input placeholder="Origin depot" value={form.from}
                        onChange={e => handleFieldChange("from", e.target.value)} />
                    </div>
                    <div className="modal-field">
                      <label>To</label>
                      <input placeholder="Destination" value={form.to}
                        onChange={e => handleFieldChange("to", e.target.value)} />
                    </div>
                  </div>

                  <div className="modal-field" style={{ marginBottom: 20 }}>
                    <label>Cargo Weight (kg)</label>
                    <input type="number" placeholder="e.g. 450" value={form.cargo}
                      onChange={e => handleFieldChange("cargo", e.target.value)} />
                  </div>

                  <div className="form-section-title">Select Vehicle (Available Only)</div>
                  <div style={{ marginBottom: 20, maxHeight: 180, overflowY: "auto" }}>
                    {availableVehicles.length === 0 && (
                      <div style={{ fontSize: 11, color: "var(--muted)", padding: "10px 0" }}>No vehicles available</div>
                    )}
                    {availableVehicles.map(v => (
                      <div key={v.id}
                        className={`select-option-card ${form.vehicleId === v.id ? "selected" : ""}`}
                        onClick={() => handleFieldChange("vehicleId", v.id)}>
                        <span className="option-icon">{TYPE_ICONS[v.type]}</span>
                        <div className="option-info">
                          <div className="option-name">{v.name}</div>
                          <div className="option-sub">Max {v.capacity}kg · {v.type}</div>
                        </div>
                        <div className={`option-check ${form.vehicleId === v.id ? "checked" : ""}`}>
                          {form.vehicleId === v.id ? "✓" : ""}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-section-title">Select Driver (Available Only)</div>
                  <div style={{ marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
                    {availableDrivers.length === 0 && (
                      <div style={{ fontSize: 11, color: "var(--muted)", padding: "10px 0" }}>No drivers available</div>
                    )}
                    {availableDrivers.map(d => (
                      <div key={d.id}
                        className={`select-option-card ${form.driverId === d.id ? "selected" : ""} ${!d.licenseValid ? "disabled" : ""}`}
                        onClick={() => d.licenseValid && handleFieldChange("driverId", d.id)}>
                        <span className="option-icon">👤</span>
                        <div className="option-info">
                          <div className="option-name">{d.name}</div>
                          <div className="option-sub">
                            {d.licenseValid ? `License valid · Exp ${d.expiry}` : `⛔ License expired — ${d.expiry}`}
                          </div>
                        </div>
                        <div className={`option-check ${form.driverId === d.id ? "checked" : ""}`}>
                          {form.driverId === d.id ? "✓" : ""}
                        </div>
                      </div>
                    ))}
                  </div>

                  {validationResult && (
                    <div className={`validation-box ${validationResult.pass ? "pass" : "fail"}`} style={{ marginBottom: 16 }}>
                      {validationResult.msg}
                    </div>
                  )}

                  <button className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "13px" }}
                    onClick={handleDispatch}
                    disabled={!validationResult?.pass}>
                    <FiSend size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Dispatch Trip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}