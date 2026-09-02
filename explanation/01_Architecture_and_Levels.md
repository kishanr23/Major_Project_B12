# TrailGuard: Architecture & Levels

The TrailGuard system is strictly divided into three distinct architectural levels. Understanding these levels is critical to understanding how data traverses from a hiker in the woods to a ranger at a desk.

## Level 1: The Edge / Client (Mobile App)
**Hardware:** A smartphone (iOS or Android) running the TrailGuard App.
**Role:** The primary user interface for the hiker.
**Functionality:**
- **Offline Mapping:** Uses `MapLibre GL Native` to display pre-downloaded MBTiles (Vector Maps) so hikers can see their location via GPS without internet.
- **Cryptography Engine:** Holds the hiker's private Ed25519 key (stored in the phone's Secure Enclave). It signs all outgoing messages (SOS, Check-ins) to prove identity.
- **Node Communication:** Communicates with the hiker's personal Level 2 hardware node via Bluetooth Low Energy (BLE).

## Level 2: The Transport Mesh (Hardware Nodes)
**Hardware:** ESP32-based development boards with LoRa transceivers (e.g., Heltec WiFi LoRa 32, Heltec V3) and GPS modules.
**Role:** The decentralized radio network.
**Functionality:**
- **Meshtastic Protocol:** The nodes run custom firmware built on top of the open-source Meshtastic project. Meshtastic handles the complex LoRa mesh routing, repeating packets from node to node so they travel long distances over mountains.
- **TrailGuard Firmware Module:** A custom C++ application layer injected into the Meshtastic firmware. It intercepts TrailGuard-specific packets to:
  1. Verify cryptographic signatures.
  2. Implement O(1) Replay Protection (preventing attackers from re-sending old SOS packets).
  3. Format the data into extremely compact binary payloads.
- **Roles in Level 2:**
  - *Personal Nodes:* Carried by the hiker, talks to the Level 1 app via Bluetooth, and broadcasts into the mesh via LoRa.
  - *Relay Nodes:* Static nodes attached to trees or towers that simply repeat signals to extend network range.
  - *Gateway Node:* The final node in the mesh, physically plugged into the Level 3 Command Center via USB or UART.

## Level 3: The Command Center (Backend & Dashboard)
**Hardware:** A computer, Raspberry Pi, or local server located at the Ranger Station.
**Role:** Data ingestion, persistence, and Ranger UI.
**Functionality:**
- **Gateway Transport:** The physical bridge. A Python script (`GatewayTransport` via the `meshtastic` library) reads binary packets arriving from the Level 2 Gateway Node via USB Serial.
- **Flask API Backend:** Receives the decoded data from the Gateway, verifies it against the database of known hikers, and saves it to a local SQLite database (`trailguard.db`).
- **Web Dashboard:** A responsive HTML/CSS/JS frontend served by Flask. Rangers view a live updating web interface showing:
  1. An interactive map of hiker locations.
  2. The status of the mesh infrastructure (Node battery levels).
  3. The Security & SOS Audit Log.
