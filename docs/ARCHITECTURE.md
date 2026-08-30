# TrailGuard Architecture

## Overview
TrailGuard is an off-grid safety and communication system built on top of Meshtastic, focusing on low-bandwidth, high-reliability hiker check-ins and emergency SOS broadcasting over LoRa.

## Cryptography & Ed25519
Messages originated by Hikers (`CheckIn`, `SOS`, `TrailMessage`) are signed using Ed25519.
- **Why not Meshtastic's PSK?** Meshtastic provides channel encryption via AES-PSK, which provides confidentiality but not per-user non-repudiation or anti-spoofing guarantees. We need to know *which* hiker sent an SOS, and ensure a compromised node cannot forge hiker messages.
- **Firmware Implementation:** Meshtastic core uses `micro-ecc` which provides ECDSA/ECDH (NIST curves), but not Ed25519. For TrailGuard, the firmware module explicitly bundles `TweetNaCl` for real Ed25519 crypto operations within the C++ firmware.
- **Replay Protection (Firmware):** The `TrailGuardModule` implements replay protection using a strict O(1) memory bound to prevent heap exhaustion. It calculates a 64-bit hash (djb2) of `hiker_id + timestamp` and stores it in statically-allocated circular buffers partitioned by priority class. This partitioning (`100` slots for SOS/CheckIn, `200` slots for TrailMessages) ensures that a burst of low-priority status messages cannot evict critical SOS hashes before the 10-minute replay acceptance window expires. When a buffer fills, the oldest entries are overwritten.
- **Mobile App:** Uses `react-native-quick-crypto` for Ed25519 signing. The private key is generated on first install and stored securely in the platform secure enclave using `react-native-keychain`.
- **Key Provisioning:** 
  - *Node Pubkeys:* Generated on device, displayed via OLED or serial at setup. A staff member then uses the `dashboard/provisioning.py` CLI script to securely add this public key into the Dashboard's verification store before deployment.
  - *Hiker Pubkeys:* Trust-On-First-Use (TOFU). The first check-in from a hiker ID logs the public key. The dashboard flags this to operators as a "New Device".

## Gateway Transport Architecture
The Dashboard receives data from the LoRa mesh via a `GatewayTransport` abstraction. This allows the system to be run in different environments without altering the core ingest logic.

1. **RadioHatTransport**: The primary production adapter. Uses a Raspberry Pi Zero 2 W with an SX1262 LoRa HAT. This node actively participates in the mesh and forwards packets to the dashboard backend.
2. **SerialTransport**: A fallback/testing adapter. Uses a laptop connected via USB to a standard Heltec node (via the `meshtastic` Python library). 
   - *Caveat:* The SerialTransport only sees mesh traffic that reaches the specific node it is plugged into (its own radio range + whatever the mesh routes to it).

## Mobile App Offline Maps
To ensure mapping functionality without cellular coverage, the React Native app uses **MapLibre GL Native** to render **MBTiles** offline. Vector tiles provide infinite zoom capability at a smaller file size compared to pre-rendered raster tiles.
