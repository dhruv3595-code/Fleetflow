import { useState, useEffect } from "react";
import "../Styles/global.css";
import "../styles/modal.css";
import { Sidebar } from './Dashboard';
import api from '../api';

const EMPTY_FORM = { name: "", type: "Van", plate: "", capacity: "", odometer: "", region: "North" };
const REGIONS = ["North", "South", "East", "West", "Central"];
const TYPES = ["Van", "Truck", "Bike"];
import { FiTruck, FiCheckCircle, FiPackage, FiTool, FiSearch } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

const TYPE_ICONS = { Van: <FiTruck size={14} />, Truck: <FiTruck size={14} />, Bike: <LuBike size={14} /> };

export default function VehicleRegistry({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const filtered = vehicles.filter(v => {
    const matchType = typeFilter === "All" || v.type === typeFilter;
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.plate && v.plate.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

  const counts = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    onTrip: vehicles.filter(v => v.status === "on-trip").length,
    inShop: vehicles.filter(v => v.status === "in-shop").length,
  };

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (v) => {
    setEditTarget(v.id);
    setForm({ name: v.name, type: v.type, plate: v.plate, capacity: v.capacity, odometer: v.odometer, region: v.region });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name || !form.plate || !form.capacity || !form.odometer) return;
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        odometer: Number(form.odometer)
      };

      if (editTarget) {
        await api.put(`/vehicles/${editTarget}`, payload);
      } else {
        const tempId = `VH-${Date.now().toString().slice(-4)}`;
        await api.post('/vehicles', { ...payload, id: tempId, status: "available", retired: false });
      }
      fetchVehicles();
      closeModal();
    } catch (err) {
      console.error("Error saving vehicle:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleRetired = async (v) => {
    try {
      await api.put(`/vehicles/${v.id}`, {
        ...v,
        retired: !v.retired,
        status: !v.retired ? "in-shop" : "available"
      });
      fetchVehicles();
    } catch (err) {
      console.error("Error toggling retired:", err);
    }
  };

  return (
    <div className="app-shell">
      {/* ✅ permissions prop added */}
      <Sidebar
        user={user}
        currentPage="vehicles"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Vehicle Registry</div>
            <div className="topbar-sub">Manage physical fleet assets — CRUD operations</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-pill">
              <div className="status-dot" />
              {counts.total} Vehicles Total
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-header-title">Fleet Assets</div>
              <div className="page-header-sub">Add, edit, or retire vehicles from the active pool</div>
            </div>
            <button className="btn-primary" onClick={openAdd}>+ Add Vehicle</button>
          </div>

          <div className="summary-strip">
            <div className="summary-card">
              <div className="summary-icon"><FiTruck size={18} /></div>
              <div className="summary-info">
                <div className="summary-val">{counts.total}</div>
                <div className="summary-label">Total Fleet</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon"><FiCheckCircle size={18} /></div>
              <div className="summary-info">
                <div className="summary-val">{counts.available}</div>
                <div className="summary-label">Available</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon"><FiPackage size={18} /></div>
              <div className="summary-info">
                <div className="summary-val">{counts.onTrip}</div>
                <div className="summary-label">On Trip</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon"><FiTool size={18} /></div>
              <div className="summary-info">
                <div className="summary-val">{counts.inShop}</div>
                <div className="summary-label">In Shop</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">All Vehicles</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="filter-search">
                  <span style={{ color: "var(--muted)", fontSize: 12 }}><FiSearch size={12} /></span>
                  <input
                    placeholder="Search name or plate..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-bar">
              {["All", "Van", "Truck", "Bike"].map(t => (
                <button key={t} className={`filter-btn ${typeFilter === t ? "active" : ""}`}
                  onClick={() => setTypeFilter(t)}>{t}</button>
              ))}
              <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />
              {["All", "available", "on-trip", "in-shop"].map(s => (
                <button key={s} className={`filter-btn ${statusFilter === s ? "active" : ""}`}
                  onClick={() => setStatus(s)}>
                  {s === "All" ? "All Status" : s.replace("-", " ")}
                </button>
              ))}
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th><th>Name & Type</th><th>License Plate</th>
                  <th>Capacity</th><th>Odometer</th><th>Region</th>
                  <th>Status</th><th>Out of Service</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} style={{ opacity: v.retired ? 0.5 : 1 }}>
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{v.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{TYPE_ICONS[v.type]}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{v.type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{v.plate}</td>
                    <td>{v.capacity.toLocaleString()} kg</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{v.odometer.toLocaleString()} km</td>
                    <td>{v.region}</td>
                    <td><span className={`status-pill ${v.status}`}>{v.status.replace("-", " ")}</span></td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={v.retired} onChange={() => toggleRetired(v)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="btn-edit" onClick={() => openEdit(v)}>✏ Edit</button>
                        {deleteConfirm === v.id ? (
                          <>
                            <button className="btn-danger" onClick={() => handleDelete(v.id)}>Confirm</button>
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}
                              style={{ padding: "7px 10px", fontSize: 11 }}>✕</button>
                          </>
                        ) : (
                          <button className="btn-danger" onClick={() => setDeleteConfirm(v.id)}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
                      No vehicles match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editTarget ? "✏ Edit Vehicle" : "＋ Add New Vehicle"}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-field">
                  <label>Vehicle Name</label>
                  <input placeholder="e.g. Van-05" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>License Plate</label>
                  <input placeholder="e.g. GJ-01-AB-1234" value={form.plate}
                    onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>Region</label>
                  <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Max Capacity (kg)</label>
                  <input type="number" placeholder="e.g. 500" value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>Odometer (km)</label>
                  <input type="number" placeholder="e.g. 42310" value={form.odometer}
                    onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {editTarget ? "Save Changes" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}