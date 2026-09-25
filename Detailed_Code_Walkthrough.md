# TrailGuard: Exhaustive Code Walkthrough

This document is a comprehensive, folder-by-folder, and file-by-file breakdown of the entire TrailGuard repository. It explains the purpose of every directory, the specific functions within the code, and the protocols and libraries used across the system.

---

## 1. `apps/mobile/` (The React Native Hiker App)
**Purpose:** Provides the offline-first smartphone interface for hikers and rangers. Since there is no cellular service on trails, this app uses Bluetooth Low Energy (BLE) to connect to physical TrailGuard nodes in the trees.
**Core Libraries:** `react-native-ble-plx` (for Bluetooth), `react-native-quick-crypto` (for fast Ed25519 cryptography), `expo-router` (for UI navigation).

### Key Files & Their Functions:
*   **`src/ble/MeshClient.ts`**
    *   **Functionality:** This is the Bluetooth engine of the app. 
    *   **Main Functions:**
        *   `scanForNodes()`: Uses the BLE radio to scan for nearby ESP32 devices broadcasting the specific "TrailGuard" service UUID.
        *   `sendSOS()`: When the hiker presses the panic button, this function takes their GPS coordinates, serializes them using Protobuf, encrypts them, and writes the byte array to the BLE characteristic of the connected node.
*   **`src/crypto/Signer.ts`**
    *   **Functionality:** Handles the security of the SOS packets.
    *   **Main Functions:**
        *   `signPacket()`: Takes the raw byte array of an SOS ping and signs it using the user's private Ed25519 cryptographic key. This ensures that a hacker in the woods cannot spoof a fake SOS, because the hardware nodes will reject any packet with an invalid signature.
*   **`src/proto/`**
    *   **Functionality:** Contains the auto-generated TypeScript code (from `trailguard.proto`) that translates JavaScript objects into raw, highly-compressed byte arrays (Protobufs) so they are small enough to send over slow LoRa radios.

---

## 2. `hardware/firmware/` (The ESP32 C++ Code)
**Purpose:** The physical microcontrollers deployed in the forest. They run on battery/solar power and communicate with each other using Long Range (LoRa) radio waves to form a mesh network.
**Core Libraries:** `PlatformIO`, `RadioLib` (for LoRa manipulation), `NimBLE-Arduino` (for highly efficient Bluetooth).

### Key Files & Their Functions:
*   **`modules/trailguard/src/TrailGuardModule.cpp`**
    *   **Functionality:** The absolute core loop of the physical node. It dictates how the node behaves when it receives a signal.
    *   **Main Functions:**
        *   `loop()`: Constantly checks both the LoRa antenna (for signals from other nodes) and the BLE antenna (for signals from smartphones).
        *   `routePacket()`: If an SOS packet is received via LoRa, it checks the routing table to see if it is the intended destination (the gateway). If not, it mathematically determines the fastest route and rebroadcasts the packet.
*   **`modules/trailguard/src/crypto.cpp`**
    *   **Functionality:** Performs cryptographic verification on the tiny ESP32 CPU.
    *   **Main Functions:**
        *   `verifySignature()`: Every time a node receives a packet (either from BLE or LoRa), this function checks the attached Ed25519 signature against the sender's public key. If the math fails, the packet is silently dropped to save battery and prevent network spam.

---

## 3. `services/dashboard/` (The Python Flask Web Portal)
**Purpose:** The command center for Park Rangers. It provides a real-time web interface, tracks hikers on a map, logs all security events, and manages the mesh network's health.
**Core Libraries:** `Flask`, `Flask-SocketIO` (for real-time updates), `SQLAlchemy` (for database management).

### Key Files & Their Functions:
*   **`app.py`**
    *   **Functionality:** The entry point for the web server. It initializes the database, the Socket.IO server, and registers all the web routes.
*   **`routes/gateway.py`**
    *   **Functionality:** The API endpoint that the physical Gateway Node talks to.
    *   **Main Functions:**
        *   `receive_packet()`: When an SOS makes it out of the forest, the gateway hits this endpoint. This function decodes the Protobuf, saves the SOS to the SQLite database, and instantly emits a Socket.IO `alert` event to all connected Ranger browsers.
*   **`routes/admin.py` & `routes/trails.py`**
    *   **Functionality:** Standard web endpoints for rangers to add new nodes to the database, manage trail layouts, and view security audits.
*   **`templates/index.html`**
    *   **Functionality:** The frontend code run in the Ranger's browser.
    *   **Main Functions:**
        *   Uses `Leaflet.js` to draw a map of the forest.
        *   Uses `socket.on('location_update')` to instantly move a hiker's marker on the map the exact second their ping escapes the forest, without requiring a page reload.

---

## 4. `services/gateway/` (The Python Serial Bridge)
**Purpose:** A physical computer (like a Raspberry Pi) sitting at the ranger station. It is plugged into the "Master Node" via a USB cable. It bridges the physical radio network to the internet.
**Core Libraries:** `pyserial` (for reading USB data), `requests` (for sending HTTP requests).

### Key Files & Their Functions:
*   **`src/main.py`**
    *   **Functionality:** The infinite loop running on the Raspberry Pi.
    *   **Main Functions:**
        *   `read_serial()`: Listens to the USB port. When the Master Node receives a LoRa packet, it spits the raw bytes over the USB cable. This function catches those bytes.
        *   `forward_to_dashboard()`: Takes those raw bytes and performs an HTTP POST request to `services/dashboard/routes/gateway.py` to get the data into the cloud.

---

## 5. `shared/protocol/` (The Universal Language)
**Purpose:** Because the project uses three completely different programming languages (TypeScript, C++, and Python), they all need to agree on exactly how data is formatted.
**Core Protocol:** `Protocol Buffers (Protobuf)`.

### Key Files & Their Functions:
*   **`trailguard.proto`**
    *   **Functionality:** The most important file in the system for cross-compatibility. 
    *   **Main Logic:** It explicitly defines the structure of a packet. For example:
        ```protobuf
        message SOSPacket {
            uint32 sender_id = 1;
            float latitude = 2;
            float longitude = 3;
            bytes ed25519_signature = 4;
        }
        ```
    *   **Why it is needed:** This file guarantees that when the TypeScript app turns a GPS coordinate into bytes, the C++ hardware knows exactly which bytes represent the latitude, and the Python dashboard knows exactly how to read them out. Without this file, the data would turn into corrupted gibberish as it crossed from Bluetooth to LoRa to USB.
