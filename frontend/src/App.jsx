import { useState, useEffect } from 'react'
import LoginPage from './Pages/Loginpage'
import Dashboard from './Pages/Dashboard'
import VehicleRegistry from './Pages/VehicleRegistry'
import TripDispatcher from './Pages/TripDispatcher'
import MaintenanceLogs from './Pages/MaintenanceLogs'
import FuelExpenses from './Pages/FuelExpenses'
import DriverProfiles from './Pages/DriverProfiles'
import Analytics from './Pages/Analytics'
import './Styles/global.css'

// ── Role-Based Access Control ─────────────────────────────
// Defines which pages each role can access
export const ROLE_PERMISSIONS = {
  Manager:    ["dashboard", "vehicles", "trips", "maintenance", "fuel", "drivers", "analytics"],
  Dispatcher: ["dashboard", "vehicles", "trips", "drivers"],
  Safety:     ["dashboard", "maintenance", "drivers"],
  Analyst:    ["dashboard", "fuel", "analytics"],
}

export const canAccess = (role, page) => {
  return ROLE_PERMISSIONS[role]?.includes(page) ?? false
}
// ─────────────────────────────────────────────────────────

function App() {
  const [user,  setUser]  = useState(null)
  const [page,  setPage]  = useState("dashboard")
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fleetflow-theme") || "dark"
  })

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light")
    } else {
      root.classList.remove("light")
    }
    localStorage.setItem("fleetflow-theme", theme)
  }, [theme])

  const handleLogin  = (userData) => { setUser(userData); setPage("dashboard") }
  const handleLogout = () => { setUser(null); setPage("dashboard") }
  const handleToggle = () => setTheme(t => t === "dark" ? "light" : "dark")

  // Guard: if user tries to navigate to a page they can't access, block it
  const handleNavigate = (targetPage) => {
    if (canAccess(user?.role, targetPage)) {
      setPage(targetPage)
    }
  }

  if (!user) return <LoginPage onLogin={handleLogin} />

  // If current page is not accessible (e.g. after role switch), fallback to dashboard
  if (!canAccess(user.role, page)) {
    setPage("dashboard")
    return null
  }

  const props = {
    user,
    onNavigate:    handleNavigate,
    onLogout:      handleLogout,
    theme,
    onToggleTheme: handleToggle,
    permissions:   ROLE_PERMISSIONS[user.role] ?? [],
  }

  switch (page) {
    case "dashboard":   return <Dashboard      {...props} />
    case "vehicles":    return <VehicleRegistry {...props} />
    case "trips":       return <TripDispatcher  {...props} />
    case "maintenance": return <MaintenanceLogs {...props} />
    case "fuel":        return <FuelExpenses    {...props} />
    case "drivers":     return <DriverProfiles  {...props} />
    case "analytics":   return <Analytics       {...props} />
    default:            return <Dashboard       {...props} />
  }
}

export default App