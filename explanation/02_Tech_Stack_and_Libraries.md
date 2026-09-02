# TrailGuard: Tech Stack & Libraries

This document details every major technology and dependency used across the three tiers of the TrailGuard project, and *why* they were chosen.

## 1. Mobile Application (Hiker Client)
The mobile app is built to be cross-platform, highly performant, and capable of strict offline operation.

- **Framework:** React Native with Expo (specifically using EAS Build for compiling). 
- **Offline Mapping:** `react-native-maplibre-gl` (MapLibre GL Native). We use MBTiles (Mapbox Vector Tiles) because vector tiles are infinitely scalable and take up significantly less storage space than pre-rendered raster images, allowing a hiker to download an entire National Park map to their phone prior to losing cell service.
- **Cryptography:** `react-native-quick-crypto`. A highly performant crypto library for React Native that binds directly to C++ (JSI) rather than relying on slow JavaScript bridges. Used to generate Ed25519 keypairs and sign payloads.
- **Secure Storage:** `react-native-keychain`. Used to securely store the hiker's private Ed25519 key in the iOS Secure Enclave or Android Keystore.
- **State Management:** `AsyncStorage` for local persistence of settings (like WiFi Simulator toggles).

## 2. Firmware (Hardware Nodes)
The firmware runs on microcontrollers with extremely limited memory and CPU power.

- **Hardware:** ESP32 microcontrollers (specifically Heltec WiFi LoRa 32, Heltec V3).
- **Language/Environment:** C++ compiled via PlatformIO (using the ESP-IDF / Arduino core).
- **Core Networking:** Meshtastic Protocol. TrailGuard does not re-invent LoRa mesh routing; it builds a custom C++ module *on top* of the Meshtastic firmware to leverage its robust mesh algorithms.
- **Cryptography:** `TweetNaCl` (C implementation). Meshtastic natively uses `micro-ecc` which only supports NIST curves (ECDSA). TrailGuard requires Ed25519 for secure non-repudiation, so the firmware statically includes the tiny `TweetNaCl` library to perform cryptographic signature verification directly on the ESP32 chip.
- **Standard Library Adjustments:** Due to C++ compiler toolchain limitations on some IDEs and strict firmware size requirements, the firmware explicitly uses standard C libraries (`<stdint.h>`, `<stddef.h>`, `memcpy`, `printf`) over heavy C++ STL abstractions where possible.

## 3. Command Center (Dashboard & Backend)
The backend runs locally at the Ranger station. It does not rely on cloud services like AWS or Firebase, as the Ranger station may also lose internet access.

- **Backend Framework:** Python 3 with Flask. Chosen for its simplicity, fast local execution, and robust templating engine.
- **Database:** SQLite3. A local file-based database (`trailguard.db`). It requires no external server daemon, making it perfect for a rugged, plug-and-play Ranger Station laptop.
- **Frontend / UI:** Vanilla HTML, CSS, and JavaScript. 
  - *Templating:* Jinja2 (Flask's default).
  - *Styling:* Custom CSS (no Tailwind), utilizing modern CSS variables for Dark Navy / Amber aesthetics.
  - *Interactivity:* Vanilla JS fetch requests (`/api/...`) that poll the backend for new messages and update the DOM dynamically without page reloads.
- **Hardware Bridging:** The `meshtastic` Python library. It opens a serial connection to the Gateway Node plugged into the laptop via USB, reading binary packets off the radio and injecting them into the Flask API.
