const db = require("./db");

async function initializeDB() {
    try {
        console.log("Initializing database tables...");

        // Create Users Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);

        // Create Vehicles Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        plate VARCHAR(50),
        capacity INTEGER,
        odometer INTEGER,
        status VARCHAR(50) DEFAULT 'available',
        region VARCHAR(50),
        retired BOOLEAN DEFAULT false
      );
    `);

        // Create Drivers Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        license VARCHAR(50),
        category VARCHAR(50),
        expiry DATE,
        status VARCHAR(50) DEFAULT 'available',
        trips INTEGER DEFAULT 0,
        safetyScore INTEGER DEFAULT 100,
        phone VARCHAR(20)
      );
    `);

        // Create Trips Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(20) PRIMARY KEY,
        vehicleId VARCHAR(20) REFERENCES vehicles(id),
        driverId VARCHAR(20) REFERENCES drivers(id),
        fromLocation VARCHAR(100) NOT NULL,
        toLocation VARCHAR(100) NOT NULL,
        cargo INTEGER,
        status VARCHAR(50) DEFAULT 'draft',
        date DATE
      );
    `);

        // Create Maintenance Logs Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id VARCHAR(20) PRIMARY KEY,
        vehicleId VARCHAR(20) REFERENCES vehicles(id),
        type VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        "desc" TEXT,
        date DATE,
        cost NUMERIC,
        status VARCHAR(50) DEFAULT 'in-shop',
        tech VARCHAR(100)
      );
    `);

        // Create Fuel Expenses Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS fuel_expenses (
        id VARCHAR(20) PRIMARY KEY,
        vehicleId VARCHAR(20) REFERENCES vehicles(id),
        type VARCHAR(50),
        date DATE,
        liters NUMERIC,
        pricePerL NUMERIC,
        tripId VARCHAR(20),
        cost NUMERIC NOT NULL,
        note TEXT
      );
    `);

        console.log("Database tables created successfully.");

        // Seed demo login accounts only (no fake operational data)
        const usersCount = await db.query("SELECT COUNT(*) FROM users");
        if (parseInt(usersCount.rows[0].count) === 0) {
            console.log("Seeding demo user accounts...");
            const insertUser = `INSERT INTO users (email, password, role) VALUES ($1, $2, $3)`;
            const uSeed = [
                ["manager@fleetflow.io", "fleet123", "Manager"],
                ["dispatch@fleetflow.io", "fleet123", "Dispatcher"],
                ["safety@fleetflow.io", "fleet123", "Safety"],
                ["analyst@fleetflow.io", "fleet123", "Analyst"]
            ];
            for (const u of uSeed) {
                await db.query(insertUser, u);
            }
        }

        console.log("Database initialization complete.");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    } finally {
        process.exit(0);
    }
}

initializeDB();
