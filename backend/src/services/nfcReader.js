import EventEmitter from "events";
import { spawn, spawnSync, exec } from "child_process";
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
      message: "Reader NFC belum terdeteksi. Jalankan listener dan pastikan ACS ACR122U terhubung ke USB.",
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

  openBatFile() {
    const batchPath = path.resolve(__dirname, "../../start_nfc_listener.bat");
    const backendRoot = path.resolve(__dirname, "../..");
    if (!existsSync(batchPath)) return { success: false, error: "File start_nfc_listener.bat tidak ditemukan." };
    spawn("cmd.exe", ["/c", "start", "", batchPath], {
      cwd: backendRoot, detached: true, stdio: "ignore", windowsHide: false
    }).unref();
    return { success: true };
  }

  async startListener() {
    this.listenerState = {
      status: "active",
      message: "Listener NFC aktif. Menunggu deteksi reader ACS ACR122U.",
      pid: null,
      startedAt: new Date().toISOString(),
      source: "backend"
    };
    this.broadcastSSE("listener_status", this.listenerState);
    return { success: true, alreadyRunning: false, data: this.listenerState };
  }

  stopListener() {
    try {
      // Kill semua proses PowerShell yang menjalankan acr122u_listener.ps1
      spawnSync(
        "powershell.exe",
        ["-NoProfile", "-Command",
          `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'acr122u_listener.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`
        ],
        { stdio: "ignore" }
      );
    } catch (err) {
      console.warn("[ACS ACR122U] Gagal menghentikan listener:", err.message);
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
    return { success: true, data: this.listenerState };
  }

  detectExistingListenerProcess() {
    if (process.platform !== "win32") return null;

    try {
      const result = spawnSync("powershell.exe", [
        "-NoProfile",
        "-Command",
        `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -like '*acr122u_listener.ps1*' -and $_.CommandLine -notlike '*Get-CimInstance*' } | Select-Object -First 1 -ExpandProperty ProcessId`
      ], { encoding: "utf8" });

      if (result.status === 0) {
        const pid = Number.parseInt(result.stdout?.trim(), 10);
        if (!Number.isNaN(pid) && pid > 0) return { pid };
      }
    } catch (error) {
      console.warn("[ACS ACR122U] Gagal memeriksa proses listener:", error.message);
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
