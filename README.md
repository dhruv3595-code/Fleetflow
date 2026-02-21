# 🚛 FleetFlow — Smart Fleet Management System

> A modern, full-stack fleet management dashboard built to streamline vehicle tracking, trip dispatching, driver management, maintenance logging, and fuel expense analytics — all from one place.

---

## 🔥 Why FleetFlow?

Managing a fleet shouldn't feel like juggling spreadsheets. **FleetFlow** brings everything under a single, beautiful dashboard — from assigning drivers to tracking fuel costs — so your team can focus on what matters: keeping things moving.

Whether you're a **fleet manager** overseeing the big picture, a **dispatcher** routing trips on the fly, a **safety officer** monitoring driver compliance, or an **analyst** digging into cost trends — FleetFlow gives you exactly the tools you need, nothing more, nothing less.

---

## ✨ Features

### 🔐 Role-Based Access Control
Four distinct roles, each with tailored permissions:

| Role         | Access                                                 |
|--------------|--------------------------------------------------------|
| **Manager**  | Full access — Dashboard, Vehicles, Trips, Maintenance, Fuel, Drivers, Analytics |
| **Dispatcher** | Dashboard, Vehicles, Trips, Drivers                   |
| **Safety**   | Dashboard, Maintenance, Drivers                        |
| **Analyst**  | Dashboard, Fuel Expenses, Analytics                    |

### 📊 Interactive Dashboard
Live KPIs, fleet status at a glance, and quick-action cards that adapt to your role.

### 🚗 Vehicle Registry
Add, edit, and retire vehicles. Track odometer readings, capacity, plate numbers, regional assignments, and real-time availability status.

### 🗺️ Trip Dispatcher
Create and manage trips with origin/destination routing, cargo tracking, vehicle & driver assignment, and status updates (draft → in-transit → completed).

### 👷 Driver Profiles
Full driver management — license tracking, category classification, expiry alerts, trip history, safety scores, and contact info.

### 🔧 Maintenance Logs
Log maintenance events per vehicle — track service type, cost, assigned technician, and job status (in-shop → completed).

### ⛽ Fuel Expenses
Record fuel transactions tied to specific vehicles and trips. Track liters, price per liter, total cost, and add notes for auditing.

### 📈 Analytics
Visual breakdowns of fleet performance, cost trends, and operational metrics to help you make data-driven decisions.

### 🌗 Light / Dark Mode
Toggle between light and dark themes — because your eyes deserve a break during those late-night dispatches.

---

## 🛠️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| **Frontend**  | React 19, Vite 7, React Icons, Axios |
| **Backend**   | Node.js, Express 5                |
| **Database**  | PostgreSQL                        |
| **Styling**   | Custom CSS with dark/light theming |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (running locally or via a cloud provider)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/dhruv3595-code/Fleetflow.git
cd Fleetflow
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/fleetflow
PORT=5000
```

Initialize the database tables and seed demo users:

```bash
node initDb.js
```

Start the backend server:

```bash
npm start
```

### 3. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be running at **http://localhost:5173** 🎉

---

## 🔑 Demo Accounts

Use these credentials to explore the app right away:

| Role         | Email                        | Password   |
|--------------|------------------------------|------------|
| Manager      | manager@fleetflow.io         | fleet123   |
| Dispatcher   | dispatch@fleetflow.io        | fleet123   |
| Safety       | safety@fleetflow.io          | fleet123   |
| Analyst      | analyst@fleetflow.io         | fleet123   |

---

## 📁 Project Structure

```
FleetFlow/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js              # PostgreSQL connection pool
│   ├── routes.js          # All API endpoints (CRUD + auth)
│   ├── initDb.js          # Database schema & seed script
│   ├── seedReal.js        # Realistic sample data seeder
│   ├── seedHistory.js     # Historical data seeder
│   ├── .env               # Environment variables (not committed)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app with routing & RBAC
│   │   ├── Pages/
│   │   │   ├── LoginPage.jsx     # Authentication page
│   │   │   ├── Dashboard.jsx     # Overview dashboard
│   │   │   ├── VehicleRegistry.jsx
│   │   │   ├── TripDispatcher.jsx
│   │   │   ├── DriverProfiles.jsx
│   │   │   ├── MaintenanceLogs.jsx
│   │   │   ├── FuelExpenses.jsx
│   │   │   └── Analytics.jsx
│   │   ├── Styles/               # Global CSS & theming
│   │   ├── api.js                # Axios base config
│   │   └── main.jsx              # React entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve FleetFlow:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m "Add awesome feature"`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [ISC License](https://opensource.org/licenses/ISC).

---

## 💬 Questions or Feedback?

Feel free to open an issue or reach out. Happy fleet-ing! 🚀
