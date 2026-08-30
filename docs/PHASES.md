# TrailGuard Project Phases

This document tracks the detailed execution phases of the TrailGuard project, highlighting what is built and verified in each phase.

## Phase 1: Protocol & Firmware Skeleton (Completed)
**Goal:** Establish the foundational protocol structure, architecture documentation, and core firmware logic for message handling without requiring physical radios.

**What was built:**
- **Protocol Definition:** Created `protocol/trailguard.proto` as the single source of truth for message structures. Added definitions for `NodeInfo`, `CheckIn`, `SOS`, `TrailMessage` (with `PresetCode`), and an `Ack` message for delivery status.
- **Architecture Documentation:** Authored `docs/ARCHITECTURE.md` detailing:
  - Cryptography choices (bundling `micro-ed25519` for firmware, using `react-native-sodium` and secure enclave for mobile).
  - The Gateway Transport architecture (`RadioHatTransport` vs `SerialTransport`).
  - Offline map strategies (MBTiles + MapLibre GL Native).
  - The key provisioning workflow (`dashboard/provisioning.py`).
- **Firmware Priority Queue:** Scaffolded `TrailGuardModule.h` and `.cpp` implementing a strict priority queue (`SOS` > `CheckIn` > `TrailMessage`).
- **Replay Protection & Constraints:** Implemented a fixed-size `O(1)` static circular buffer (`std::array<uint64_t>`) in the firmware module to track message hashes and drop replays.
  - **Refinement 1:** The dedup key was widened to a 64-bit djb2 hash to eliminate collisions.
  - **Refinement 2:** The circular buffer is strictly partitioned (`100` slots for SOS/CheckIn, `200` slots for TrailMessages) to guarantee high-volume TrailMessage bursts cannot evict SOS hashes prematurely.
  - **Refinement 3:** Added `test_replay_protection_wrap()` in `test_priority.cpp` to prove that flooding the buffer successfully evicts the oldest entries while preserving hashes still within the replay window.
  - Added payload size enforcement to reject `TrailMessage` packets exceeding 140 characters.
- **Firmware Crypto Skeleton:** Created `crypto.h` and `.cpp` defining the `sign_message` and `verify_signature` endpoints, prepared for `micro-ed25519` integration.
- **Unit Testing:** Wrote `test_priority.cpp` (mocking the radio interface) to assert that an SOS preempts a backlog of TrailMessages, oversized messages are rejected, and identically signed replays are dropped.

---

## Phase 2: Firmware BLE & Mesh Integration (Completed)
**Goal:** Connect the firmware module logic to the actual Meshtastic core, handling real mesh routing and BLE interactions.
**What was built:**
- Simulated Meshtastic internal Protobuf routing hooks (`mesh_simulator.cpp`).
- **Integrated real Ed25519 cryptography using vendored TweetNaCl (removed placeholder).**
- Implemented adaptive sleep logic based on node telemetry (battery/solar).
- Tested relaying of signed `CheckIn`/`SOS` packets between two nodes over simulated RF/serial.

---

## Phase 3: Mobile App BLE Client (Completed)
**Goal:** Build the React Native mobile app capable of scanning, connecting, and securely transmitting signed CheckIns over BLE to the node.
**What was built:**
- Scaffolded Expo Dev Client with `react-native-ble-plx`, `react-native-keychain`, and `react-native-quick-crypto`.
- Proved 100% interoperability between the firmware's TweetNaCl Ed25519 and the mobile app's Node crypto (OpenSSL/libsodium equivalent) via a dedicated test script (`test_crypto_interop.js`).
- Implemented `Signer.ts` for secure on-device key generation and keychain storage.
- Implemented `MeshClient.ts` to scan, connect, decode `NodeInfo` protobufs, and sign/write `CheckIn` packets.
- **Note on Hardware:** Physical execution of the BLE round-trip test is deferred until the Heltec boards arrive; the app logic is fully implemented and compiled.
- **Note on Maps:** MapLibre offline maps have been explicitly deferred to a later sub-phase to keep this sprint focused on BLE/Crypto.

