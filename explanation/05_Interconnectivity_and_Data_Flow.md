# TrailGuard: Interconnectivity & Data Flow

This document maps out exactly how data physically travels from point A to point B across the different layers of the system. If you need to trace a bug, follow this flow.

## 1. The Mobile App to Personal Node (BLE)
**Medium:** Bluetooth Low Energy (BLE).
- The React Native app serializes the signed message into a binary payload using `MeshClient.ts`.
- It writes this payload to a specific BLE Characteristic exposed by the personal Heltec Node (using `react-native-ble-plx`).
- The `MeshClient` returns a `message_id` (djb2-64 hash of `hiker_id:node_id:timestamp`) for Ack tracking.
- The C++ Firmware reads the BLE buffer and passes it to the `TrailGuardModule` for cryptographic validation (TweetNaCl Ed25519 verify) and replay detection before enqueuing for broadcast.

## 2. Personal Node to Mesh Network (LoRa)
**Medium:** 915MHz Radio Frequency (LoRa).
- The Heltec node uses the SX1276 (V2) or SX1262 (V3) LoRa transceiver to modulate the binary payload into a radio wave.
- The Meshtastic core protocol manages the transmission, avoiding collisions using CSMA (Carrier Sense Multiple Access).
- *Relay Nodes* in the forest hear the transmission. They check their internal routing tables and repeat the signal, effectively bouncing the data over mountains until it reaches the Command Center.
- The firmware's priority queue ensures SOS packets are transmitted before CheckIns, which are transmitted before TrailMessages.

## 3. Mesh Network to Gateway Transport (Serial USB / SPI)
**Medium:** USB Serial or SPI GPIO.
Two gateway transport adapters handle this connection:

### 3a. SerialTransport (Development / Fallback)
- The Gateway Node (Heltec V3) at the Ranger station receives the LoRa transmission.
- It sends the received binary packet over its physical USB serial port.
- On the Ranger's laptop, the `GatewayTransport` Python daemon is constantly listening to `/dev/ttyUSB0` (or `COM3` on Windows).
- It reads the serial byte stream and parses the Meshtastic protobuf wrapper to extract the raw TrailGuard binary payload.

### 3b. RadioHatTransport (Production)
- A Raspberry Pi Zero 2 W runs the dashboard with an SX1262 LoRa HAT connected directly via the 40-pin SPI GPIO header.
- The HAT actively participates in the mesh as a first-class node (not just a passive listener).
- Received packets are passed from the SPI bus directly into the Python application context — no serial port involved.

## 4. Gateway Transport to Backend Database (Python / SQLite)
**Medium:** Inter-process memory / File I/O.
- The `GatewayTransport` daemon passes the extracted TrailGuard payload to the Flask `/ingest` endpoint.
- **Replay Protection:** The backend computes a dedup key hash (`hiker_id:msg_type:timestamp` → djb2-64) and checks against the database. Payloads older than 10 minutes or with duplicate hashes are dropped.
- **Signature Verification:** The `TofuStore` in `crypto_utils.py` uses PyNaCl to verify the Ed25519 signature. If the hiker's Public Key is unknown, it is accepted (TOFU) and flagged as "New Device."
- **SecurityMonitor:** Invalid signatures and replays are tracked by the `SecurityMonitor` class. Per-hiker escalation (>3 rejections/60s) triggers a spoofing alert; fleet-wide escalation (>5 rejections/60s) triggers a version-mismatch warning.
- The Flask backend inserts the verified message into the `messages` table with a unique `message_id`.
- If the payload is an SOS or CheckIn, the backend:
  1. Signs an Ack payload (`original_message_id_utf8 || ack_timestamp_be4`) with the Gateway's Ed25519 keypair.
  2. Inserts the signed Ack into the `pending_acks` table for gateway relay.
- If the payload is an SOS, Flask inserts a new row into the `security_logs` table with `escalation_status='active'`.

