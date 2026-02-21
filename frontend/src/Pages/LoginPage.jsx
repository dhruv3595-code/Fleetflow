import { useState, useEffect } from "react";
import "../Styles/global.css";
import { FiSun, FiMoon, FiTruck, FiMail, FiLock, FiAlertTriangle, FiShield, FiUserPlus, FiX } from "react-icons/fi";

const ROLES = ["Manager", "Dispatcher", "Safety", "Analyst"];

const DEMO_CREDS = {
  Manager: { email: "manager@fleetflow.io", pass: "fleet123" },
  Dispatcher: { email: "dispatch@fleetflow.io", pass: "fleet123" },
  Safety: { email: "safety@fleetflow.io", pass: "fleet123" },
  Analyst: { email: "analyst@fleetflow.io", pass: "fleet123" },
};

const FEATURES = [
  "Real-time Tracking",
  "Driver Compliance",
  "Smart Dispatch",
  "Fuel Analytics",
  "Maintenance Logs",
  "Financial Reports",
];

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState("Manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Register Modal State ────────────────────────────────
  const [showRegister, setShowRegister] = useState(false);
  const [regRole, setRegRole] = useState("Manager");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // ── Theme ──────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("fleetflow-theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("fleetflow-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("fleetflow-theme", "light");
    }
  }, [isDark]);

  // ── Scroll fix: allow scrolling on login page ──────────
  useEffect(() => {
    // Allow scroll on login page
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";

    return () => {
      // Restore overflow:hidden when leaving login page (for dashboard)
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };
  }, []);
  // ───────────────────────────────────────────────────────

  const handleRoleChange = (r) => {
    setRole(r);
    setError("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();

      if (res.ok) {
        onLogin && onLogin({ role: data.role, email: data.email, id: data.id });
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    const creds = DEMO_CREDS[role];
    setEmail(creds.email);
    setPassword(creds.pass);
  };

  const openRegister = () => {
    setRegError("");
    setRegSuccess("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
    setRegRole("Manager");
    setShowRegister(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    if (regPassword.length < 4) { setRegError("Password must be at least 4 characters."); return; }
    setRegLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword, role: regRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegSuccess(`Account created! You can now sign in as ${data.role}.`);
        setTimeout(() => { setShowRegister(false); setRole(regRole); setEmail(regEmail); }, 1800);
      } else {
        setRegError(data.error || "Registration failed.");
      }
    } catch {
      setRegError("Failed to connect to server.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Background */}
      <div className="grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Theme Toggle Button (fixed top-right) ── */}
      <button
        className="login-theme-btn"
        onClick={() => setIsDark(!isDark)}
        title="Toggle theme"
      >
        {isDark ? <><FiSun size={14} /> Light Mode</> : <><FiMoon size={14} /> Dark Mode</>}
      </button>

      {/* ── Left Panel ── */}
      <div className="left-panel fade-in">
        <div className="brand">
          <div className="brand-icon"><FiTruck size={28} /></div>
          <div className="brand-name">Fleet<span>Flow</span></div>
        </div>

        <div className="left-center">
          <div className="hero-tag">
            <div className="dot" />
            Fleet Operations System
          </div>

          <h1 className="hero-title">
            Drive Your<br />
            Fleet <span className="highlight">Smarter.</span>
          </h1>

          <p className="hero-sub">
            Centralized logistics hub for real-time vehicle tracking,
            driver compliance, dispatch management, and financial reporting.
            Replace manual logbooks with a rule-based digital hub.
          </p>

          <div className="feature-pills">
            {FEATURES.map((f) => (
              <div className="pill" key={f}>
                <div className="pill-dot" />
                {f}
              </div>
            ))}
          </div>

          <div className="stats-row">
            <div className="stat">
              <div className="stat-val">99<span>%</span></div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat">
              <div className="stat-val">4<span>x</span></div>
              <div className="stat-label">Faster Dispatch</div>
            </div>
            <div className="stat">
              <div className="stat-val">0</div>
              <div className="stat-label">Logbooks</div>
            </div>
          </div>
        </div>

        <div className="left-footer">
          <div className="status-dot" />
          All systems operational &nbsp;·&nbsp; v1.0.0 &nbsp;·&nbsp; FleetFlow © 2026
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="right-panel fade-in">
        <div className="form-header">
          <div className="form-title">Welcome back</div>
          <div className="form-sub">
            Sign in to your role-based workspace.<br />
            Select your role to continue.
          </div>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          {ROLES.map((r) => (
            <button
              key={r}
              className={`role-btn ${role === r ? "active" : ""}`}
              onClick={() => handleRoleChange(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email Address</label>
            <div className="input-wrap">
              <span className="input-icon"><FiMail size={14} /></span>
              <input
                type="email"
                placeholder={`${role.toLowerCase()}@fleetflow.io`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <span className="input-icon"><FiLock size={14} /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="forgot">
            <a href="#">Forgot Password?</a>
          </div>

          {error && <div className="error-msg"><FiAlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {error}</div>}

          <button
            type="submit"
            className={`submit-btn ${loading ? "loading" : ""}`}
          >
            {loading
              ? <><span className="spinner" />Authenticating...</>
              : `Sign in as ${role}`
            }
          </button>
        </form>

        <div className="divider">or</div>

        <div className="status-bar" onClick={fillDemo}>
          <div className="status-dot" />
          Click to autofill demo credentials for&nbsp;<strong>{role}</strong>
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Don't have an account? </span>
          <button
            onClick={openRegister}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            Register
          </button>
        </div>

        <div className="security-note">
          <FiShield size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> &nbsp; Secured with Role-Based Access Control (RBAC)
        </div>
      </div>

      {/* ── Register Modal ── */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: "100%" }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiUserPlus size={16} /> Create Account
              </div>
              <button className="modal-close" onClick={() => setShowRegister(false)}><FiX size={16} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRegister}>

                {/* Role Dropdown */}
                <div className="field" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Role</label>
                  <div className="input-wrap" style={{ marginTop: 6 }}>
                    <select
                      value={regRole}
                      onChange={e => setRegRole(e.target.value)}
                      style={{
                        width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: 8, color: "var(--text)", fontSize: 13, padding: "10px 14px",
                        outline: "none", cursor: "pointer", appearance: "none"
                      }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div className="field" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
                  <div className="input-wrap" style={{ marginTop: 6 }}>
                    <span className="input-icon"><FiMail size={14} /></span>
                    <input type="email" placeholder="you@company.com" value={regEmail}
                      onChange={e => setRegEmail(e.target.value)} required />
                  </div>
                </div>

                {/* Password */}
                <div className="field" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
                  <div className="input-wrap" style={{ marginTop: 6 }}>
                    <span className="input-icon"><FiLock size={14} /></span>
                    <input type="password" placeholder="Choose a password" value={regPassword}
                      onChange={e => setRegPassword(e.target.value)} required minLength={4} />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="field" style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Confirm Password</label>
                  <div className="input-wrap" style={{ marginTop: 6 }}>
                    <span className="input-icon"><FiLock size={14} /></span>
                    <input type="password" placeholder="Re-enter password" value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)} required minLength={4} />
                  </div>
                </div>

                {regError && (
                  <div className="error-msg" style={{ marginBottom: 12 }}>
                    <FiAlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {regError}
                  </div>
                )}
                {regSuccess && (
                  <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#22c55e", marginBottom: 12 }}>
                    {regSuccess}
                  </div>
                )}

                <button type="submit" className={`submit-btn ${regLoading ? "loading" : ""}`} disabled={regLoading}
                  style={{ width: "100%" }}>
                  {regLoading ? <><span className="spinner" />Creating account...</> : `Register as ${regRole}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}