## Phase 4: Mobile App UX (Completed)
**Goal:** Flesh out the offline mapping and user-facing safety features of the mobile app.
**What was built:**
- `MapScreen.tsx`: Renders the offline MBTiles trail map using `@maplibre/maplibre-react-native` v10+ named API (`Map`, `Camera`, `RasterSource`, `Layer`, `Marker`, `UserLocation`). Shows a node pin and user location dot. No network tiles are ever requested.
- `BearingScreen.tsx`: Animated compass needle driven by `expo-location` (polled at 2 s). Computes great-circle distance and bearing via haversine, animates through the shortest arc, and displays GPS accuracy radius so the hiker can judge fix quality.
- `CheckInScreen.tsx`: 140-char-capped text input, signed `CheckIn` send flow, explicit `'Sent to node' / 'Relay unconfirmed'` status (Ack wiring deferred to Phase 5).
- `SosScreen.tsx`: Hold-to-confirm 3-second button with animated fill bar prevents accidental sends. Attaches phone GPS fix. Same `'Sent to node' / 'Relay unconfirmed'` status.
- `src/utils/haversine.ts`: Pure haversine formula, `formatDistance`, and `bearingLabel` helpers.
- `src/context/NodeContext.tsx`: React context making `nodeInfo` and `isConnected` available to all screens without prop-drilling.
- `app.json`: Added `expo-location` plugin; iOS `NSLocationWhenInUseUsageDescription` + `NSLocationAlwaysAndWhenInUseUsageDescription`; Android `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`.
- **TypeScript:** All Phase 4 files (`tsc --noEmit`) exit 0.

---

## Phase 5: Dashboard & Gateway (Completed)
**Goal:** Build the trailhead operations dashboard, gateway simulator, and end-to-end Ack round-trip.
**What was built:**
- **Signed Ack:** `trailguard.proto` updated — `Ack` now carries a mandatory `bytes signature` field. An unverified Ack must not produce a "Delivered" state.
- **Canonical hash spec:** `docs/MESSAGE_HASH_SPEC.md` defines the djb2-64 algorithm with `':'` separator, dedup key (`hiker_id:timestamp`), and message_id (`hiker_id:node_id:timestamp`). Firmware's Phase 1 underscore separator was corrected to match.
- **Cross-language hash vectors:** `test_vectors/hash_vectors.json` (7 vectors). Verified by:
  - `test_vectors/verify_hash_vectors.js` (JS/TS) — 7/7 PASS
  - `test_vectors/verify_hash_vectors.py` (Python) — 7/7 PASS
  - `test_vectors/verify_hash_vectors.cpp` (C++) — standalone build, runs on CI when g++ available
- **`dashboard/crypto_utils.py`:** djb2-64, dedup_key, message_id, TOFU store, hiker sig verify, Ack sig build/verify.
- **`dashboard/app.py`:** Flask + Socket.IO, SQLite, /ingest (replay + TOFU + sig check), /pending_acks (Ack pickup), /api/messages.
- **`dashboard/templates/index.html`:** Leaflet + OSM, Socket.IO live feed, SOS red/pulsing banner, teal CheckIn/TrailMessage, TOFU new-device badge.
- **`dashboard/provisioning.py`:** show-gateway-key, add-node, list-nodes CLI.
- **`gateway/serial_adapter.py`:** Loopback simulator, clearly labeled `[SIMULATED]` in all output.
- **`dashboard/tests/test_crypto.py`:** 30 pytest cases — djb2/dedup/msgid (7), replay protection (6), hiker sig verification (6), TOFU (4), Ack signature (7), including explicit test that tampered/unsigned Ack does NOT produce "Delivered".
- **Mobile app Ack wiring:**
  - `src/utils/hashUtils.ts`: `computeMessageId` and `dedupKey` (canonical djb2-64, BigInt).
  - `src/crypto/AckVerifier.ts`: verifies gateway Ed25519 over `original_message_id_utf8 || ack_timestamp_be4`.
  - `MeshClient.ts`: `sendCheckIn/sendSos` return message_id; `handleAck` verifies sig before firing callback.
  - `SosScreen.tsx` + `CheckInScreen.tsx`: three-state UI (sending → sent_unconfirmed → **delivered**). "Delivered" only on verified Ack; 30 s timeout leaves UI in "Relay unconfirmed".
- **TypeScript:** All Phase 5 files exit 0.
- **Pytest:** 30/30 passed.

---

## Phase 6: Node Roaming (Software Implemented; Hardware Pending)
**Goal:** Implement RSSI-based BLE node handoff so the hiker's phone can transparently reconnect to the nearest node as they move along the trail.
**Status:**
- RSSI monitoring + Break-Before-Make handoff + race-condition fix — implemented and code-reviewed.
- Automated `MeshClient.test.ts` — 3/3 PASS (mock BLE manager testing RSSI-triggered rescan, early-exit, and ackListener preservation).
- Physical two-node field validation — not yet done, hardware pending.

---

## Phase 7: Integration, Polish & Field Prep (Software Implemented; Hardware Pending)
**Goal:** Verify full end-to-end operation across the mesh with physical hardware.
**Status:**
- TX-contention priority test — implemented, independently compiled and passed (7/7, verified outside your environment).
- SecurityMonitor unified rejection tracking (replay + invalid signature, per-ID and fleet-wide escalation) — implemented and reviewed.
- Multi-hop `serial_adapter.py` simulator — implemented, clearly labeled `[SIMULATED]`.
- Physical multi-node field validation (real TX airtime contention, real multi-hop relay over actual radios) — not yet done, hardware pending.
