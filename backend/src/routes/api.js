import express from "express";
import { authenticate, requireAdmin, requireOperatorOrAdmin } from "../middleware/authMiddleware.js";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../controllers/employeeController.js";
import {
  getNfcCards, registerNfcCard, changeNfcCard, toggleNfcCardStatus, deleteNfcCard,
  streamNfcEvents, tapNfcCard, updateReaderStatus, getNfcListenerStatus, startNfcListener, stopNfcListener, openNfcBat, downloadNfcListenerBat
} from "../controllers/nfcController.js";
import { processNfcAttendance, manualAttendance, getAttendanceList, getDashboardStats } from "../controllers/attendanceController.js";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// ── Public / Hardware Endpoints (tidak perlu auth) ───────────────────────────
router.get("/nfc/stream", streamNfcEvents);
router.post("/nfc/tap", tapNfcCard);
router.post("/nfc/reader-status", updateReaderStatus);
router.post("/attendance/tap", processNfcAttendance);
router.get("/nfc/download-listener", downloadNfcListenerBat);

// ── Authenticated Routes ─────────────────────────────────────────────────────
router.use(authenticate);

// Dashboard (Admin & Operator)
router.get("/dashboard/stats", requireOperatorOrAdmin, getDashboardStats);

// Attendance History & Filter (Admin & Operator)
router.post("/attendance/manual", requireOperatorOrAdmin, manualAttendance);
router.get("/attendance", requireOperatorOrAdmin, getAttendanceList);

// Employee / User Absensi Management
router.get("/employees", requireOperatorOrAdmin, getEmployees); // operator butuh untuk absensi manual
router.post("/employees", requireAdmin, createEmployee);
router.put("/employees/:id", requireAdmin, updateEmployee);
router.delete("/employees/:id", requireAdmin, deleteEmployee);

// NFC Card Management (Admin Only)
router.get("/nfc/cards", requireAdmin, getNfcCards);
router.post("/nfc/register", requireAdmin, registerNfcCard);
router.post("/nfc/change", requireAdmin, changeNfcCard);
router.patch("/nfc/cards/:id/status", requireAdmin, toggleNfcCardStatus);
router.delete("/nfc/:id", requireAdmin, deleteNfcCard);
router.get("/nfc/listener-status", requireOperatorOrAdmin, getNfcListenerStatus);
router.post("/nfc/open-bat", requireOperatorOrAdmin, openNfcBat);
router.post("/nfc/listener/start", requireOperatorOrAdmin, startNfcListener);
router.post("/nfc/listener/stop", requireOperatorOrAdmin, stopNfcListener);

// Akun Login Admin/Operator (Admin Only)
router.get("/users", requireAdmin, getUsers);
router.post("/users", requireAdmin, createUser);
router.put("/users/:id", requireAdmin, updateUser);
router.delete("/users/:id", requireAdmin, deleteUser);

export default router;
