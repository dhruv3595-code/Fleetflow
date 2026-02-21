const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes will be mounted here
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Fleet Backend is running" });
});

const apiRoutes = require("./routes");
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
