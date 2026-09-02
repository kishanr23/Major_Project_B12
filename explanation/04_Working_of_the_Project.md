# TrailGuard: Working of the Project (Business Logic & Workflows)

This document explains exactly how the TrailGuard system operates from the perspective of the users (Hikers and Rangers).

## 1. Hiker Workflow (The Mobile App)

### Initialization & Setup
1. A hiker downloads the TrailGuard app before leaving for the National Park.
2. Upon first launch, the app uses `react-native-quick-crypto` to generate a secure Ed25519 Public/Private keypair. The Private Key is locked in the phone's hardware Secure Enclave.
3. The hiker downloads the offline vector map (MBTiles) for the specific park they are visiting.
4. When they arrive at the trailhead (where there is no cell service), they turn on their personal Heltec LoRa node.
5. The mobile app connects to the node via Bluetooth Low Energy (BLE).

### Sending a Check-In
1. As the hiker walks, they open the app and press "Check In".
2. The app reads the phone's GPS coordinates.
3. It packages the GPS coordinates, the hiker's Public Key, and the current Timestamp into a small byte array.
4. The app signs this array with the Private Key, attaching a 64-byte signature.
5. This package is sent over BLE to the hiker's LoRa node.
6. The LoRa node verifies the signature. If valid, it broadcasts the packet into the wilderness over the 915MHz LoRa radio frequency.

### Triggering an SOS
1. If the hiker breaks their leg, they press the large red "SOS" button in the app.
2. The exact same process occurs, but the `Type` byte in the payload is set to `SOS` (High Priority).
3. The node broadcasts this packet with maximum transmission power and priority flags, telling the mesh network to route it to the Ranger Station immediately.

## 2. Ranger Workflow (The Dashboard)

### The Command Center
1. At the Ranger Station, a computer is running the Flask Dashboard.
2. A Gateway LoRa node is plugged into the computer via USB. This node is listening to the radio mesh.
3. When the Gateway hears the hiker's SOS packet, it passes it over the USB serial cable to the `GatewayTransport` Python script.

### Data Ingest & Verification
1. The Python backend receives the raw binary string.
2. It unpacks the struct to find the Hiker's Public Key and the Signature.
3. It validates the Ed25519 signature to guarantee it was actually sent by that hiker.
4. It checks the Timestamp to ensure this isn't a Replay Attack.
5. It saves the SOS event to the local SQLite database (`trailguard.db`).

### The UI Response
1. The Ranger is looking at the Web Dashboard. The dashboard uses JavaScript `fetch()` to poll the backend `/api/...` endpoints every few seconds.
2. The dashboard detects the new SOS event.
3. The UI immediately updates:
   - The Hiker's icon on the Live Map turns Red and pulses.
   - An alert appears in the "Security Log" tab requiring immediate acknowledgment.
4. The Ranger dispatches a rescue helicopter to the exact GPS coordinates provided in the payload.
5. Once the hiker is saved, the Ranger clicks "Resolve" in the Security Log, which updates the database and clears the red pulsing alert on the map.

## 3. The WiFi Simulator (Demo Mode)
Since testing radio hardware indoors can be difficult, the project includes a **WiFi Simulator Toggle**.
- When enabled in the Mobile App's Profile settings, the app entirely bypasses the Bluetooth and LoRa hardware.
- Instead, it sends the signed Check-In and SOS payloads directly over the local WiFi network to the Flask backend's `/api/demo-ingest` endpoint via HTTP POST.
- This allows developers to demonstrate and test the entire cryptographic and UI workflow instantly without needing physical ESP32 boards.
