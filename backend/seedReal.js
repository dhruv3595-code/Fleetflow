const db = require("./db");

async function seedReal() {
    try {
        console.log("Clearing existing operational data...");
        await db.query("DELETE FROM fuel_expenses");
        await db.query("DELETE FROM maintenance_logs");
        await db.query("DELETE FROM trips");
        await db.query("DELETE FROM drivers");
        await db.query("DELETE FROM vehicles");

        // ── 5 Vehicles ──────────────────────────────────────────
        console.log("Inserting 5 vehicles...");
        const vehicles = [
            ["VH-001", "Tata Ace Gold", "Van", "MH-04-AK-1122", 750, 28400, "available", "Mumbai", false],
            ["VH-002", "Ashok Leyland 1618", "Truck", "MH-01-BZ-4455", 8000, 91200, "on-trip", "Pune", false],
            ["VH-003", "Mahindra Jeeto", "Van", "GJ-01-CX-7788", 600, 15300, "available", "Surat", false],
            ["VH-004", "Eicher Pro 2095", "Truck", "DL-02-DN-3344", 5000, 74600, "in-shop", "Delhi", false],
            ["VH-005", "Hero Splendor Pro", "Bike", "KA-05-EF-9900", 100, 8750, "available", "Bengaluru", false],
        ];
        for (const v of vehicles) {
            await db.query(
                "INSERT INTO vehicles (id,name,type,plate,capacity,odometer,status,region,retired) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
                v
            );
        }

        // ── 5 Drivers ────────────────────────────────────────────
        console.log("Inserting 5 drivers...");
        const drivers = [
            ["DR-001", "Rajesh Kumar", "MH-DL-2019-4521", "Truck", "2027-03-15", "available", 54, 92, "+91-9876012345"],
            ["DR-002", "Suresh Yadav", "DL-DL-2020-8834", "Truck", "2026-11-30", "on-duty", 88, 78, "+91-9123456780"],
            ["DR-003", "Anita Desai", "GJ-DL-2021-0091", "Van", "2028-06-20", "available", 37, 97, "+91-9988112233"],
            ["DR-004", "Mohammed Rafi", "KA-DL-2018-5567", "Bike", "2026-04-05", "available", 62, 85, "+91-9765432109"],
            ["DR-005", "Priyanka Nair", "MH-DL-2022-1123", "Van", "2029-01-01", "suspended", 12, 61, "+91-9871234567"],
        ];
        for (const d of drivers) {
            await db.query(
                "INSERT INTO drivers (id,name,license,category,expiry,status,trips,safetyscore,phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
                d
            );
        }

        // ── 5 Trips ──────────────────────────────────────────────
        console.log("Inserting 5 trips...");
        const trips = [
            ["TR-001", "VH-002", "DR-002", "Mumbai Depot", "Pune Distribution Center", 4200, "completed", "2026-02-10"],
            ["TR-002", "VH-001", "DR-001", "Surat Warehouse", "Ahmedabad Hub", 680, "completed", "2026-02-13"],
            ["TR-003", "VH-003", "DR-003", "Delhi Cold Store", "Noida Retail Outlet", 420, "dispatched", "2026-02-19"],
            ["TR-004", "VH-005", "DR-004", "Bengaluru HQ", "Mysuru Branch", 95, "completed", "2026-02-15"],
            ["TR-005", "VH-001", "DR-001", "Ahmedabad Hub", "Vadodara Depot", 310, "draft", "2026-02-21"],
        ];
        for (const t of trips) {
            await db.query(
                "INSERT INTO trips (id,vehicleId,driverId,fromLocation,toLocation,cargo,status,date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING",
                t
            );
        }

        // ── 5 Maintenance Logs ───────────────────────────────────
        console.log("Inserting 5 maintenance logs...");
        const maintenance = [
            ["SV-001", "VH-004", "reactive", "Engine Overheating Repair", "Coolant flush and thermostat replaced. Engine temperature now stable.", "2026-02-05", 8500, "completed", "Sharma Auto Works"],
            ["SV-002", "VH-002", "preventive", "Full Service at 90K km", "Engine oil, air filter, fuel filter replaced. Brake pads inspected.", "2026-02-08", 4200, "completed", "Leyland Authorised Center"],
            ["SV-003", "VH-001", "preventive", "Tyre Replacement", "All 4 tyres replaced with MRF ZV2K 195/65 R15.", "2026-02-12", 9600, "completed", "MRF Tyre Zone"],
            ["SV-004", "VH-004", "reactive", "Brake Failure - In Shop", "Rear brake caliper seized. Parts ordered, vehicle grounded.", "2026-02-18", 6200, "in-shop", "National Auto Repairs"],
            ["SV-005", "VH-003", "preventive", "AC Service & Sanitisation", "AC gas recharged, condenser cleaned, cabin sanitised.", "2026-02-20", 2200, "completed", "CoolCar AC Works"],
        ];
        for (const m of maintenance) {
            await db.query(
                `INSERT INTO maintenance_logs (id,vehicleId,type,title,"desc",date,cost,status,tech) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
                m
            );
        }

        // ── 5 Fuel & Expense Logs ────────────────────────────────
        console.log("Inserting 5 fuel/expense logs...");
        const expenses = [
            ["EX-001", "VH-002", "fuel", "2026-02-10", 120, 106.50, "TR-001", 12780, "Full tank before Pune run"],
            ["EX-002", "VH-001", "fuel", "2026-02-13", 55, 106.50, "TR-002", 5857, "Refuel at Surat outlet"],
            ["EX-003", "VH-003", "fuel", "2026-02-19", 40, 106.50, "TR-003", 4260, "Delhi cold store departure"],
            ["EX-004", "VH-005", "fuel", "2026-02-15", 12, 106.50, "TR-004", 1278, "Bengaluru–Mysuru run"],
            ["EX-005", "VH-004", "maintenance", "2026-02-18", null, null, null, 6200, "Brake caliper replacement — National Auto Repairs"],
        ];
        for (const e of expenses) {
            await db.query(
                "INSERT INTO fuel_expenses (id,vehicleId,type,date,liters,pricePerL,tripId,cost,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
                e
            );
        }

        console.log("\n✅ Seeding complete! 5 records inserted per table.");
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err.message);
        process.exit(1);
    }
}

seedReal();
