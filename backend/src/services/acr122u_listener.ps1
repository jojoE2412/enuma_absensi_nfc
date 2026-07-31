$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Net;

public class ACR122UListener {
    // SCARD_E_TIMEOUT adalah kondisi normal saat menunggu event kartu/reader.
    private const int SCARD_E_TIMEOUT = unchecked((int)0x8010000A);
    [DllImport("winscard.dll")]
    public static extern int SCardEstablishContext(uint dwScope, IntPtr pvReserved1, IntPtr pvReserved2, out IntPtr phContext);

    [DllImport("winscard.dll", EntryPoint = "SCardListReadersA", CharSet = CharSet.Ansi)]
    public static extern int SCardListReaders(IntPtr hContext, string mszGroups, byte[] mszReaders, ref uint pcchReaders);

    [DllImport("winscard.dll", EntryPoint = "SCardConnectA", CharSet = CharSet.Ansi)]
    public static extern int SCardConnect(IntPtr hContext, string szReader, uint dwShareMode, uint dwPreferredProtocols, out IntPtr phCard, out uint pdwActiveProtocol);

    [DllImport("winscard.dll")]
    public static extern int SCardDisconnect(IntPtr hCard, uint dwDisposition);

    [DllImport("winscard.dll")]
    public static extern int SCardTransmit(IntPtr hCard, ref SCARD_IO_REQUEST pioSendPci, byte[] pbSendBuffer, int cbSendLength, IntPtr pioRecvPci, byte[] pbRecvBuffer, ref int pcbRecvLength);

    [DllImport("winscard.dll")]
    public static extern int SCardReleaseContext(IntPtr phContext);

