# TrailGuard: Working of the Project (Business Logic & Workflows)

This document explains exactly how the TrailGuard system operates from the perspective of the users (Hikers and Rangers).

## 1. Hiker Workflow (The Mobile App)

### Initialization & Setup
1. A hiker downloads the TrailGuard app before leaving for the National Park.
2. Upon first launch, the app uses `react-native-quick-crypto` to generate a secure Ed25519 Public/Private keypair. The Private Key is locked in the phone's hardware Secure Enclave (iOS) or Android Keystore via `react-native-keychain`. The generated Hiker ID is persisted locally via `AsyncStorage`.
3. The hiker downloads the offline vector map (MBTiles) for the specific park they are visiting. These maps are rendered by `MapLibre GL Native` without any network tile requests. If a valid MapTiler key is present, a 3D terrain mesh is also downloaded for offline topographic visualization.
4. When they arrive at the trailhead (where there is no cell service), they turn on their personal Heltec LoRa node.
5. The mobile app performs a 5-second BLE scan to find all nearby nodes and connects to the one with the strongest signal (best RSSI) via `react-native-ble-plx`.

### Sending a Check-In
1. As the hiker walks, they open the app and press "Check In".
2. They can optionally type a message (capped at 140 characters).
3. The app reads the phone's GPS coordinates via `expo-location`.
4. It packages the GPS coordinates, the hiker's Public Key, message type, and the current Timestamp into a compact binary payload.
5. The app signs this payload with the Private Key, producing a 64-byte Ed25519 signature.
6. This signed payload is written over BLE to the hiker's LoRa node's BLE Characteristic.
7. The LoRa node's firmware verifies the signature using TweetNaCl. If valid, it enqueues the packet in the priority queue and broadcasts it into the wilderness over the 915MHz LoRa radio frequency.

### Triggering an SOS
1. If the hiker is in danger, they press the large red "SOS" button in the app.
2. The SOS button requires a **3-second hold-to-confirm** (with an animated fill bar) to prevent accidental activation.
3. The exact same signing process occurs, but the `Type` byte in the payload is set to `SOS` (High Priority). The phone's GPS fix is automatically attached.
4. The node broadcasts this packet with maximum transmission power and priority flags. The firmware's strict priority queue ensures SOS packets preempt all other traffic (`SOS > CheckIn > TrailMessage`).

