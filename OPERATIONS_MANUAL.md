# TrailGuard — Complete Operations Manual

> **Covers:** Flashing Heltec boards → Configuring the mesh → Running all services → Sending an SOS → Receiving it on the dashboard.

---

## Table of Contents
1. [Hardware Overview](#1-hardware-overview)
2. [Prerequisites](#2-prerequisites--install-once)
3. [Flashing the Heltec Boards](#3-flashing-the-heltec-boards-meshtastic-firmware)
4. [Configuring the Boards](#4-configuring-the-boards-via-serial)
5. [Running the Dashboard](#5-running-the-dashboard)
6. [Running the Serial Bridge](#6-running-the-serial-bridge)
7. [Building and Installing the Mobile App](#7-building-and-installing-the-mobile-app)
8. [End-to-End SOS Test](#8-sending-an-sos--end-to-end-test)
9. [Architecture Overview](#9-what-each-component-does-architecture)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Hardware Overview

| Board | Role | COM Port | Notes |
|-------|------|----------|-------|
| Heltec V3 #1 | **Base Station** | COM4 | USB to PC. Runs Serial Bridge. BT disabled. |
| Heltec V3 #2 | **Relay Node** | COM5 | Bluetooth ON. Phone connects over BLE. |

**Signal path:**
```
Phone (BLE) -> Relay (COM5) -> [LoRa] -> Base (COM4) -> Serial Bridge -> Dashboard
                                                                          |
Phone (BLE) <- Relay (COM5) <- [LoRa] <- Base (COM4) <---- TG_ACK ------+
```

---

## 2. Prerequisites — Install Once

### Python packages
```powershell
pip install meshtastic requests pypubsub protobuf nacl
```

### Node / npm
Download from https://nodejs.org (LTS).

### ADB (Android Debug Bridge)
Download platform-tools from https://developer.android.com/studio/releases/platform-tools  
Verify: `adb devices`

---

## 3. Flashing the Heltec Boards (Meshtastic Firmware)

> Skip if boards already run Meshtastic 2.8.x — verify with `python -m meshtastic --port COM4 --info`.

### 3.1 Web Flasher (easiest)
1. Open Chrome/Edge → https://flasher.meshtastic.org
2. Select **Heltec V3**
3. Plug in board via USB, click **Flash**, wait ~2 minutes
4. Repeat for the second board

### 3.2 Manual via esptool
```powershell
pip install esptool
esptool.py --port COM4 erase_flash
esptool.py --port COM4 --baud 921600 write_flash 0x0 firmware-heltec-v3-2.X.X.bin
```

### 3.3 Verify
```powershell
python -m meshtastic --port COM4 --info
# Should show: "firmwareVersion": "2.8.x..."
```

---

## 4. Configuring the Boards via Serial

After flashing, `lora.region = UNSET` which **disables the radio**. Run these commands to enable it.

### 4.1 Base Station (COM4)
```powershell
python -m meshtastic --port COM4 --set lora.region US
python -m meshtastic --port COM4 --set device.role CLIENT_MUTE
python -m meshtastic --port COM4 --set bluetooth.enabled false
python -m meshtastic --port COM4 --reboot
```

Wait 10 seconds. Verify:
```powershell
python -m meshtastic --port COM4 --info
# Confirm: "region": "US", "bluetooth": {"enabled": false}, "role": "CLIENT_MUTE"
```

### 4.2 Relay Node (COM5)
```powershell
python -m meshtastic --port COM5 --set lora.region US
python -m meshtastic --port COM5 --set device.role CLIENT
python -m meshtastic --port COM5 --set bluetooth.enabled true
python -m meshtastic --port COM5 --set bluetooth.mode NO_PIN
python -m meshtastic --port COM5 --reboot
```

Wait 10 seconds. Verify:
```powershell
python -m meshtastic --port COM5 --info
# Confirm: "region": "US", "bluetooth": {"enabled": true, "mode": "NO_PIN"}, "role": "CLIENT"
```

### 4.3 Test LoRa link
```powershell
python -m meshtastic --port COM5 --sendtext "hello"
# Wait 5 seconds, then:
python -m meshtastic --port COM4 --nodes
# COM5 node should appear with a recent LastHeard timestamp
```

---

## 5. Running the Dashboard

Open a **dedicated terminal** — keep it running:
```powershell
cd C:\TrailGuard\services\dashboard
python app.py
```

Open browser: **http://localhost:5000**

### Test ingest endpoint manually
```powershell
Invoke-RestMethod -Uri http://localhost:5000/ingest -Method POST `
  -ContentType "application/json" `
  -Body '{"msg_type":"SOS","hiker_id":"test","node_id":"n1","timestamp_unix":1700000000,"public_key_hex":"0000000000000000000000000000000000000000000000000000000000000000","signature_hex":"","payload_json":"{\"hikerLat\":12.97,\"hikerLon\":77.59,\"message\":\"Test\"}"}'
```

Expected: `{"status": "ok", "message_id": "...", "ack": {...}}`  
The SOS appears on the dashboard map immediately.

---

## 6. Running the Serial Bridge

Open a **second dedicated terminal**:
```powershell
cd C:\TrailGuard
python -u hardware/serial_bridge.py
```

Expected output:
```
[Serial Bridge] Connecting to local Meshtastic node...
[Serial Bridge] Connected to COM4! Listening for TrailGuard messages...
```

When a message arrives:
```
[Serial Bridge] Forwarding SOS from alice_hiker to dashboard...
[Serial Bridge] Dashboard response: 200 {"status":"ok","message_id":"...","ack":{...}}
[Serial Bridge] Broadcasting signed ACK back to Mesh...
```

> **Note:** COM4 is hardcoded in `hardware/serial_bridge.py` line 123. Change if needed.

---

## 7. Building and Installing the Mobile App

### 7.1 Install dependencies
```powershell
cd C:\TrailGuard\apps\mobile
npm install
```

### 7.2 Connect phone via USB cable
1. **Settings → About Phone → tap Build Number 7 times** (enables Developer Options)
2. **Settings → Developer Options → USB Debugging → ON**
3. Plug in USB cable, accept "Allow USB debugging?" on phone

Verify:
```powershell
C:\Users\kisha\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
# Should show: RZCY81R7X0P   device
```

### 7.3 Build and install
```powershell
cd C:\TrailGuard\apps\mobile
npm run android
```

Takes 5-10 minutes first time. App opens automatically on phone when done.

> After the first install, cable is **not required** — just run `npm start` and the app connects over Wi-Fi.

---

## 8. Sending an SOS — End-to-End Test

### Pre-flight checklist

| Check | Command |
|-------|---------|
| COM4 region = US | `python -m meshtastic --port COM4 --info` |
| COM5 region = US, BT enabled | `python -m meshtastic --port COM5 --info` |
| Dashboard running | http://localhost:5000 loads |
| Serial Bridge running | Terminal shows `Connected to COM4!` |
| Phone Bluetooth ON | Status bar shows BT icon |
| App connected | App shows node name (e.g. `Meshtastic_fe24`) |

### Steps
1. Open TrailGuard app — wait for node name to appear at the top
2. Go to the **SOS tab**
3. **Hold the red SOS button for 3 seconds**
4. Status changes to: **"SOS SENT TO NODE — RELAY UNCONFIRMED"**
5. Within ~10 seconds: **"DELIVERED — TRAILHEAD CONFIRMED"** ✅

### What happens internally

| # | Event |
|---|-------|
| 1 | Phone signs SOS protobuf, sends `TG:<base64>` over BLE to COM5 |
| 2 | COM5 LoRa-broadcasts the packet |
| 3 | COM4 receives it over LoRa |
| 4 | Serial Bridge decodes it, POST to `/ingest` |
| 5 | Dashboard saves to DB, pushes to map via SocketIO |
| 6 | Dashboard returns signed ACK in response |
| 7 | Serial Bridge sends `TG_ACK:<base64>` back over LoRa |
| 8 | COM5 relays ACK to phone over BLE |
| 9 | Phone verifies Ed25519 signature → shows "DELIVERED" |

---

## 9. What Each Component Does (Architecture)

```
MOBILE APP (sos.tsx, MeshClient.ts, AckVerifier.ts, hashUtils.ts)
    |  BLE GATT write (TORADIO characteristic)
    v
RELAY NODE [COM5 - Heltec V3 - Meshtastic 2.8.x - CLIENT role - BT ON]
    |  LoRa 915 MHz
    v
BASE STATION [COM4 - Heltec V3 - Meshtastic 2.8.x - CLIENT_MUTE role - BT OFF]
    |  USB Serial
    v
SERIAL BRIDGE (hardware/serial_bridge.py)
    |  HTTP POST
    v
DASHBOARD (Flask + SocketIO - routes/gateway.py)
  - Replay protection (10 min, djb2-64)
  - TOFU Ed25519 signature check
  - SQLite: messages, hikers, pending_acks
  - Signs ACK with gateway_keypair.json
  - SocketIO live push to browser
```

### Crypto facts
| Item | Location |
|------|----------|
| Hiker signing key | Generated on device at first launch (Signer.ts) |
| Gateway signing key | `services/dashboard/gateway_keypair.json` — **back up!** |
| Gateway pubkey in app | `MeshClient.ts` line 34 — must match `verify_key_hex` in keypair file |
| Signature bypass | `crypto.py` line 75 `return True` — remove to enforce signatures |

---

## 10. Troubleshooting

### App says "Not connected to a node"
- COM5 Bluetooth must be enabled. Verify: `python -m meshtastic --port COM5 --info`
- Phone Bluetooth must be ON
- App scans for: `Meshtastic*`, `TG-*`, `RA*`, `RB*`, `RC*`
- Devices named `BASE` or `BaseStation` are explicitly skipped

### Serial Bridge: "Access denied on COM4"
Another process holds the port:
```powershell
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*serial_bridge*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
python -u hardware/serial_bridge.py
```

### App stuck on "RELAY UNCONFIRMED" (never shows "DELIVERED")
SOS reached dashboard but ACK didn't return. Check in order:
1. Serial bridge terminal: does it print `Broadcasting signed ACK back to Mesh...`?
2. Both boards on US region and same channel?
3. `npm run android` logcat: look for `[MeshClient] Verified Ack received for <mid>`
4. If logcat shows `invalid gateway signature`: `GATEWAY_PUBLIC_KEY_HEX` in `MeshClient.ts` doesn't match `verify_key_hex` in `gateway_keypair.json`

### COM5 lora.region stays UNSET after setting
Must reboot after setting region:
```powershell
python -m meshtastic --port COM5 --set lora.region US
python -m meshtastic --port COM5 --reboot
# Wait 15 seconds
python -m meshtastic --port COM5 --info
```

### Dashboard doesn't show the SOS (replay dropped)
Replay protection blocks re-sends within 10 minutes. Check dashboard terminal for:
`Dropped replay: SOS from ...`
Wait 10 minutes, or test with a different hiker ID.

### "No TrailGuard node found" scan timeout
BLE scan runs 15 seconds. If COM5 isn't advertising:
- Verify BT enabled: `python -m meshtastic --port COM5 --info`
- Power-cycle COM5

---

## Quick-Start Checklist (Daily Use)

```
[ ] Plug COM4 (Base Station) USB into PC
[ ] Power on COM5 (Relay Node)
[ ] Terminal 1: cd C:\TrailGuard\services\dashboard && python app.py
[ ] Terminal 2: cd C:\TrailGuard && python -u hardware/serial_bridge.py
[ ] Browser: http://localhost:5000
[ ] Phone: open TrailGuard app, wait for "Meshtastic_fe24" to appear
[ ] Phone Bluetooth: ON
[ ] Test: hold SOS button 3 seconds -> expect "DELIVERED" within 10s
```
