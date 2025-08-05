const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./models/db");
const authRoutes = require("./routes/authRoutes"); 
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
// Default route
app.get("/", (req, res) => {
  res.send("FinTrackr API is running ✅");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
