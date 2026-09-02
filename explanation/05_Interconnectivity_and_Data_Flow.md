# TrailGuard: Interconnectivity & Data Flow

This document maps out exactly how data physically travels from point A to point B across the different layers of the system. If you need to trace a bug, follow this flow.

## 1. The Mobile App to Personal Node (BLE)
**Medium:** Bluetooth Low Energy (BLE).
- The React Native app serializes the signed message into a binary payload.
- It writes this payload to a specific BLE Characteristic exposed by the personal Heltec Node.
- The C++ Firmware reads the BLE buffer and passes it to the `TrailGuardModule` for cryptographic validation before broadcasting.

## 2. Personal Node to Mesh Network (LoRa)
**Medium:** 915MHz Radio Frequency (LoRa).
- The Heltec node uses the SX1262/SX1276 LoRa transceiver to modulate the binary payload into a radio wave.
- The Meshtastic core protocol manages the transmission, avoiding collisions using CSMA (Carrier Sense Multiple Access).
- *Relay Nodes* in the forest hear the transmission. They check their internal routing tables and repeat the signal, effectively bouncing the data over mountains until it reaches the Command Center.

## 3. Mesh Network to Gateway Transport (Serial USB)
**Medium:** USB / UART.
- The Gateway Node at the Ranger station receives the LoRa transmission.
- It sends the received binary packet over its physical USB serial port.
- On the Ranger's laptop, the `GatewayTransport` Python daemon is constantly listening to `/dev/ttyUSB0` (or `COM3` on Windows).
- It reads the serial byte stream and parses the Meshtastic protobuf wrapper to extract the raw TrailGuard binary payload.

## 4. Gateway Transport to Backend Database (Python / SQLite)
**Medium:** Inter-process memory / File I/O.
- The `GatewayTransport` daemon passes the extracted TrailGuard payload into the Flask Application Context.
- The Flask backend extracts the Public Key and queries the `trailguard.db` SQLite database to check if this hiker is known.
- If the payload is an SOS, Flask inserts a new row into the `security_logs` table with `escalation_status='ACTIVE'`.
- It also updates the `hiker_locations` table with the new GPS coordinates and timestamp.

## 5. Backend to Frontend UI (AJAX / HTTP)
**Medium:** Local HTTP / JavaScript Fetch.
- The Dashboard UI (rendered in the browser) does not use WebSockets (to keep the tech stack brutally simple).
- Instead, `static/js/app.js` runs a `setInterval` loop that performs a `fetch('/api/map/data')` every 5 seconds.
- The Flask backend queries the SQLite database and returns a lightweight JSON array of the latest hiker locations and active alerts.
- The Javascript DOM manipulation updates the MapLibre markers and the Security Log tables dynamically, alerting the Ranger.

## 6. Demo Mode Interconnectivity (WiFi Simulator)
If physical LoRa hardware is unavailable, the flow bypasses steps 1, 2, and 3:
- **Medium:** Local Area Network (WiFi / HTTP).
- The Mobile App packages the same exact cryptographic binary payload, but instead of sending it over BLE, it converts it to Base64.
- It sends an HTTP POST request directly to the Flask Backend at `http://<laptop-ip>:5000/api/demo-ingest`.
- The Flask Backend receives the Base64 string, decodes it, and passes it directly into Step 4 (Data Ingest & Verification) as if it had just arrived over the serial cable from a Gateway node.
