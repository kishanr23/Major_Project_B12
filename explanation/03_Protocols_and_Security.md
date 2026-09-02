# TrailGuard: Protocols & Security

TrailGuard operates in a zero-trust, open-air environment. Anyone can buy a LoRa radio and listen to the Meshtastic frequencies. The system must prevent malicious actors from spoofing SOS signals, altering hiker locations, or performing replay attacks.

## 1. Cryptographic Standard: Ed25519
While Meshtastic natively provides AES-256-PSK (Pre-Shared Key) encryption for network confidentiality, this is insufficient for TrailGuard. 
- **The Problem:** AES-PSK means every node shares the *same* secret key. If a single node is stolen by a bad actor, they can read all traffic and forge messages as any hiker, because there is no per-user identity validation (non-repudiation).
- **The Solution:** TrailGuard uses **Ed25519** public-key cryptography. 
  - Every hiker generates a unique Private/Public Keypair on their phone.
  - The Private Key never leaves the phone's Secure Enclave.
  - The Public Key is broadcast to the network.
  - When a hiker sends a Check-In or SOS, the phone calculates an Ed25519 signature of the payload. The Ranger's Dashboard uses the hiker's Public Key to verify that the message *absolutely* came from that specific hiker.

## 2. Replay Protection (The Firmware Hash Ring)
A classic radio attack is a "Replay Attack": an attacker records a valid SOS transmission from a hiker and rebroadcasts it days later to trigger a false alarm, even though the cryptographic signature is perfectly valid.

To prevent this, the firmware drops duplicate/old messages before they even reach the Dashboard.
- **Timestamping:** Every payload includes a UNIX timestamp. The Dashboard and Firmware reject any payload older than 10 minutes.
- **O(1) Bounded Memory Hash Ring:** The ESP32 firmware has very little RAM. It cannot store a database of every message it has ever seen.
  - The C++ firmware calculates a 64-bit `djb2` hash of `(Hiker_Pubkey + Timestamp)`.
  - It stores this hash in a statically-allocated circular array (Ring Buffer).
  - Before processing a new message, it scans the buffer. If the hash exists, it silently drops the packet as a Replay Attack.
- **Priority Partitioning:** To prevent a malicious actor from flooding the network with low-priority messages (which would overwrite the circular buffer and push out the hashes of valid SOS messages, enabling a replay), the buffer is partitioned:
  - `100` slots reserved strictly for High Priority (SOS, Check-In).
  - `200` slots for Low Priority (TrailMessages).

## 3. Key Provisioning (TOFU vs Manual)
How does the system know which Public Keys belong to which hikers or infrastructure nodes?

1. **Hiker Devices (Trust On First Use - TOFU):**
   - Hikers do not need to register with the Ranger Station in advance.
   - The first time a hiker sends a Check-In, the Dashboard sees an unknown Public Key. 
   - It accepts the key and flags it in the UI as a "New Device". From then on, that Hiker ID is strictly bound to that Public Key.
2. **Infrastructure Nodes (Manual Provisioning):**
   - Ranger Relay Nodes are critical infrastructure. We cannot use TOFU for them.
   - When a Ranger builds a new hardware node, its Public Key is displayed on the OLED screen.
   - The Ranger uses a secure CLI script (`provisioning.py`) on the Dashboard server to manually whitelist the Node's Public Key in the SQLite database before it is deployed into the woods.

## 4. Binary Payload Format
Because LoRa bandwidth is tiny, TrailGuard packs data into dense byte arrays rather than JSON strings.

**Example Payload Structure:**
`[ Signature (64 bytes) | Hiker PubKey (32 bytes) | Timestamp (4 bytes) | Lat (4 bytes) | Lng (4 bytes) | Type (1 byte) ]`
