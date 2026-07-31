import EventEmitter from "events";

class NFCService extends EventEmitter {
  constructor() {
    super();
    this.nfc = null;
    this.activeReader = null;
    this.lastScannedCard = null;
    this.sseClients = new Set();
    this.readerStatus = {
      status: "waiting",
      message: "Menunggu listener NFC terhubung.",
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
        this.updateReaderStatus("active", "Reader NFC siap membaca kartu.", reader.reader.name);

        reader.on("card", (card) => {
          const rawUid = card.uid;
          // Standardize UID format (uppercase without colons or spaces)
          const cleanUid = rawUid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
          console.log(`[ACS ACR122U] Kartu terdeteksi UID: ${cleanUid}`);
          
          this.handleCardScan(cleanUid);
        });

        reader.on("card.off", (card) => {
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

  /**
   * Handle card scan event from ACR122U or direct API tap
   */
  handleCardScan(uid) {
    const cardData = {
      uid,
      timestamp: new Date().toISOString()
    };
    this.lastScannedCard = cardData;

    // Emit internally
    this.emit("card_scanned", cardData);

    // Broadcast to connected SSE frontend clients (e.g. Card Registration or Dashboard)
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

  /**
   * Register SSE client response object
   */
  addSSEClient(res) {
    this.sseClients.add(res);
  }

  /**
   * Remove SSE client response object
   */
  removeSSEClient(res) {
    this.sseClients.delete(res);
  }

  /**
   * Broadcast SSE payload to all clients
   */
  broadcastSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      client.write(payload);
    }
  }
}

export const nfcService = new NFCService();
