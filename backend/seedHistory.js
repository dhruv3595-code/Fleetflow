/**
 * seedHistory.js — Adds 12 months of historical trips, fuel expenses, and maintenance logs
 * Run once: node seedHistory.js
 */
const db = require("./db");

async function seedHistory() {
    try {
        console.log("Seeding 12 months of historical data...");

        const vehicles = ["VH-001", "VH-002", "VH-003", "VH-004", "VH-005"];
        const drivers = ["DR-001", "DR-002", "DR-003", "DR-004"];
        const routes = [
            ["Ahmedabad Hub", "Surat Depot"],
            ["Vadodara HQ", "Rajkot Store"],
            ["Surat Depot", "Bharuch WH"],
            ["Rajkot Store", "Ahmedabad Hub"],
            ["Bharuch WH", "Vadodara HQ"],
            ["Ahmedabad Hub", "Bhavnagar Port"],
            ["Gandhinagar DC", "Surat Depot"],
            ["Rajkot Store", "Jamnagar WH"],
        ];
        const maintTitles = [
            ["preventive", "Oil Change", "Engine oil replaced — 10W-40 synthetic"],
            ["preventive", "Tyre Rotation", "All tyres rotated and pressure balanced"],
            ["reactive", "Brake Pad Replace", "Front brake pads replaced"],
            ["preventive", "AC Service", "Cabin AC gas recharged and filter cleaned"],
            ["reactive", "Battery Replace", "Old battery replaced with Exide 65Ah"],
            ["scheduled", "Full Service", "Complete vehicle inspection and service"],
            ["reactive", "Clutch Repair", "Clutch plate and pressure plate replaced"],
            ["preventive", "Wheel Alignment", "Front-end alignment done"],
        ];

        const now = new Date();
        let tripCounter = 100;
        let expCounter = 100;
        let maintCounter = 100;

        // Generate data for the past 12 months
        for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // More trips in recent months, fewer in older months
            const tripsThisMonth = Math.max(2, Math.floor(Math.random() * 4) + (12 - monthsAgo));

            for (let t = 0; t < tripsThisMonth; t++) {
                const day = Math.min(Math.floor(Math.random() * daysInMonth) + 1, daysInMonth);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const veh = vehicles[Math.floor(Math.random() * vehicles.length)];
                const drv = drivers[Math.floor(Math.random() * drivers.length)];
                const route = routes[Math.floor(Math.random() * routes.length)];
                const cargo = [150, 250, 320, 450, 600, 800, 950, 1100][Math.floor(Math.random() * 8)];
                const status = monthsAgo === 0 && t < 2 ? "dispatched" : "completed";
                const tripId = `TR-H${String(tripCounter++).padStart(3, '0')}`;

                try {
                    await db.query(
                        `INSERT INTO trips (id, vehicleId, driverId, fromLocation, toLocation, cargo, status, date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
                        [tripId, veh, drv, route[0], route[1], cargo, status, dateStr]
                    );
                } catch (e) { /* skip duplicates */ }

                // Fuel expense for each trip
                const liters = Math.floor(Math.random() * 60) + 20;
                const pricePerL = [104.5, 105.0, 106.5, 107.2, 108.0][Math.floor(Math.random() * 5)];
                const fuelCost = Math.round(liters * pricePerL);
                const expId = `EX-H${String(expCounter++).padStart(3, '0')}`;

                try {
                    await db.query(
                        `INSERT INTO fuel_expenses (id, vehicleId, type, date, liters, pricePerL, tripId, cost, note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
                        [expId, veh, "fuel", dateStr, liters, pricePerL, tripId, fuelCost, `Fuel for trip ${tripId}`]
                    );
                } catch (e) { /* skip */ }
            }

            // Maintenance: 1-2 per month
            const maintThisMonth = Math.floor(Math.random() * 2) + 1;
            for (let m = 0; m < maintThisMonth; m++) {
                const day = Math.min(Math.floor(Math.random() * daysInMonth) + 1, daysInMonth);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const veh = vehicles[Math.floor(Math.random() * vehicles.length)];
                const mt = maintTitles[Math.floor(Math.random() * maintTitles.length)];
                const cost = [600, 900, 1200, 1800, 2500, 3500, 4500, 6000][Math.floor(Math.random() * 8)];
                const maintId = `SV-H${String(maintCounter++).padStart(3, '0')}`;

                try {
                    await db.query(
                        `INSERT INTO maintenance_logs (id, vehicleId, type, title, "desc", date, cost, status, tech)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
                        [maintId, veh, mt[0], mt[1], mt[2], dateStr, cost, "completed", "In-house Garage"]
                    );
                } catch (e) { /* skip */ }

                // Maintenance expense entry
                const mExpId = `EX-M${String(expCounter++).padStart(3, '0')}`;
                try {
                    await db.query(
                        `INSERT INTO fuel_expenses (id, vehicleId, type, date, liters, pricePerL, tripId, cost, note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
                        [mExpId, veh, "maintenance", dateStr, null, null, null, cost, `${mt[1]} — ${veh}`]
                    );
                } catch (e) { /* skip */ }
            }
        }

        console.log(`✅ Historical data seeded successfully!`);
        console.log(`   Trips added: ~${tripCounter - 100}`);
        console.log(`   Expenses added: ~${expCounter - 100}`);
        console.log(`   Maintenance logs added: ~${maintCounter - 100}`);
    } catch (err) {
        console.error("Error seeding history:", err);
    } finally {
        process.exit(0);
    }
}

seedHistory();
