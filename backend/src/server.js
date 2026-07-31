import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/api.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Sistem Absensi Berbasis NFC API",
    status: "running",
    version: "1.0.0"
  });
});

// Mount API Routes
app.use("/api", apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Terjadi kesalahan internal server." });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Absensi NFC Backend running on http://localhost:${PORT}`);
});