    [StructLayout(LayoutKind.Sequential)]
    public struct SCARD_IO_REQUEST {
        public uint dwProtocol;
        public uint cbPciLength;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct SCARD_READERSTATE {
        [MarshalAs(UnmanagedType.LPStr)]
        public string szReader;
        public IntPtr pvUserData;
        public uint dwCurrentState;
        public uint dwEventState;
        public uint cbAtr;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 36)]
        public byte[] rgbAtr;
    }

    [DllImport("winscard.dll", EntryPoint = "SCardGetStatusChangeA", CharSet = CharSet.Ansi)]
    public static extern int SCardGetStatusChange(IntPtr hContext, uint dwTimeout, [In, Out] SCARD_READERSTATE[] rgReaderStates, uint cReaders);

    private static readonly WebClient webClient = new WebClient();

    private static void ReportReaderStatus(string apiUrl, string status, string message) {
        try {
            string statusUrl = apiUrl.Replace("/nfc/tap", "/nfc/reader-status");
            webClient.Headers[HttpRequestHeader.ContentType] = "application/json";
            string body = "{\"status\":\"" + status + "\",\"message\":\"" + message + "\"}";
            webClient.UploadString(statusUrl, "POST", body);
        } catch (Exception ex) {
            Console.WriteLine("[ACR122U] Gagal mengirim status reader: " + ex.Message);
        }
    }

    public static void StartListening(string apiUrl) {
        IntPtr hContext;
        int ret = SCardEstablishContext(0, IntPtr.Zero, IntPtr.Zero, out hContext);
        if (ret != 0) {
            Console.WriteLine("[ACR122U] GAGAL inisialisasi PC/SC context. Kode: " + ret);
            ReportReaderStatus(apiUrl, "error", "Gagal menginisialisasi layanan PC/SC.");
            return;
        }

        uint pcchReaders = 0;
        SCardListReaders(hContext, null, null, ref pcchReaders);
        if (pcchReaders == 0) {
            Console.WriteLine("[ACR122U] GAGAL: Tidak ada reader PC/SC yang terdeteksi.");
            ReportReaderStatus(apiUrl, "unavailable", "Reader NFC tidak terdeteksi.");
            return;
        }

        byte[] readersBuffer = new byte[pcchReaders];
        SCardListReaders(hContext, null, readersBuffer, ref pcchReaders);
        string fullReadersStr = Encoding.ASCII.GetString(readersBuffer);
        string[] readerNames = fullReadersStr.Split(new char[] { '\0' }, StringSplitOptions.RemoveEmptyEntries);

        if (readerNames.Length == 0) {
            Console.WriteLine("[ACR122U] Nama reader tidak valid.");
            ReportReaderStatus(apiUrl, "unavailable", "Reader NFC tidak terdeteksi.");
            return;
        }

        string targetReader = readerNames[0];
        Console.WriteLine("[ACR122U] Reader Terdeteksi: " + targetReader);
        Console.WriteLine("[ACR122U] Siap membaca kartu. Silakan tempelkan kartu NFC...");
        ReportReaderStatus(apiUrl, "active", "Reader NFC terdeteksi dan siap membaca kartu.");

        SCARD_READERSTATE[] states = new SCARD_READERSTATE[1];
        states[0] = new SCARD_READERSTATE();
        states[0].szReader = targetReader;
        states[0].dwCurrentState = 0;
        states[0].rgbAtr = new byte[36];

        // First call to sync state
        SCardGetStatusChange(hContext, 0, states, 1);
        states[0].dwCurrentState = states[0].dwEventState;

        while (true) {
            int statusRet = SCardGetStatusChange(hContext, 1000, states, 1);
            if (statusRet == SCARD_E_TIMEOUT) {
                // Tidak ada perubahan selama satu detik; listener tetap berjalan.
                Thread.Sleep(50);
                continue;
            }

            if (statusRet == 0) {
                // SCARD_STATE_UNAVAILABLE (0x08) / SCARD_STATE_UNKNOWN (0x04)
                // muncul ketika perangkat reader dicabut atau tidak lagi tersedia.
                bool readerUnavailable = (states[0].dwEventState & 0x00000008) != 0 ||
                                       (states[0].dwEventState & 0x00000004) != 0;
                if (readerUnavailable) {
                    Console.WriteLine("[ACR122U] Reader terputus atau dicabut.");
                    ReportReaderStatus(apiUrl, "disconnected", "Reader NFC terputus atau dicabut.");
                    return;
                }

                bool isPresent = (states[0].dwEventState & 0x00000020) != 0;
                bool wasPresent = (states[0].dwCurrentState & 0x00000020) != 0;

                if (isPresent && !wasPresent) {
                    // Card just placed!
                    IntPtr hCard;
                    uint activeProtocol;
                    int connRet = SCardConnect(hContext, targetReader, 2, 3, out hCard, out activeProtocol);
                    if (connRet == 0) {
                        SCARD_IO_REQUEST pci = new SCARD_IO_REQUEST();
                        pci.dwProtocol = activeProtocol;
                        pci.cbPciLength = 8;

                        // APDU: GET DATA - Read UID (FF CA 00 00 00)
                        byte[] apduGetUid = new byte[] { 0xFF, 0xCA, 0x00, 0x00, 0x00 };
                        byte[] recvBuffer = new byte[256];
                        int recvLen = recvBuffer.Length;

                        int txRet = SCardTransmit(hCard, ref pci, apduGetUid, apduGetUid.Length, IntPtr.Zero, recvBuffer, ref recvLen);

                        if (txRet == 0 && recvLen >= 2) {
                            // Last 2 bytes are SW1 SW2 (status), UID is before them
                            int uidLen = recvLen - 2;
                            byte[] uidBytes = new byte[uidLen];
                            Array.Copy(recvBuffer, 0, uidBytes, 0, uidLen);

                            StringBuilder hex = new StringBuilder(uidLen * 2);
                            foreach (byte b in uidBytes) hex.AppendFormat("{0:X2}", b);
                            string cleanUid = hex.ToString();

                            Console.WriteLine("[ACR122U] UID Terbaca: " + cleanUid);

                            try {
                                webClient.Headers[HttpRequestHeader.ContentType] = "application/json";
                                string body = "{\"uid\":\"" + cleanUid + "\",\"source\":\"acr122u\"}";
                                string response = webClient.UploadString(apiUrl, "POST", body);
                                Console.WriteLine("[ACR122U] Berhasil dikirim ke backend: " + response);
                            } catch (Exception ex) {
                                Console.WriteLine("[ACR122U] Gagal kirim ke backend: " + ex.Message);
                            }
                        } else {
                            Console.WriteLine("[ACR122U] Gagal baca UID. SCardTransmit ret=" + txRet);
                        }

                        SCardDisconnect(hCard, 0);
                    } else {
                        Console.WriteLine("[ACR122U] SCardConnect gagal. Kode: " + connRet);
                    }
                }

                states[0].dwCurrentState = states[0].dwEventState;
            } else {
                Console.WriteLine("[ACR122U] Reader terputus atau tidak dapat diakses. Kode: " + statusRet);
                ReportReaderStatus(apiUrl, "disconnected", "Reader NFC terputus atau dicabut.");
                return;
            }

            Thread.Sleep(50);
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies "System.Net"

Write-Host "========================================"
Write-Host " ACS ACR122U - NFC Listener Service"
Write-Host " Backend API: http://localhost:3001/api/nfc/tap"
Write-Host " Pastikan backend sudah berjalan!"
Write-Host "========================================"

[ACR122UListener]::StartListening("http://localhost:3001/api/nfc/tap")