### Delivery Confirmation (Ack Round-Trip)
After sending a Check-In or SOS, the mobile app tracks delivery status through three states:
1. **"Sent to node"** — The signed payload was successfully written to the personal node via BLE.
2. **"Relay unconfirmed"** — The node has broadcast the packet into the mesh, but no delivery confirmation has been received yet. The app shows this state after BLE write success.
3. **"Delivered"** — The Dashboard gateway has received the message, and sent back a signed Ack (Ed25519 signed by the gateway's keypair). The `AckVerifier.ts` module on the phone validates the gateway's signature before transitioning to this state. **A forged or unsigned Ack will never produce a "Delivered" state.**
4. If no verified Ack arrives within **30 seconds**, the UI remains at "Relay unconfirmed" — the hiker knows the message may not have reached the Ranger Station.

### Compass & Bearing (Navigation Aid)
The app includes a `BearingScreen` with an animated compass needle driven by `expo-location` (polled at 2-second intervals). It computes great-circle distance and bearing to the connected node using the haversine formula, animates through the shortest arc, and displays GPS accuracy radius so the hiker can judge fix quality.

### Node Roaming (BLE Handoff)
As the hiker moves along the trail and comes within range of different relay nodes, the app performs RSSI-based BLE node handoff:
- The `MeshClient` continuously monitors the signal strength (RSSI) of the connected node.
- When a stronger node is detected, a **Break-Before-Make** handoff is triggered: the app disconnects from the current node and reconnects to the nearer one.
- Ack listeners are preserved across handoffs so that in-flight delivery confirmations are not lost.

## 2. Ranger Workflow (The Dashboard)

### The Command Center
1. At the Ranger Station, the command center runs on either:
   - A **Raspberry Pi Zero 2 W** with an SX1262 LoRa HAT (production `RadioHatTransport` — gateway participates in the mesh via SPI GPIO), or
   - A **laptop** with a Heltec node plugged in via USB (development `SerialTransport` — uses the `meshtastic` Python library over serial).
2. The Gateway node is continuously listening to the LoRa radio mesh for incoming packets.
3. When the Gateway receives a hiker's packet, it passes the raw bytes to the `GatewayTransport` Python daemon.

### Data Ingest & Verification
1. The Python backend receives the raw packet and extracts the binary payload.
2. **Replay Protection:** It computes the canonical dedup key hash (`hiker_id:msg_type:timestamp` via djb2-64) and checks against the database. Any payload older than 10 minutes or with a duplicate hash is dropped.
3. **Signature Verification:** Using PyNaCl, it verifies the Ed25519 signature against the hiker's Public Key.
4. **TOFU Key Registration:** If the hiker's Public Key is unknown, the `TofuStore` accepts the key and flags it as a "New Device" in the UI. From then on, that Hiker ID is strictly bound to that Public Key.
5. It saves the verified event to the local SQLite database (`trailguard.db`):
   - The `messages` table stores all messages with their `message_id`, type, hiker ID, node ID, timestamp, and payload.
   - The `security_logs` table receives SOS events with `escalation_status='active'`.
6. **Ack Generation:** The backend signs an Ack message with the gateway's Ed25519 keypair and places it in the `pending_acks` table for the gateway to relay back through the mesh to the hiker's phone.

### SecurityMonitor (Threat Detection)
The `SecurityMonitor` class provides unified rejection tracking for both replay attacks and invalid signatures:
- It records all rejections with timestamps and hiker IDs in a 60-second sliding window.
- **Per-ID Escalation:** If more than 3 rejections from the same hiker ID occur within 60 seconds, it flags a **"Spoofing/Replay Attack"** and emits a real-time `security_escalation` event via Socket.IO.
- **Fleet-Wide Escalation:** If more than 5 total rejections (any hiker) occur within 60 seconds, it flags an **"Elevated security failure rate"** — potentially indicating a firmware version mismatch or coordinated attack.
- All security events are persisted to the `security_logs` table for audit.

### The UI Response
1. The Ranger views the Web Dashboard in their browser. The dashboard receives real-time updates via two mechanisms:
   - **Socket.IO push events** (`new_message`, `new_device_alert`, `security_escalation`) for instant notifications.
   - **JavaScript `fetch()` polling** of the `/api/...` endpoints every 5 seconds as a fallback for map data updates.
2. When an SOS event is detected:
   - The Hiker's icon on the Live Map (Leaflet.js + OpenStreetMap) turns **Red and pulses**.
   - An alert appears in the "SOS Alerts" page requiring immediate acknowledgment.
   - If the hiker is a first-time TOFU device, a "New Device" badge is displayed.
3. The Ranger can **Acknowledge** the SOS (marking it as being handled) and dispatch a rescue team to the exact GPS coordinates provided in the payload.
4. Once the hiker is saved, the Ranger clicks **"Resolve"** in the Security Log, which updates the database, clears the red pulsing alert on the map, and records who resolved it and when.

### Trail & User Management
- **Trail Catalog:** Rangers can manage a catalog of trails (`trail_catalog` table) with metadata including name, country, state, district, center coordinates, default zoom level, description, and associated MBTiles filename.
- **User Management:** The dashboard includes an authentication system with login (`login.html`) and user management (`manage_users.html`). Users have roles and are stored in the `users` table with hashed passwords.

## 3. The WiFi Simulator (Demo Mode)
Since testing radio hardware indoors can be difficult, the project includes a **WiFi Simulator Toggle**.
- When enabled in the Mobile App's Profile settings, the app entirely bypasses the Bluetooth and LoRa hardware.
- Instead, it sends the signed Check-In and SOS payloads directly over the local WiFi network to the Flask backend's `/api/demo-ingest` endpoint via HTTP POST (payload is Base64-encoded).
- For strict security, this endpoint is **completely disabled** in production. It only functions if the Dashboard is started with `FLASK_ENV=development`.
- The Flask backend decodes the Base64 string and processes it through the **identical** ingest pipeline (signature verification, replay protection, TOFU, database persistence, Ack generation) as if it had arrived over the serial cable from a Gateway node.
- This allows developers to demonstrate and test the entire cryptographic and UI workflow instantly without needing physical ESP32 boards.

## 4. Multi-Hop Mesh Simulator
For Phase 7 integration testing, the project includes a **Multi-Hop Gateway Simulator** (`gateway/serial_adapter.py`):
- It models a software topology: `Phone ↔ Node_A ↔ Node_B ↔ GatewayNode ↔ Dashboard`.
- Each `SimulatedNode` introduces a 500ms delay to simulate LoRa airtime.
- It generates fresh Ed25519 keypairs for demo hikers, sends simulated CheckIns and SOS messages through the topology, and runs a continuous Ack relay loop.
- All output is clearly labelled `[SIMULATED]` so it is never mistaken for real hardware evidence in test reports.