## 5. Backend to Frontend UI (Socket.IO + AJAX / HTTP)
**Medium:** Local HTTP / WebSocket / JavaScript.
The Dashboard UI receives updates via two complementary mechanisms:

### 5a. Socket.IO Push Events (Real-Time)
- The Flask backend uses `flask-socketio` to emit events immediately when data arrives:
  - `new_message` — Pushed for every verified ingest (CheckIn, SOS, TrailMessage).
  - `new_device_alert` — Pushed when a TOFU-registered hiker is seen for the first time.
  - `security_escalation` — Pushed when the SecurityMonitor detects per-hiker or fleet-wide attack patterns.
  - `security_alert` — Pushed for routine (non-escalated) rejections.
- The JavaScript frontend listens to these events and updates the DOM instantly — no polling delay.

### 5b. JavaScript Fetch Polling (Fallback)
- As a complementary mechanism, the dashboard JavaScript runs a `setInterval` loop that performs a `fetch('/api/map/data')` every 5 seconds.
- The Flask backend queries the SQLite database and returns a lightweight JSON array of the latest hiker locations and active alerts.
- The JavaScript DOM manipulation updates the Leaflet.js map markers and the Security Log tables dynamically, alerting the Ranger.

## 6. Ack Return Path (Dashboard → Mesh → Phone)
**Medium:** HTTP → LoRa → BLE.
This step closes the delivery confirmation loop:

1. The Gateway Transport daemon polls the `/pending_acks` endpoint to pick up signed Ack messages.
2. Each Ack contains the `original_message_id`, `ack_timestamp_unix`, `signature_hex`, and the `gateway_pubkey_hex`.
3. The Gateway node transmits the Ack back into the LoRa mesh. Relay nodes route it toward the hiker's personal node.
4. The personal node delivers the Ack to the hiker's phone over BLE.
5. On the phone, `AckVerifier.ts` reconstructs the Ack signature payload (`original_message_id_utf8_bytes || ack_timestamp_unix_big_endian_4_bytes`) and verifies the Ed25519 signature against the provisioned gateway public key.
6. Only if verification succeeds does the UI transition from "Relay unconfirmed" → **"Delivered"**.
7. If verification fails, the Ack is silently dropped and the UI stays in "Relay unconfirmed".
8. After successful relay, the gateway daemon DELETEs the Ack from `/pending_acks/<message_id>` to prevent re-transmission.

## 7. Demo Mode Interconnectivity (WiFi Simulator)
If physical LoRa hardware is unavailable, the flow bypasses steps 1, 2, and 3:
- **Medium:** Local Area Network (WiFi / HTTP).
- The Mobile App packages the same exact cryptographic binary payload, but instead of sending it over BLE, it converts it to Base64.
- It sends an HTTP POST request directly to the Flask Backend at `http://<laptop-ip>:5000/api/demo-ingest`.
- **Security Check:** The Flask Backend only accepts this request if the server is running in development mode (`FLASK_ENV=development`). In production, this backdoor is disabled.
- The Flask Backend receives the Base64 string, decodes it, and passes it directly into Step 4 (Data Ingest & Verification) as if it had just arrived over the serial cable from a Gateway node.
- The Ack is returned immediately in the HTTP response body (bypassing Step 6's mesh relay), allowing the mobile app to verify delivery confirmation instantly.

## 8. Multi-Hop Simulator Interconnectivity
For integration testing without physical hardware, the `gateway/serial_adapter.py` simulator models a full multi-hop topology:
- **Topology:** `Phone ↔ Node_A ↔ Node_B ↔ GatewayNode ↔ Dashboard`
- Each `SimulatedNode` introduces a 500ms delay to simulate LoRa airtime.
- The simulator sends CheckIn and SOS payloads through the topology chain, then enters a continuous Ack relay loop (polling `/pending_acks` every 2 seconds and routing Acks back through the reverse path).
- All output is clearly labelled `[SIMULATED]` so it is never mistaken for real hardware evidence.
