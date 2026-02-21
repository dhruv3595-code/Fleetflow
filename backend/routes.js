const express = require("express");
const router = express.Router();
const db = require("./db");

// --- VEHICLES ---
router.get("/vehicles", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM vehicles ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/vehicles", async (req, res) => {
    try {
        const { id, name, type, plate, capacity, odometer, status, region, retired } = req.body;
        const result = await db.query(
            "INSERT INTO vehicles (id, name, type, plate, capacity, odometer, status, region, retired) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [id, name, type, plate, capacity, odometer, status || 'available', region, retired || false]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/vehicles/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, plate, capacity, odometer, status, region, retired } = req.body;

        // We update fields dynamically based on what's provided using COALESCE
        const result = await db.query(
            "UPDATE vehicles SET name=COALESCE($1, name), type=COALESCE($2, type), plate=COALESCE($3, plate), capacity=COALESCE($4, capacity), odometer=COALESCE($5, odometer), status=COALESCE($6, status), region=COALESCE($7, region), retired=COALESCE($8, retired) WHERE id=$9 RETURNING *",
            [name, type, plate, capacity, odometer, status, region, retired, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/vehicles/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM vehicles WHERE id=$1", [id]);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DRIVERS ---
router.get("/drivers", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM drivers ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/drivers", async (req, res) => {
    try {
        const { id, name, license, category, expiry, status, trips, safetyScore, phone } = req.body;
        const result = await db.query(
            "INSERT INTO drivers (id, name, license, category, expiry, status, trips, safetyScore, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [id, name, license, category, expiry, status || 'available', trips || 0, safetyScore || 100, phone]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/drivers/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, license, category, expiry, status, trips, safetyScore, phone } = req.body;
        const result = await db.query(
            "UPDATE drivers SET name=COALESCE($1, name), license=COALESCE($2, license), category=COALESCE($3, category), expiry=COALESCE($4, expiry), status=COALESCE($5, status), trips=COALESCE($6, trips), safetyScore=COALESCE($7, safetyScore), phone=COALESCE($8, phone) WHERE id=$9 RETURNING *",
            [name, license, category, expiry, status, trips, safetyScore, phone, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TRIPS ---
router.get("/trips", async (req, res) => {
    try {
        const result = await db.query(`
      SELECT t.*, v.name as "vehicleName", d.name as "driverName" 
      FROM trips t 
      LEFT JOIN vehicles v ON t.vehicleId = v.id 
      LEFT JOIN drivers d ON t.driverId = d.id 
      ORDER BY t.date DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/trips", async (req, res) => {
    try {
        const { id, vehicleId, driverId, fromLocation, toLocation, cargo, status, date } = req.body;
        const result = await db.query(
            "INSERT INTO trips (id, vehicleId, driverId, fromLocation, toLocation, cargo, status, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [id, vehicleId, driverId, fromLocation, toLocation, cargo, status || 'draft', date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/trips/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await db.query(
            "UPDATE trips SET status=$1 WHERE id=$2 RETURNING *",
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MAINTENANCE LOGS ---
router.get("/maintenance", async (req, res) => {
    try {
        const result = await db.query(`
      SELECT m.*, v.name as "vehicleName" 
      FROM maintenance_logs m 
      LEFT JOIN vehicles v ON m.vehicleId = v.id 
      ORDER BY m.date DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/maintenance", async (req, res) => {
    try {
        const { id, vehicleId, type, title, desc, date, cost, status, tech } = req.body;
        const result = await db.query(
            `INSERT INTO maintenance_logs (id, vehicleId, type, title, "desc", date, cost, status, tech) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [id, vehicleId, type, title, desc, date, cost, status || 'in-shop', tech]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/maintenance/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await db.query(
            "UPDATE maintenance_logs SET status=$1 WHERE id=$2 RETURNING *",
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FUEL EXPENSES ---
router.get("/expenses", async (req, res) => {
    try {
        const result = await db.query(`
      SELECT e.*, v.name as "vehicleName" 
      FROM fuel_expenses e 
      LEFT JOIN vehicles v ON e.vehicleId = v.id 
      ORDER BY e.date DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/expenses", async (req, res) => {
    try {
        const { id, vehicleId, type, date, liters, pricePerL, tripId, cost, note } = req.body;
        const result = await db.query(
            "INSERT INTO fuel_expenses (id, vehicleId, type, date, liters, pricePerL, tripId, cost, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [id, vehicleId, type, date, liters || null, pricePerL || null, tripId || null, cost, note]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- AUTHENTICATION ---
router.post("/auth/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const result = await db.query(
            "SELECT * FROM users WHERE email=$1 AND password=$2 AND role=$3",
            [email, password, role]
        );

        if (result.rows.length > 0) {
            // Return user info minus the password
            const user = result.rows[0];
            res.json({ id: user.id, email: user.email, role: user.role });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REGISTER ---
router.post("/auth/register", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existing = await db.query("SELECT id FROM users WHERE email=$1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }
        const result = await db.query(
            "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
            [email, password, role]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
