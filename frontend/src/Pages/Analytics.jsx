import { useState, useEffect } from "react";
import "../Styles/global.css";
import { Sidebar } from './Dashboard';
import api from '../api';
import { FiTruck, FiUsers, FiDroplet, FiTrendingUp, FiTrendingDown, FiDownload, FiTool, FiPackage, FiFileText, FiDollarSign, FiClipboard } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

const TYPE_ICONS = { Van: <FiTruck size={18} />, Truck: <FiTruck size={18} />, Bike: <LuBike size={18} /> };
const DEFAULT_ACQUISITION_COST = { "Van": 800000, "Truck": 2500000, "Bike": 120000 };

const calcROI = (v, s) => {
  const profit = s.revenue - s.fuel - s.maintenance;
  return v.acquisitionCost > 0 ? ((profit / v.acquisitionCost) * 100).toFixed(1) : "0.0";
};
const fuelEff = (s) => s.kmDriven > 0 && s.fuel > 0 ? (s.kmDriven / (s.fuel / 106.5)).toFixed(1) : "—";
const maxVal = (arr, key) => Math.max(...arr.map(a => a[key]), 1);
const scoreColor = (s) => s >= 85 ? "var(--success)" : s >= 65 ? "var(--warning)" : "var(--danger)";

/* ── CSV helper: creates a downloadable CSV from headers + rows ── */
function downloadCSV(filename, headers, rows) {
  const escape = (val) => {
    const str = String(val ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Period helper: returns a cutoff Date for filtering ── */
function getPeriodCutoff(period) {
  const now = new Date();
  switch (period) {
    case "1M": return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3M": return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6M": return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1Y": return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default: return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  }
}

function getMonthsForPeriod(period) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const count = period === "1M" ? 1 : period === "3M" ? 3 : period === "1Y" ? 12 : 6;
  const arr = [];
  const d = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
    arr.push({ label: monthNames[past.getMonth()], m: past.getMonth(), y: past.getFullYear() });
  }
  return arr;
}

export default function Analytics({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [period, setPeriod] = useState("6M");
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vRes, tRes, eRes, mRes, dRes] = await Promise.all([
        api.get('/vehicles'), api.get('/trips'), api.get('/expenses'),
        api.get('/maintenance'), api.get('/drivers'),
      ]);
      setVehicles(vRes.data);
      setTrips(tRes.data);
      setExpenses(eRes.data);
      setMaintenance(mRes.data);
      setDrivers(dRes.data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    }
  };

  /* ══════════ PERIOD-FILTERED DATA ══════════ */
  const cutoff = getPeriodCutoff(period);

  const filteredTrips = trips.filter(t => new Date(t.date) >= cutoff);
  const filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoff);
  const filteredMaintenance = maintenance.filter(m => new Date(m.date) >= cutoff);

  /* ══════════ VEHICLE STATS (from filtered data) ══════════ */
  const VEHICLE_STATS = vehicles.map(v => {
    const vTrips = filteredTrips.filter(t => (t.vehicleId || t.vehicleid) === v.id);
    const vFuelExps = filteredExpenses.filter(e => (e.vehicleId || e.vehicleid) === v.id && e.type === "fuel");
    const vMaintExps = filteredExpenses.filter(e => (e.vehicleId || e.vehicleid) === v.id && e.type === "maintenance");
    const vMaintLogs = filteredMaintenance.filter(m => (m.vehicleId || m.vehicleid) === v.id);

    const fuel = vFuelExps.reduce((sum, e) => sum + parseFloat(e.cost || 0), 0);
    const maintFromExps = vMaintExps.reduce((sum, e) => sum + parseFloat(e.cost || 0), 0);
    const maintFromLogs = vMaintLogs.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0);
    const totalMaint = maintFromExps + maintFromLogs;

    const fuelLiters = vFuelExps.reduce((sum, e) => sum + parseFloat(e.liters || 0), 0);

    // Revenue: use real trip cargo data — ₹12/kg/km average, or ₹3000 base per trip
    const completedTrips = vTrips.filter(t => t.status === "completed");
    const revenue = completedTrips.reduce((sum, t) => {
      const cargo = parseFloat(t.cargo || 0);
      return sum + (cargo > 0 ? cargo * 12 : 3000);
    }, 0) + (vTrips.filter(t => t.status === "dispatched").length * 1500);

    return {
      id: v.id, name: v.name, type: v.type,
      revenue, fuel, maintenance: totalMaint,
      trips: vTrips.length, completedTrips: completedTrips.length,
      kmDriven: parseFloat(v.odometer || 0),
      fuelLiters,
    };
  });

  /* ══════════ MONTHLY CHARTS (period-aware) ══════════ */
  const monthBuckets = getMonthsForPeriod(period);

  const MONTHLY_FUEL = monthBuckets.map(m => {
    const cost = filteredExpenses.filter(e => {
      if (e.type !== "fuel") return false;
      const ed = new Date(e.date);
      return ed.getMonth() === m.m && ed.getFullYear() === m.y;
    }).reduce((s, e) => s + parseFloat(e.cost || 0), 0);
    return { month: m.label, cost };
  });

  const MONTHLY_TRIPS = monthBuckets.map(m => {
    const count = filteredTrips.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === m.m && td.getFullYear() === m.y;
    }).length;
    return { month: m.label, trips: count };
  });

  /* ══════════ DRIVER PERFORMANCE (from filtered data) ══════════ */
  const DRIVER_PERF = drivers.map(d => {
    const dTrips = filteredTrips.filter(t => (t.driverId || t.driverid) === d.id);
    const completedTrips = dTrips.filter(t => t.status === "completed");
    // Estimate km from completed trips: use avg trip distance (odometer/totalTrips per vehicle) or 0
    const kmEstimate = completedTrips.reduce((sum, t) => {
      const vehicle = vehicles.find(v => v.id === (t.vehicleId || t.vehicleid));
      if (vehicle && vehicle.odometer) {
        const vAllTrips = trips.filter(tr => (tr.vehicleId || tr.vehicleid) === vehicle.id);
        return sum + (vAllTrips.length > 0 ? Math.round(vehicle.odometer / vAllTrips.length) : 0);
      }
      return sum;
    }, 0);
    return {
      name: d.name,
      trips: dTrips.length,
      completedTrips: completedTrips.length,
      score: parseFloat(d.safetyscore || d.safetyScore || 0),
      kmDriven: kmEstimate,
      license: d.license || "",
      phone: d.phone || "",
      category: d.category || "",
      expiry: d.expiry || "",
    };
  });

  /* ══════════ KPI TOTALS ══════════ */
  const totalRevenue = VEHICLE_STATS.reduce((s, v) => s + v.revenue, 0);
  const totalFuel = VEHICLE_STATS.reduce((s, v) => s + v.fuel, 0);
  const totalMaint = VEHICLE_STATS.reduce((s, v) => s + v.maintenance, 0);
  const totalKm = VEHICLE_STATS.reduce((s, v) => s + v.kmDriven, 0);
  const totalLiters = VEHICLE_STATS.reduce((s, v) => s + v.fuelLiters, 0);
  const totalOpCost = totalFuel + totalMaint;
  const netProfit = totalRevenue - totalOpCost;
  const avgFuelEff = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : "0";

  const mxFuel = maxVal(MONTHLY_FUEL, "cost");
  const mxTrips = maxVal(MONTHLY_TRIPS, "trips");

  /* ══════════ FUEL EFFICIENCY TREND (km/L per month) ══════════ */
  const MONTHLY_FUEL_EFF = monthBuckets.map(m => {
    const mFuelLogs = filteredExpenses.filter(e => {
      if (e.type !== "fuel" || !e.liters) return false;
      const ed = new Date(e.date);
      return ed.getMonth() === m.m && ed.getFullYear() === m.y;
    });
    const liters = mFuelLogs.reduce((s, e) => s + parseFloat(e.liters || 0), 0);
    // km estimate from odometer spread across trips
    const mTrips = filteredTrips.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === m.m && td.getFullYear() === m.y;
    });
    const kmEst = mTrips.reduce((s, t) => {
      const v = vehicles.find(v => v.id === (t.vehicleId || t.vehicleid));
      const vAllTrips = trips.filter(tr => (tr.vehicleId || tr.vehicleid) === (v?.id));
      return s + (v && vAllTrips.length > 0 ? Math.round(parseFloat(v.odometer || 0) / vAllTrips.length) : 80);
    }, 0);
    const eff = liters > 0 ? parseFloat((kmEst / liters).toFixed(1)) : 0;
    return { month: m.label, eff };
  });

  /* ══════════ TOP 5 COSTLIEST VEHICLES ══════════ */
  const TOP5_COSTLY = [...VEHICLE_STATS]
    .map(v => ({ ...v, totalCost: v.fuel + v.maintenance }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);
  const mxCost = TOP5_COSTLY.length > 0 ? Math.max(...TOP5_COSTLY.map(v => v.totalCost)) : 1;

  /* ══════════ REAL CSV EXPORT FUNCTIONS ══════════ */
  const handleExport = (type) => {
    const dateStr = new Date().toISOString().split("T")[0];
    switch (type) {
      case "Full": {
        const headers = ["Vehicle", "Type", "Trips", "Completed", "Revenue (₹)", "Fuel Cost (₹)", "Maintenance (₹)", "Profit (₹)", "Odometer (km)"];
        const rows = VEHICLE_STATS.map(v => [
          v.name, v.type, v.trips, v.completedTrips, v.revenue, v.fuel, v.maintenance,
          v.revenue - v.fuel - v.maintenance, v.kmDriven
        ]);
        rows.push(["TOTAL", "", VEHICLE_STATS.reduce((s, v) => s + v.trips, 0), VEHICLE_STATS.reduce((s, v) => s + v.completedTrips, 0), totalRevenue, totalFuel, totalMaint, netProfit, totalKm]);
        downloadCSV(`fleet_analytics_${period}_${dateStr}.csv`, headers, rows);
        break;
      }
      case "Fuel": {
        const headers = ["Month", "Fuel Cost (₹)"];
        const rows = MONTHLY_FUEL.map(m => [m.month, m.cost]);
        rows.push(["TOTAL", MONTHLY_FUEL.reduce((s, m) => s + m.cost, 0)]);
        downloadCSV(`fuel_audit_${period}_${dateStr}.csv`, headers, rows);
        break;
      }
      case "Trips": {
        const headers = ["Month", "Trip Count"];
        const rows = MONTHLY_TRIPS.map(m => [m.month, m.trips]);
        rows.push(["TOTAL", MONTHLY_TRIPS.reduce((s, m) => s + m.trips, 0)]);
        downloadCSV(`trip_summary_${period}_${dateStr}.csv`, headers, rows);
        break;
      }
      case "Payroll": {
        const headers = ["Driver", "Category", "License", "Trips", "Completed", "KM Driven", "Safety Score", "Phone"];
        const rows = DRIVER_PERF.map(d => [d.name, d.category, d.license, d.trips, d.completedTrips, d.kmDriven, d.score, d.phone]);
        downloadCSV(`payroll_report_${period}_${dateStr}.csv`, headers, rows);
        break;
      }
      case "Health": {
        const headers = ["Vehicle", "Type", "Status", "Odometer (km)", "Maintenance Cost (₹)", "Last Service Date"];
        const rows = vehicles.map(v => {
          const vMaint = filteredMaintenance.filter(m => (m.vehicleId || m.vehicleid) === v.id);
          const cost = vMaint.reduce((s, m) => s + parseFloat(m.cost || 0), 0);
          const lastDate = vMaint.length > 0 ? vMaint.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date?.split("T")[0] : "N/A";
          return [v.name, v.type, v.status, v.odometer, cost, lastDate];
        });
        downloadCSV(`vehicle_health_${period}_${dateStr}.csv`, headers, rows);
        break;
      }
      case "PnL": {
        const headers = ["Category", "Amount (₹)"];
        const rows = [
          ["Total Revenue", totalRevenue],
          ["Fuel Cost", totalFuel],
          ["Maintenance Cost", totalMaint],
          ["Total Operational Cost", totalOpCost],
          ["Net Profit / Loss", netProfit],
          ["Profit Margin (%)", totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0],
        ];
        downloadCSV(`financial_pnl_${period}_${dateStr}.csv`, headers, rows);
        break;
      }
      case "Compliance": {
        const headers = ["Driver", "License No.", "Category", "License Expiry", "Safety Score", "Status", "Phone"];
        const rows = drivers.map(d => {
          const expiryDate = d.expiry ? d.expiry.split("T")[0] : "N/A";
          const daysLeft = d.expiry ? Math.ceil((new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
          const status = daysLeft <= 0 ? "EXPIRED" : daysLeft <= 30 ? "EXPIRING SOON" : "VALID";
          return [d.name, d.license, d.category, expiryDate, d.safetyscore || d.safetyScore || 0, status, d.phone];
        });
        downloadCSV(`driver_compliance_${dateStr}.csv`, headers, rows);
        break;
      }
      default:
        break;
    }
  };

  /* ══════════ FLEET COMPOSITION ══════════ */
  const byType = [
    { label: "Trucks", count: vehicles.filter(v => v.type === "Truck").length, color: "var(--accent)" },
    { label: "Vans", count: vehicles.filter(v => v.type === "Van").length, color: "var(--success)" },
    { label: "Bikes", count: vehicles.filter(v => v.type === "Bike").length, color: "#60a5fa" },
  ];
  const total = vehicles.length || 1;

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        currentPage="analytics"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Analytics & Financial Reports</div>
            <div className="topbar-sub">Data-driven decision making — ROI, fuel efficiency & performance</div>
          </div>
          <div className="topbar-right">
            {["1M", "3M", "6M", "1Y"].map(p => (
              <button key={p} className={`filter-btn ${period === p ? "active" : ""}`}
                style={{ padding: "5px 12px" }} onClick={() => setPeriod(p)}>{p}</button>
            ))}
            <button className="export-btn" onClick={() => handleExport("Full")}><FiDownload size={13} /> Export CSV</button>
          </div>
        </div>

        <div className="page-body">
          {/* ── KPI Cards ── */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: "Total Revenue", val: `₹${(totalRevenue / 1000).toFixed(0)}K`, sub: `Across all vehicles (${period})`, icon: <FiDollarSign size={18} />, color: "var(--success)" },
              { label: "Operational Cost", val: `₹${(totalOpCost / 1000).toFixed(0)}K`, sub: "Fuel + Maintenance combined", icon: <FiTrendingDown size={18} />, color: "var(--danger)" },
              { label: "Net Profit", val: `₹${(netProfit / 1000).toFixed(0)}K`, sub: "Revenue minus all costs", icon: <FiTrendingUp size={18} />, color: "var(--accent)" },
              { label: "Avg Fuel Efficiency", val: `${avgFuelEff} km/L`, sub: `Fleet avg across ${totalKm.toLocaleString()} km`, icon: <FiDroplet size={18} />, color: "#60a5fa" },
            ].map((k, i) => (
              <div key={i} className="kpi-card" style={{ "--kpi-color": k.color }}>
                <div className="kpi-header">
                  <span className="kpi-label">{k.label}</span>
                  <div className="kpi-icon">{k.icon}</div>
                </div>
                <div className="kpi-value" style={{ fontSize: 28 }}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Monthly Charts ── */}
          <div className="analytics-grid" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Monthly Fuel Cost</div>
                <button className="export-btn" style={{ padding: "5px 12px", fontSize: 10 }} onClick={() => handleExport("Fuel")}><FiDownload size={11} /> CSV</button>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                <div className="bar-chart">
                  {MONTHLY_FUEL.map(m => (
                    <div className="bar-col" key={m.month}>
                      <div className="bar-val" style={{ fontSize: 9 }}>₹{(m.cost / 1000).toFixed(0)}K</div>
                      <div className="bar-fill" style={{ height: `${(m.cost / mxFuel) * 100}%` }} />
                      <div className="bar-label">{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Monthly Trip Volume</div>
                <button className="export-btn" style={{ padding: "5px 12px", fontSize: 10 }} onClick={() => handleExport("Trips")}><FiDownload size={11} /> CSV</button>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                <div className="bar-chart">
                  {MONTHLY_TRIPS.map(m => (
                    <div className="bar-col" key={m.month}>
                      <div className="bar-val">{m.trips}</div>
                      <div className="bar-fill green" style={{ height: `${(m.trips / mxTrips) * 100}%` }} />
                      <div className="bar-label">{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Fuel Efficiency Trend + Top 5 Costliest Vehicles ── */}
          <div className="analytics-grid" style={{ marginBottom: 16 }}>
            {/* ── Fuel Efficiency Trend Line Chart ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><FiDroplet size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Fuel Efficiency Trend (km/L)</div>
              </div>
              <div style={{ padding: "16px 20px 12px" }}>
                {(() => {
                  const pts = MONTHLY_FUEL_EFF.filter(m => m.eff > 0);
                  if (pts.length === 0) return <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, padding: 24 }}>No fuel data for this period</div>;
                  const W = 400, H = 120, PAD = 28;
                  const maxE = Math.max(...pts.map(p => p.eff), 1);
                  const minE = Math.min(...pts.map(p => p.eff));
                  const xStep = pts.length > 1 ? (W - PAD * 2) / (pts.length - 1) : W - PAD * 2;
                  const toY = v => PAD + (1 - (v - minE) / (maxE - minE || 1)) * (H - PAD * 2);
                  const toX = i => PAD + i * xStep;
                  const polyPoints = pts.map((p, i) => `${toX(i)},${toY(p.eff)}`).join(" ");
                  const areaPoints = `${toX(0)},${H - 4} ` + pts.map((p, i) => `${toX(i)},${toY(p.eff)}`).join(" ") + ` ${toX(pts.length - 1)},${H - 4}`;
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130, overflow: "visible" }}>
                      {[0, 0.25, 0.5, 0.75, 1].map(f => {
                        const y = PAD + (1 - f) * (H - PAD * 2);
                        const val = (minE + f * (maxE - minE)).toFixed(1);
                        return (
                          <g key={f}>
                            <line x1={PAD} y1={y} x2={W - 4} y2={y} stroke="var(--border)" strokeWidth={0.5} />
                            <text x={PAD - 4} y={y + 3} fontSize={7} fill="var(--muted)" textAnchor="end">{val}</text>
                          </g>
                        );
                      })}
                      <polygon points={areaPoints} fill="rgba(251,146,60,0.10)" />
                      <polyline points={polyPoints} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={toX(i)} cy={toY(p.eff)} r={3} fill="var(--accent)" />
                          <text x={toX(i)} y={toY(p.eff) - 6} fontSize={7.5} fill="var(--accent)" textAnchor="middle">{p.eff}</text>
                          <text x={toX(i)} y={H} fontSize={7} fill="var(--muted)" textAnchor="middle">{p.month}</text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* ── Top 5 Costliest Vehicles ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><FiTrendingDown size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Top 5 Costliest Vehicles</div>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                {TOP5_COSTLY.length === 0
                  ? <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, padding: 24 }}>No expense data for this period</div>
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {TOP5_COSTLY.map((v, i) => (
                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ minWidth: 72, fontSize: 11, color: "var(--muted)", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                          <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: 4, height: 18, overflow: "hidden" }}>
                            <div style={{
                              width: `${Math.round((v.totalCost / mxCost) * 100)}%`,
                              height: "100%",
                              borderRadius: 4,
                              background: i === 0 ? "var(--danger)" : i === 1 ? "rgba(251,146,60,0.85)" : i === 2 ? "var(--accent)" : "var(--success)",
                              transition: "width 0.6s ease",
                            }} />
                          </div>
                          <div style={{ minWidth: 52, fontSize: 11, color: "var(--text)", fontWeight: 700, textAlign: "right" }}>
                            ₹{(v.totalCost / 1000).toFixed(1)}K
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* ── Vehicle ROI + Fleet Composition ── */}
          <div className="analytics-grid" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Vehicle ROI</div>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>(Revenue − Fuel − Maint) ÷ Acquisition Cost</span>
              </div>
              {vehicles.map(v => {
                const s = VEHICLE_STATS.find(vs => vs.id === v.id) || { revenue: 0, fuel: 0, maintenance: 0, trips: 0, kmDriven: 0, fuelLiters: 0 };
                const vConfig = { ...v, acquisitionCost: DEFAULT_ACQUISITION_COST[v.type] || 500000 };
                const roi = calcROI(vConfig, s);
                const profit = s.revenue - s.fuel - s.maintenance;
                return (
                  <div className="roi-row" key={v.id}>
                    <div className="roi-vehicle">
                      <span style={{ fontSize: 22 }}>{TYPE_ICONS[v.type]}</span>
                      <div>
                        <div className="roi-name">{v.name}</div>
                        <div className="roi-sub">{s.trips} trips · {s.kmDriven.toLocaleString()} km · ⛽ {fuelEff(s)} km/L</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className={`roi-val ${parseFloat(roi) >= 0 ? "positive" : "negative"}`}>{roi}%</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>₹{(profit / 1000).toFixed(0)}K profit</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Fleet Composition</div></div>
                <div style={{ padding: "16px 20px" }}>
                  <div className="donut-wrap">
                    <div className="donut" style={{
                      background: `conic-gradient(
                        var(--accent)  0% ${byType[0].count / total * 100}%,
                        var(--success) ${byType[0].count / total * 100}% ${(byType[0].count + byType[1].count) / total * 100}%,
                        #60a5fa ${(byType[0].count + byType[1].count) / total * 100}% 100%
                      )`
                    }}>
                      <div style={{
                        position: "absolute", width: 64, height: 64, background: "var(--surface)", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
                      }}>
                        <div className="donut-center-val">{vehicles.length}</div>
                        <div className="donut-center-label">Fleet</div>
                      </div>
                    </div>
                    <div className="donut-legend">
                      {byType.map(t => (
                        <div className="donut-legend-item" key={t.label}>
                          <div className="donut-legend-dot" style={{ background: t.color }} />
                          {t.label}
                          <span className="donut-legend-pct">{t.count} ({Math.round(t.count / total * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><div className="panel-title">Cost Split</div></div>
                <div style={{ padding: "16px 20px" }}>
                  {[
                    { label: "Fuel", val: totalFuel, color: "var(--warning)" },
                    { label: "Maintenance", val: totalMaint, color: "var(--accent)" },
                  ].map(c => {
                    const pct = totalOpCost > 0 ? Math.round((c.val / totalOpCost) * 100) : 0;
                    return (
                      <div key={c.label} style={{ marginBottom: 14 }}>
                        <div className="util-bar-label">
                          <span>{c.label}</span><span>₹{c.val.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="util-bar-track">
                          <div className="util-bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                    <span>Total Op. Cost</span>
                    <span style={{ color: "var(--accent)" }}>₹{totalOpCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Driver Performance ── */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-header">
              <div className="panel-title">Driver Performance</div>
              <button className="export-btn" style={{ padding: "5px 12px", fontSize: 10 }} onClick={() => handleExport("Payroll")}><FiDownload size={11} /> Payroll CSV</button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Driver</th><th>Trips</th><th>KM Driven</th><th>Avg KM/Trip</th><th>Safety Score</th><th>Performance</th></tr>
              </thead>
              <tbody>
                {DRIVER_PERF.sort((a, b) => b.score - a.score).map(d => {
                  const avgKm = d.trips > 0 ? Math.round(d.kmDriven / d.trips) : 0;
                  return (
                    <tr key={d.name}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,var(--accent),#c2410c)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff"
                          }}>
                            {d.name[0]}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace" }}>{d.trips}</td>
                      <td style={{ fontFamily: "monospace" }}>{d.kmDriven.toLocaleString()} km</td>
                      <td style={{ fontFamily: "monospace" }}>{avgKm} km</td>
                      <td>
                        <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(d.score) }}>{d.score}</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>/100</span>
                      </td>
                      <td style={{ width: 160 }}>
                        <div className="util-bar-track" style={{ marginBottom: 0 }}>
                          <div className="util-bar-fill" style={{ width: `${d.score}%`, background: scoreColor(d.score) }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── One-Click Exports ── */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title"><FiDownload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> One-Click Exports</div></div>
            <div style={{ display: "flex", gap: 12, padding: "16px 20px", flexWrap: "wrap" }}>
              {[
                { label: "Monthly Payroll Report", icon: <FiUsers size={13} />, type: "Payroll" },
                { label: "Fuel Audit CSV", icon: <FiDroplet size={13} />, type: "Fuel" },
                { label: "Vehicle Health Report", icon: <FiTool size={13} />, type: "Health" },
                { label: "Trip Summary", icon: <FiPackage size={13} />, type: "Trips" },
                { label: "Financial P&L Statement", icon: <FiDollarSign size={13} />, type: "PnL" },
                { label: "Driver Compliance Report", icon: <FiClipboard size={13} />, type: "Compliance" },
              ].map(e => (
                <button key={e.type} className="export-btn" onClick={() => handleExport(e.type)}>
                  {e.icon} {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}