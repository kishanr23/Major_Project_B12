# TrailGuard: Project Overview & Context
**Target Audience:** AI Assistants (Claude/ChatGPT/Gemini), Developers, and Project Maintainers.
**Purpose:** Provide a high-level summary of the TrailGuard system, its primary mission, and its core constraints.

## 1. Project Mission
TrailGuard is an **off-grid safety, tracking, and communication system** designed for hikers, park rangers, and outdoor enthusiasts operating in environments with **zero cellular or internet connectivity**. 

The primary goal is to save lives by providing a reliable way for hikers to:
1. Check-in at various trail points.
2. Broadcast emergency SOS signals.
3. Allow park rangers to monitor hiker locations and statuses in real-time from a centralized dashboard.

## 2. The Core Problem
In deep wilderness or forest trails, cellular networks do not exist. Traditional satellite communication devices (like Garmin inReach) require expensive subscriptions and line-of-sight to satellites. 
TrailGuard solves this by utilizing a decentralized **LoRa (Long Range) Radio Mesh Network**, powered by the open-source **Meshtastic** protocol, creating a localized, free-to-use communication web across the trails.

## 3. High-Level Concept
- **Hikers** carry a small, battery-powered LoRa radio device (a "Node") clipped to their backpack. They interact with this node via Bluetooth using the **TrailGuard Mobile App** on their phone.
- **Rangers** deploy static LoRa relay nodes throughout the forest (on trees, ranger stations, peaks) to form a robust radio mesh.
- **The Command Center** has a Gateway Node that receives all mesh traffic and feeds it into the **TrailGuard Dashboard**, where Rangers see a live map of all hikers, their last known locations, and incoming SOS alerts.

## 4. Key Constraints & Design Choices
- **Low Bandwidth:** LoRa is extremely slow (often < 1 kbps). The system must use tiny, heavily optimized binary data payloads. We cannot send images, audio, or verbose JSON strings over the radio.
- **Decentralization vs. Centralization:** While the radio network is a decentralized mesh (Meshtastic), the *application logic* is centralized at the Ranger Station (Dashboard). 
- **Security:** Anyone can buy a LoRa radio and listen to the frequencies. TrailGuard must ensure that a malicious actor cannot spoof a hiker's SOS signal, replay old check-ins, or alter hiker locations. Cryptographic signatures (Ed25519) are strictly enforced.

## 5. Summary of System Components
1. **TrailGuard Mobile App (React Native):** The user interface for the hiker. Works fully offline with downloaded maps. Features Ed25519 key generation, BLE node pairing, offline mapping (MapLibre + MBTiles), Check-In/SOS with delivery confirmation (Ack round-trip), compass/bearing navigation, and RSSI-based node roaming.
2. **TrailGuard Firmware (C++ / ESP32):** The custom logic running on the LoRa radios (Heltec boards) that handles routing, Ed25519 cryptographic verification (TweetNaCl), O(1) replay protection (djb2-64 hash ring with partitioned buffers), per-type payload size enforcement, strict priority queueing (SOS > CheckIn > TrailMessage), and adaptive sleep based on battery/solar telemetry.
3. **TrailGuard Dashboard (Python / Flask):** The Ranger interface featuring a live Leaflet.js map, real-time updates via Socket.IO, SOS alert management (acknowledge/resolve workflow), SecurityMonitor for attack detection (per-hiker and fleet-wide escalation), TOFU key registration, trail catalog management, user authentication with role-based access, and a full security audit log.
