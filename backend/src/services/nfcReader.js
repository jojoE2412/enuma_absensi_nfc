import EventEmitter from "events";
import { spawn, spawnSync } from "child_process";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NFCService extends EventEmitter {
  constructor() {
    super();
    this.nfc = null;
    this.activeReader = null;
    this.lastScannedCard = null;
    this.sseClients = new Set();
    this.listenerProcess = null;
    this.listenerState = {
      status: "stopped",
      message: "Listener NFC tidak aktif.",
      pid: null,
      startedAt: null,
      source: "none"
    };
    this.readerStatus = {
      status: "waiting",
      message: "Listener NFC aktif, tetapi reader belum terdeteksi oleh PC/SC.",
      updatedAt: new Date().toISOString()
    };
    this.init();
  }

  async init() {
    try {
      const { NFC } = await import("nfc-pcsc");
      this.nfc = new NFC();

      this.nfc.on("reader", (reader) => {
        console.log(`[ACS ACR122U] Reader terdeteksi: ${reader.reader.name}`);
        this.activeReader = reader;
        this.updateReaderStatus("active", "Reader NFC terdeteksi dan siap membaca kartu.", reader.reader.name);

        reader.on("card", (card) => {
          const rawUid = card.uid;
          const cleanUid = rawUid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
          console.log(`[ACS ACR122U] Kartu terdeteksi UID: ${cleanUid}`);

          this.handleCardScan(cleanUid);
        });

        reader.on("card.off", () => {
          console.log(`[ACS ACR122U] Kartu dilepas dari reader.`);
        });

        reader.on("error", (err) => {
          console.error(`[ACS ACR122U] Reader Error:`, err.message);
          this.updateReaderStatus("error", `Reader NFC mengalami kesalahan: ${err.message}`, reader.reader.name);
        });

        reader.on("end", () => {
          console.log(`[ACS ACR122U] Reader terputus.`);
          this.activeReader = null;
          this.updateReaderStatus("disconnected", "Reader NFC terputus atau dicabut.", reader.reader.name);
        });
      });

      this.nfc.on("error", (err) => {
        console.error("[ACS ACR122U] NFC PC/SC System Error:", err.message);
        this.updateReaderStatus("error", `Layanan NFC bermasalah: ${err.message}`);
      });
    } catch (err) {
      console.warn("[ACS ACR122U] Driver PC/SC (nfc-pcsc) belum terinstall / memerlukan build tools. Endpoint API /api/nfc/tap tetap aktif.");
    }
  }

  handleCardScan(uid) {
    const cardData = {
      uid,
      timestamp: new Date().toISOString()
    };
    this.lastScannedCard = cardData;

    this.emit("card_scanned", cardData);
    this.broadcastSSE("nfc_tap", cardData);
  }

  updateReaderStatus(status, message, readerName = null) {
    this.readerStatus = {
      status,
      message,
      readerName,
      updatedAt: new Date().toISOString()
    };
    this.broadcastSSE("reader_status", this.readerStatus);
  }

  getReaderStatus() {
    return this.readerStatus;
  }

  getListenerStatus() {
    return this.listenerState;
  }

  async startListener() {
    const existing = this.detectExistingListenerProcess();
    if (this.listenerProcess && this.listenerProcess.exitCode === null) {
      this.listenerState = {
        status: "active",
        message: "Listener NFC sudah berjalan.",
        pid: this.listenerProcess.pid || null,
        startedAt: this.listenerState.startedAt || new Date().toISOString(),
        source: "backend"
      };
      this.broadcastSSE("listener_status", this.listenerState);
      return {
        success: true,
        alreadyRunning: true,
        data: this.getListenerStatus()
      };
    }

    if (existing) {
      this.listenerState = {
        status: "active",
        message: "Listener NFC sudah aktif dan dikendalikan oleh proses lain.",
        pid: existing.pid,
        startedAt: null,
        source: "external"
      };
      this.broadcastSSE("listener_status", this.listenerState);
      return {
        success: true,
        alreadyRunning: true,
        data: this.listenerState
      };
    }

    this.listenerState = {
      status: "starting",
      message: "Memulai listener NFC dari web...",
      pid: null,
      startedAt: new Date().toISOString(),
      source: "backend"
    };
    this.broadcastSSE("listener_status", this.listenerState);

    const batchPath = path.resolve(__dirname, "../../start_nfc_listener.bat");
    const backendRoot = path.resolve(__dirname, "../..");

    if (!existsSync(batchPath)) {
      this.listenerState = {
        status: "error",
        message: "File launcher start_nfc_listener.bat tidak ditemukan.",
        pid: null,
        startedAt: null,
        source: "backend"
      };
      this.broadcastSSE("listener_status", this.listenerState);
      return {
        success: false,
        error: "File launcher tidak ditemukan",
        data: this.listenerState
      };
    }

    try {
      console.log(`[ACS ACR122U] Mencoba menjalankan batch launcher: ${batchPath}`);

      // Gunakan shell:true agar Windows bisa buka window baru via "start"
      const child = spawn(
        `start "ACS ACR122U NFC Listener" "${batchPath}"`,
        [],
        {
          cwd: backendRoot,
          shell: true,
          detached: true,
          stdio: "ignore",
          windowsHide: false,
          env: { ...process.env, BATCH_LAUNCHER_SOURCE: "web-button" }
        }
      );

      child.unref();
      console.log(`[ACS ACR122U] Launcher dipicu dengan pid: ${child.pid || "unknown"}`);


      this.listenerProcess = child;
      this.listenerState = {
        status: "active",
        message: "Listener NFC sedang berjalan dari web. Menunggu deteksi reader ACS ACR122U.",
        pid: child.pid || null,
        startedAt: new Date().toISOString(),
        source: "backend"
      };
      this.broadcastSSE("listener_status", this.listenerState);

      child.once("error", (error) => {
        this.listenerState = {
          status: "error",
          message: `Gagal menjalankan listener NFC dari web: ${error.message}`,
          pid: null,
          startedAt: this.listenerState.startedAt,
          source: "backend"
        };
        this.listenerProcess = null;
        this.broadcastSSE("listener_status", this.listenerState);
      });

      return {
        success: true,
        alreadyRunning: false,
        data: this.listenerState
      };
    } catch (error) {
      this.listenerState = {
        status: "error",
        message: `Gagal menjalankan listener NFC: ${error.message}`,
        pid: null,
        startedAt: null,
        source: "backend"
      };
      this.broadcastSSE("listener_status", this.listenerState);
      return {
        success: false,
        error: error.message,
        data: this.listenerState
      };
    }
  }

  stopListener() {
    if (this.listenerProcess && this.listenerProcess.exitCode === null) {
      if (process.platform === "win32" && this.listenerProcess.pid) {
        try {
          spawnSync("taskkill", ["/PID", String(this.listenerProcess.pid), "/T", "/F"], { stdio: "ignore" });
        } catch (error) {
          console.warn("[ACS ACR122U] Gagal menghentikan listener via taskkill:", error.message);
        }
      } else {
        this.listenerProcess.kill();
      }
      this.listenerProcess = null;
      this.listenerState = {
        status: "stopped",
        message: "Listener NFC dihentikan.",
        pid: null,
        startedAt: this.listenerState.startedAt,
        source: "backend"
      };
      this.broadcastSSE("listener_status", this.listenerState);
      return {
        success: true,
        data: this.listenerState
      };
    }

    this.listenerState = {
      status: "stopped",
      message: "Listener NFC tidak aktif.",
      pid: null,
      startedAt: this.listenerState.startedAt,
      source: this.listenerState.source
    };
    this.broadcastSSE("listener_status", this.listenerState);
    return {
      success: true,
      data: this.listenerState
    };
  }

  detectExistingListenerProcess() {
    if (process.platform !== "win32") return null;

    try {
      const result = spawnSync("powershell.exe", [
        "-NoProfile",
        "-Command",
        `$processes = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'acr122u_listener.ps1' }; if ($processes) { $processes | Select-Object -First 1 -ExpandProperty ProcessId }`
      ], { encoding: "utf8" });

      if (result.status === 0) {
        const pid = Number.parseInt(result.stdout?.trim(), 10);
        if (!Number.isNaN(pid) && pid > 0) return { pid };
      }
    } catch (error) {
      console.warn("[ACS ACR122U] Gagal memeriksa proses listener yang sudah berjalan:", error.message);
    }

    return null;
  }

  shutdown() {
    if (this.listenerProcess) {
      this.listenerProcess.kill();
      this.listenerProcess = null;
    }
  }

  addSSEClient(res) {
    this.sseClients.add(res);
  }

  removeSSEClient(res) {
    this.sseClients.delete(res);
  }

  broadcastSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      client.write(payload);
    }
  }
}

export const nfcService = new NFCService();
