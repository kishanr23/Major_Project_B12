# TrailGuard: Equipment Analysis & Project Working Description

> **Document Scope:** This document provides a comprehensive analysis of every piece of equipment (hardware, software, communication modules, and peripherals) that was evaluated during the design and development of the TrailGuard Off-Grid Safety & Tracking System. For each item, we include a technical description, the rationale for consideration, and a clear **Suitability Verdict** indicating whether it was selected, rejected, or deferred for our project. The second half of this document covers the end-to-end working description of the project.

---

## Table of Contents

1. [Project Context & Objectives](#1-project-context--objectives)
2. [Hardware Equipment Analysis](#2-hardware-equipment-analysis)
   - 2.1 [Microcontroller Boards (MCU)](#21-microcontroller-boards-mcu)
   - 2.2 [LoRa Transceiver Modules](#22-lora-transceiver-modules)
   - 2.3 [GPS Modules](#23-gps-modules)
   - 2.4 [Display Modules](#24-display-modules)
   - 2.5 [Power Supply & Energy Harvesting](#25-power-supply--energy-harvesting)
   - 2.6 [Gateway / Command Center Hardware](#26-gateway--command-center-hardware)
   - 2.7 [Antennas](#27-antennas)
   - 2.8 [Enclosures & Weatherproofing](#28-enclosures--weatherproofing)
3. [Communication Equipment & Protocols](#3-communication-equipment--protocols)
   - 3.1 [LoRa (Long Range) Radio](#31-lora-long-range-radio)
   - 3.2 [Bluetooth Low Energy (BLE)](#32-bluetooth-low-energy-ble)
   - 3.3 [WiFi Module](#33-wifi-module)
   - 3.4 [Satellite Communicators (Evaluated & Rejected)](#34-satellite-communicators-evaluated--rejected)
   - 3.5 [Cellular Modems (Evaluated & Rejected)](#35-cellular-modems-evaluated--rejected)
4. [Software Equipment & Libraries](#4-software-equipment--libraries)
   - 4.1 [Firmware Stack](#41-firmware-stack)
   - 4.2 [Mobile Application Stack](#42-mobile-application-stack)
   - 4.3 [Dashboard & Backend Stack](#43-dashboard--backend-stack)
   - 4.4 [Cryptography Libraries](#44-cryptography-libraries)
5. [Equipment Suitability Summary Table](#5-equipment-suitability-summary-table)
6. [Complete Working Description of the Project](#6-complete-working-description-of-the-project)
   - 6.1 [System Architecture Overview](#61-system-architecture-overview)
   - 6.2 [Level 1 — The Edge / Client (Mobile App)](#62-level-1--the-edge--client-mobile-app)
   - 6.3 [Level 2 — The Transport Mesh (Hardware Nodes)](#63-level-2--the-transport-mesh-hardware-nodes)
   - 6.4 [Level 3 — The Command Center (Dashboard)](#64-level-3--the-command-center-dashboard)
   - 6.5 [End-to-End Data Flow](#65-end-to-end-data-flow)
   - 6.6 [Security Architecture](#66-security-architecture)
   - 6.7 [Demo / WiFi Simulator Mode](#67-demo--wifi-simulator-mode)

---

## 1. Project Context & Objectives

**TrailGuard** is an off-grid safety, tracking, and communication system designed for hikers, park rangers, and outdoor enthusiasts operating in environments with **zero cellular or internet connectivity**.

### Core Objectives
| # | Objective | Description |
|---|-----------|-------------|
| 1 | **Life Safety** | Enable hikers to broadcast SOS signals and check-in from deep wilderness with no cell coverage. |
| 2 | **Real-Time Tracking** | Allow Rangers to monitor hiker positions on a live map from a centralized Dashboard. |
| 3 | **Decentralized Communication** | Build a self-healing LoRa mesh network where messages hop from node to node across mountains. |
| 4 | **Zero-Trust Security** | Prevent spoofing, replay attacks, and message forgery using per-user Ed25519 cryptographic signatures. |
| 5 | **Fully Offline Operation** | The mobile app must function with pre-downloaded maps and no internet dependency. |
| 6 | **Low Cost & Open Source** | Avoid expensive satellite subscriptions; use open-source Meshtastic protocol on affordable hardware. |

### Key Design Constraints
- **Extremely Low Bandwidth:** LoRa operates at < 1 kbps; payloads must be compact binary (not JSON/XML).
- **Limited MCU Resources:** ESP32 nodes have ~320 KB SRAM; all algorithms must be O(1) bounded memory.
- **Open Radio Frequencies:** Anyone can listen on 915 MHz ISM band; encryption alone is insufficient — non-repudiation is required.
- **Rugged Deployment:** Nodes are deployed outdoors on trees, peaks, and remote ranger stations for months.

---

## 2. Hardware Equipment Analysis

### 2.1 Microcontroller Boards (MCU)

#### 2.1.1 Heltec WiFi LoRa 32 (V2)

| Attribute | Detail |
|-----------|--------|
| **Chipset** | ESP32 (Dual-core Xtensa LX6, 240 MHz) |
| **LoRa Transceiver** | Semtech SX1276 (integrated on-board) |
| **Frequency** | 868 MHz / 915 MHz (ISM band, region-configurable) |
| **WiFi** | 802.11 b/g/n (2.4 GHz) |
| **Bluetooth** | BLE 4.2 |
| **Display** | 0.96" OLED (SSD1306, 128×64 pixels) |
| **Flash / PSRAM** | 8 MB Flash / 8 MB PSRAM |
| **GPIO** | 26 programmable pins |
| **Battery Support** | Built-in LiPo charging circuit (JST-PH 2.0) |
| **USB Interface** | Micro-USB (CP2102 USB-UART bridge) |
| **Price Range** | ≈ ₹1,500 – ₹2,500 (US $18–$30) |

**Why Considered:** All-in-one board with ESP32 + LoRa + OLED + BLE + battery management. Perfect for rapid prototyping with Meshtastic compatibility.

> **✅ SUITABLE — SELECTED (Personal & Relay Nodes)**
> This board was selected as the primary hardware platform for TrailGuard's Personal Nodes (carried by hikers) and Relay Nodes (deployed in the forest). The integrated SX1276 LoRa radio, BLE connectivity for phone pairing, and built-in OLED for key provisioning display make it ideal. Meshtastic firmware runs natively on this board.

---

#### 2.1.2 Heltec WiFi LoRa 32 V3

| Attribute | Detail |
|-----------|--------|
| **Chipset** | ESP32-S3 (Dual-core Xtensa LX7, 240 MHz) |
| **LoRa Transceiver** | Semtech SX1262 (improved over SX1276) |
| **Bluetooth** | BLE 5.0 |
| **Display** | 0.96" OLED (SSD1306) |
| **USB Interface** | USB-C (native USB on ESP32-S3) |
| **Battery Support** | Built-in LiPo charging + Solar input |
| **Price Range** | ≈ ₹2,000 – ₹3,000 (US $22–$35) |

**Why Considered:** Newer generation with the superior SX1262 LoRa transceiver (better receive sensitivity, lower power consumption), BLE 5.0 with higher throughput, and USB-C. The ESP32-S3 also has hardware-accelerated cryptographic instructions.

> **✅ SUITABLE — SELECTED (Gateway Node & Future Upgrade)**
> The V3 is selected as the Gateway Node at the Ranger Station (plugged into the command center via USB-C) and as the recommended upgrade path for all nodes. The SX1262's improved sensitivity (+2 dB) extends range in dense forest, and BLE 5.0 improves phone connectivity reliability.

---

#### 2.1.3 TTGO T-Beam (LilyGO)

| Attribute | Detail |
|-----------|--------|
| **Chipset** | ESP32 |
| **LoRa Transceiver** | SX1276 / SX1262 (depending on version) |
| **GPS** | NEO-6M or NEO-M8N (integrated on-board) |
| **Battery** | 18650 LiPo holder (integrated) |
| **Display** | None (optional external OLED) |
| **Price Range** | ≈ ₹2,500 – ₹4,000 (US $30–$45) |

**Why Considered:** Has an integrated GPS module, which would eliminate the need for external GPS breakout boards. The 18650 battery holder provides much longer battery life than LiPo pouches.

> **⚠️ PARTIALLY SUITABLE — DEFERRED**
> While the integrated GPS is attractive, TrailGuard's architecture delegates GPS to the smartphone (which has a far superior multi-constellation GPS receiver). The on-board GPS adds unnecessary cost and power drain. The lack of a built-in OLED also makes key provisioning inconvenient. However, it remains a viable option for dedicated relay nodes that need their own location fix without a paired phone.

---

#### 2.1.4 Arduino Uno / Nano

| Attribute | Detail |
|-----------|--------|
| **Chipset** | ATmega328P (8-bit, 16 MHz) |
| **RAM** | 2 KB SRAM |
| **Flash** | 32 KB |
| **Connectivity** | None (requires external shields) |
| **Price Range** | ≈ ₹400 – ₹800 |

**Why Considered:** Ubiquitous, beginner-friendly, and extremely cheap. Commonly used in academic IoT projects.

> **❌ NOT SUITABLE — REJECTED**
> The Arduino Uno/Nano is fundamentally unsuitable for TrailGuard. Its 2 KB SRAM cannot hold the Ed25519 cryptographic state (TweetNaCl alone requires ~50 KB working memory). It has no built-in Bluetooth or WiFi, and Meshtastic does not support ATmega platforms. The 8-bit architecture is too slow for cryptographic operations.

---

#### 2.1.5 Raspberry Pi Pico (RP2040)

| Attribute | Detail |
|-----------|--------|
| **Chipset** | RP2040 (Dual-core ARM Cortex-M0+, 133 MHz) |
| **RAM** | 264 KB SRAM |
| **Flash** | 2 MB (external) |
| **Connectivity** | None (Pico W variant adds WiFi/BLE) |
| **Price Range** | ≈ ₹400 – ₹900 |

**Why Considered:** Low-cost, dual-core ARM processor with decent memory. MicroPython support could simplify development.

> **❌ NOT SUITABLE — REJECTED**
> Meshtastic has no official support for RP2040. No integrated LoRa transceiver means additional wiring and complexity. The MicroPython ecosystem lacks mature LoRa mesh libraries. The ESP32's established Meshtastic ecosystem is far more reliable for our use case.

---

#### 2.1.6 STM32 (Blue Pill / Nucleo)

| Attribute | Detail |
|-----------|--------|
| **Chipset** | STM32F103 / STM32L4xx (ARM Cortex-M3/M4) |
| **RAM** | 20–256 KB |
| **Connectivity** | None (requires external modules) |
| **Price Range** | ≈ ₹300 – ₹1,500 |

**Why Considered:** Industry-grade ARM microcontrollers with ultra-low power modes. Popular in commercial IoT products.

> **❌ NOT SUITABLE — REJECTED**
> While STM32 chips are technically capable, they require external LoRa modules, BLE modules, and custom board design. Meshtastic has experimental nRF52 support but no STM32 port. The development time to build a custom mesh stack from scratch would be prohibitive compared to using the proven Meshtastic + ESP32 ecosystem.

---

### 2.2 LoRa Transceiver Modules

#### 2.2.1 Semtech SX1276

| Attribute | Detail |
|-----------|--------|
| **Frequency Range** | 137–1020 MHz |
| **Modulation** | LoRa (CSS) + FSK/OOK |
| **Sensitivity** | –148 dBm |
| **TX Power** | +20 dBm |
| **Interface** | SPI |
| **Spreading Factors** | SF6–SF12 |

**Why Considered:** Widely used in Heltec V2 boards. Proven reliability with Meshtastic.

> **✅ SUITABLE — SELECTED (via Heltec V2 boards)**
> Integrated into the Heltec WiFi LoRa 32 V2. Provides excellent range (10–15 km line-of-sight) at the 915 MHz ISM band. Sufficient for our mesh topology.

---

#### 2.2.2 Semtech SX1262

| Attribute | Detail |
|-----------|--------|
| **Frequency Range** | 150–960 MHz |
| **Sensitivity** | –148 dBm (improved RX chain) |
| **TX Power** | +22 dBm |
| **Power Consumption** | 4.2 mA RX (vs. 10.3 mA on SX1276) |
| **Interface** | SPI |

**Why Considered:** Next-generation LoRa transceiver with 60% lower RX power consumption and +2 dBm higher transmit power.

> **✅ SUITABLE — SELECTED (via Heltec V3 boards)**
> Integrated into the Heltec V3 and used in the Raspberry Pi LoRa HAT for the production RadioHatTransport gateway. Superior for relay nodes that must operate for months on solar power.

---

#### 2.2.3 RFM95W (HopeRF)

| Attribute | Detail |
|-----------|--------|
| **Chipset** | Based on SX1276 |
| **Form Factor** | Standalone module (requires breadboard wiring) |
| **Price Range** | ≈ ₹400 – ₹700 |

**Why Considered:** Cheapest way to add LoRa capability to any microcontroller.

> **⚠️ PARTIALLY SUITABLE — NOT SELECTED**
> Technically functional, but requires manual SPI wiring, antenna impedance matching, and custom PCB design. The all-in-one Heltec boards eliminate this complexity entirely. Could be useful for a custom-designed PCB in a future mass-production scenario.

---

### 2.3 GPS Modules

#### 2.3.1 Smartphone GPS (Primary)

| Attribute | Detail |
|-----------|--------|
| **Receiver** | Multi-constellation (GPS + GLONASS + Galileo + BeiDou) |
| **Accuracy** | 3–5 meters (with SBAS) |
| **TTFF** | < 2 seconds (hot start) |
| **Power Source** | Phone battery |
| **Cost** | ₹0 (already in the hiker's pocket) |

**Why Considered:** Every modern smartphone has a high-quality GNSS receiver that is far superior to any low-cost external module.

> **✅ SUITABLE — SELECTED (Primary GPS source)**
> TrailGuard's architecture delegates GPS entirely to the smartphone. The React Native app reads `expo-location` coordinates, packages them into the signed payload, and sends them over BLE. This avoids adding GPS cost and power drain to the hardware nodes.

---

#### 2.3.2 u-blox NEO-6M

| Attribute | Detail |
|-----------|--------|
| **Constellation** | GPS only |
| **Accuracy** | 2.5 m CEP |
| **Interface** | UART (9600 baud NMEA) |
| **Power** | ~67 mA active |
| **Price Range** | ≈ ₹300 – ₹600 |

**Why Considered:** Most common GPS module in hobby electronics. Included on TTGO T-Beam boards.

> **⚠️ PARTIALLY SUITABLE — DEFERRED**
> Not needed when a smartphone is paired (our primary use case). Could be useful for dedicated relay nodes or tracker-only devices that operate without a phone. GPS-only (no GLONASS/Galileo) limits accuracy under dense canopy.

---

#### 2.3.3 u-blox NEO-M8N

| Attribute | Detail |
|-----------|--------|
| **Constellation** | GPS + GLONASS (concurrent) |
| **Accuracy** | 2.0 m CEP |
| **Interface** | UART / I2C |
| **Power** | ~23 mA (continuous mode) |
| **Price Range** | ≈ ₹800 – ₹1,500 |

**Why Considered:** Multi-constellation support for better fix under tree cover. Lower power than NEO-6M.

> **⚠️ PARTIALLY SUITABLE — DEFERRED**
> Same rationale as NEO-6M. A strong candidate if we ever build standalone tracker tags that operate without a smartphone.

---

### 2.4 Display Modules

#### 2.4.1 SSD1306 OLED (0.96", 128×64, I2C)

| Attribute | Detail |
|-----------|--------|
| **Type** | Monochrome OLED |
| **Resolution** | 128 × 64 pixels |
| **Interface** | I2C (0x3C address) |
| **Power** | ~20 mA active |
| **Price Range** | ≈ ₹150 – ₹350 |

**Why Considered:** Integrated on all Heltec boards. Essential for displaying the node's Public Key during provisioning and showing basic status (battery, connectivity).

> **✅ SUITABLE — SELECTED**
> Built into the Heltec V2 and V3. Used to display the Ed25519 public key as a hex string during node provisioning, and to show battery level, mesh connectivity status, and message queue depth.

---

#### 2.4.2 TFT LCD (1.8" / 2.4" SPI)

| Attribute | Detail |
|-----------|--------|
| **Type** | Color TFT LCD |
| **Resolution** | 128×160 or 240×320 pixels |
| **Interface** | SPI |
| **Power** | ~40–80 mA (with backlight) |
| **Price Range** | ≈ ₹300 – ₹800 |

**Why Considered:** Could display richer information such as small map snippets or color-coded status.

> **❌ NOT SUITABLE — REJECTED**
> Excessive power consumption would halve battery life on personal nodes. The additional SPI bus traffic conflicts with the LoRa transceiver (both use SPI). A monochrome OLED is sufficient for our status display needs — rich visual UI is handled by the smartphone app.

---

### 2.5 Power Supply & Energy Harvesting

#### 2.5.1 LiPo Battery (3.7V, 1000–3000 mAh)

| Attribute | Detail |
|-----------|--------|
| **Voltage** | 3.7V nominal (4.2V fully charged) |
| **Capacity** | 1000–3000 mAh (varies by size) |
| **Form Factor** | Flat pouch cell with JST-PH 2.0 connector |
| **Discharge Rate** | 1C standard |
| **Price Range** | ≈ ₹200 – ₹600 |

**Why Considered:** Direct compatibility with Heltec boards' built-in charging circuits. Lightweight and compact.

> **✅ SUITABLE — SELECTED (Personal Nodes)**
> A 1000 mAh LiPo provides approximately 18–24 hours of operation on a Heltec V2 with adaptive sleep enabled (firmware telemetry-based sleep logic). Hikers can recharge overnight via USB. The built-in TP4054 charging IC on the Heltec handles safe LiPo management.

---

#### 2.5.2 18650 Li-ion Cell (3.7V, 2600–3500 mAh)

| Attribute | Detail |
|-----------|--------|
| **Voltage** | 3.7V nominal |
| **Capacity** | 2600–3500 mAh |
| **Form Factor** | 18mm × 65mm cylindrical |
| **Discharge Cycles** | 500–1000 cycles |
| **Price Range** | ≈ ₹200 – ₹500 per cell |

**Why Considered:** Higher capacity than pouch LiPo cells. Used in TTGO T-Beam boards. Widely available and replaceable.

> **✅ SUITABLE — SELECTED (Relay Nodes)**
> 18650 cells paired with solar panels (see below) provide extended runtime for relay nodes deployed in the forest for weeks or months. A single 3500 mAh cell can power a relay node for 3–5 days without solar.

---

#### 2.5.3 Solar Panel (5V/6V, 1–3W Mini Panel)

| Attribute | Detail |
|-----------|--------|
| **Output** | 5V–6V, 200–600 mA |
| **Size** | 110mm × 70mm (typical small panel) |
| **Weather Rating** | IP65 (with proper enclosure) |
| **Price Range** | ≈ ₹200 – ₹500 |

**Why Considered:** Relay nodes deployed on trees and peaks need autonomous power for weeks. Solar is the only viable option in remote wilderness.

> **✅ SUITABLE — SELECTED (Relay Nodes)**
> A 1W solar panel combined with an 18650 cell and the Heltec's TP4054 charge controller provides indefinite operation for relay nodes in areas with ≥ 4 hours of sunlight. The firmware's adaptive sleep logic (implemented in `TrailGuardModule`) reduces power consumption when solar input drops below a threshold (monitored via `updateTelemetry(battery_pct, solar_mw)`).

---

#### 2.5.4 USB Power Bank (5V, 10000+ mAh)

| Attribute | Detail |
|-----------|--------|
| **Output** | 5V / 2A (USB-A or USB-C) |
| **Capacity** | 10000–20000 mAh |
| **Price Range** | ≈ ₹500 – ₹1,500 |

**Why Considered:** Hikers commonly carry power banks for phone charging. Could double as node power source.

> **⚠️ PARTIALLY SUITABLE — OPTIONAL ACCESSORY**
> Works as a backup power source for personal nodes, but many power banks have auto-shutoff circuits that disconnect low-current devices like ESP32s. Hikers who already carry one can use it, but the built-in LiPo is the primary design.

---

### 2.6 Gateway / Command Center Hardware

#### 2.6.1 Raspberry Pi Zero 2 W

| Attribute | Detail |
|-----------|--------|
| **Chipset** | BCM2710A1 (Quad-core ARM Cortex-A53, 1 GHz) |
| **RAM** | 512 MB |
| **Connectivity** | WiFi 802.11n, Bluetooth 4.2 / BLE |
| **GPIO** | 40-pin header (SPI, I2C, UART) |
| **Storage** | MicroSD card |
| **Power** | 5V / 300 mA (idle) |
| **Price Range** | ≈ ₹1,500 – ₹2,500 |

**Why Considered:** Small, low-power single-board computer. Can run Python/Flask dashboard directly and connect to the LoRa HAT via SPI GPIO.

> **✅ SUITABLE — SELECTED (Production Gateway)**
> The production `RadioHatTransport` gateway architecture uses a Raspberry Pi Zero 2 W with an SX1262 LoRa HAT connected via the 40-pin GPIO header. It runs the Python Flask dashboard and SQLite database locally. Extremely low power consumption (< 2W) makes it viable for ranger stations with limited electrical infrastructure.

---

#### 2.6.2 Raspberry Pi 4 Model B

| Attribute | Detail |
|-----------|--------|
| **Chipset** | BCM2711 (Quad-core ARM Cortex-A72, 1.5 GHz) |
| **RAM** | 2 GB / 4 GB / 8 GB options |
| **Connectivity** | Dual-band WiFi, Bluetooth 5.0, Gigabit Ethernet |
| **USB** | 2× USB 3.0, 2× USB 2.0 |
| **Price Range** | ≈ ₹3,500 – ₹6,000 |

**Why Considered:** More powerful alternative with USB 3.0 ports for connecting Gateway nodes via Serial/USB.

> **⚠️ PARTIALLY SUITABLE — ALTERNATIVE**
> Overkill for a lightweight Flask + SQLite dashboard. Higher power consumption (5W idle) is problematic for off-grid ranger stations. However, suitable for permanent ranger stations with reliable AC power, especially when running multiple dashboard instances or additional monitoring software.

---

#### 2.6.3 Laptop / Desktop Computer

| Attribute | Detail |
|-----------|--------|
| **Role** | Development, testing, and fallback gateway |
| **Connectivity** | USB (for Heltec Gateway node connection) |

**Why Considered:** For development and the `SerialTransport` fallback mode — a laptop connected to a Heltec node via USB, using the `meshtastic` Python library over serial.

> **✅ SUITABLE — SELECTED (Development & Fallback)**
> The `SerialTransport` adapter uses a laptop + USB-connected Heltec node for development and testing. The dashboard Flask server and SQLite database run locally on the laptop. This is the default development setup.

---

#### 2.6.4 SX1262 LoRa HAT (for Raspberry Pi)

| Attribute | Detail |
|-----------|--------|
| **Transceiver** | Semtech SX1262 |
| **Interface** | SPI via Raspberry Pi GPIO header |
| **Frequency** | 868 / 915 MHz |
| **TX Power** | +22 dBm |
| **Price Range** | ≈ ₹1,000 – ₹2,000 |

**Why Considered:** Converts a Raspberry Pi into a full mesh-participating LoRa gateway without needing a separate Heltec board.

> **✅ SUITABLE — SELECTED (Production Gateway)**
> Paired with the Raspberry Pi Zero 2 W to create the `RadioHatTransport` gateway. The HAT connects directly to the Pi's SPI bus, eliminating the USB serial bottleneck and allowing the gateway to actively participate in the mesh as a first-class node.

---

### 2.7 Antennas

#### 2.7.1 Spring / Helical Antenna (Built-in, ~2 dBi)

| Attribute | Detail |
|-----------|--------|
| **Type** | Helical monopole (PCB-mounted) |
| **Gain** | ~2 dBi |
| **Polarization** | Vertical |

**Why Considered:** Comes pre-soldered on Heltec boards. Zero additional cost.

> **✅ SUITABLE — SELECTED (Personal Nodes)**
> Adequate for personal nodes carried by hikers. Low profile, no risk of breakage during hiking.

---

#### 2.7.2 External Whip Antenna (5–6 dBi, SMA)

| Attribute | Detail |
|-----------|--------|
| **Type** | Quarter-wave whip with ground plane |
| **Gain** | 5–6 dBi |
| **Connector** | SMA or RP-SMA |
| **Length** | ~17 cm (for 915 MHz) |
| **Price Range** | ≈ ₹150 – ₹400 |

**Why Considered:** Higher gain for relay nodes and the gateway. Improves range by 2–3× over the built-in antenna.

> **✅ SUITABLE — SELECTED (Relay & Gateway Nodes)**
> Relay nodes deployed on tree trunks or towers use external whip antennas connected via the Heltec's U.FL/IPEX connector (with a U.FL-to-SMA pigtail). This significantly extends the inter-node range from ~5 km to ~10–15 km line-of-sight.

---

#### 2.7.3 Yagi / Directional Antenna (10–15 dBi)

| Attribute | Detail |
|-----------|--------|
| **Type** | Yagi-Uda directional |
| **Gain** | 10–15 dBi |
| **Beamwidth** | ~30° (narrow) |
| **Price Range** | ≈ ₹1,000 – ₹3,000 |

**Why Considered:** Very high gain for point-to-point links between the gateway and distant relay nodes.

> **❌ NOT SUITABLE — REJECTED**
> Yagi antennas require precise aiming and are unsuitable for a mesh network where signals arrive from multiple directions. The narrow beamwidth would miss packets from nodes not in the antenna's line of bearing. Omnidirectional antennas are essential for mesh topology.

---

### 2.8 Enclosures & Weatherproofing

#### 2.8.1 IP65/IP67 ABS Junction Box

| Attribute | Detail |
|-----------|--------|
| **Material** | ABS Plastic |
| **Rating** | IP65 (dust-tight, water-jet resistant) or IP67 (submersible) |
| **Size** | 100mm × 68mm × 50mm (typical) |
| **Price Range** | ≈ ₹150 – ₹400 |

**Why Considered:** Relay nodes deployed outdoors need protection from rain, dust, and insects.

> **✅ SUITABLE — SELECTED (Relay Nodes)**
> IP65-rated ABS boxes house the Heltec board, 18650 battery, and solar charge controller. Cable glands provide sealed entry for the antenna pigtail and solar panel wires.

---

#### 2.8.2 3D-Printed Custom Enclosure (PLA/PETG)

| Attribute | Detail |
|-----------|--------|
| **Material** | PLA or PETG filament |
| **Customization** | Exact fit for Heltec board + battery |
| **Weather Resistance** | Low (PLA) to Moderate (PETG with sealant) |
| **Cost** | ≈ ₹50 – ₹200 (material cost) |

**Why Considered:** Custom-fit enclosures for personal nodes with openings for the OLED display and USB port.

> **⚠️ PARTIALLY SUITABLE — OPTIONAL**
> Suitable for personal nodes used in mild weather. PETG with conformal coating provides reasonable water resistance. Not recommended for relay nodes exposed to prolonged outdoor conditions.

---

## 3. Communication Equipment & Protocols

### 3.1 LoRa (Long Range) Radio

| Attribute | Detail |
|-----------|--------|
| **Protocol** | LoRa (Chirp Spread Spectrum modulation) |
| **Mesh Layer** | Meshtastic (open-source) |
| **Frequency** | 915 MHz (US ISM) / 868 MHz (EU ISM) |
| **Range** | 5–15 km (line-of-sight), 1–5 km (dense forest) |
| **Bandwidth** | < 1 kbps effective throughput |
| **License** | Unlicensed ISM band |

> **✅ SUITABLE — SELECTED (Primary Communication)**
> LoRa with Meshtastic is the backbone of TrailGuard. It provides free, long-range, low-power communication without any subscription fees. The Meshtastic mesh routing algorithm handles packet relaying, collision avoidance (CSMA), and multi-hop delivery.

---

### 3.2 Bluetooth Low Energy (BLE)

| Attribute | Detail |
|-----------|--------|
| **Version** | BLE 4.2 (Heltec V2) / BLE 5.0 (Heltec V3) |
| **Range** | ~10–30 meters |
| **Throughput** | ~1 Mbps (BLE 5.0) |
| **Power** | < 10 mA active |
| **Library** | `react-native-ble-plx` (mobile app) |

> **✅ SUITABLE — SELECTED (App-to-Node Link)**
> BLE connects the hiker's smartphone to their personal LoRa node. The mobile app writes signed binary payloads to a specific BLE Characteristic on the Heltec node, which then broadcasts the message over LoRa. BLE's low power consumption is critical for preserving the node's battery.

---

### 3.3 WiFi Module (ESP32 Built-in)

| Attribute | Detail |
|-----------|--------|
| **Standard** | 802.11 b/g/n (2.4 GHz) |
| **Mode** | Station / AP / Soft-AP |
| **Use in TrailGuard** | WiFi Simulator (Demo Mode) only |

> **⚠️ PARTIALLY SUITABLE — SELECTED (Demo Mode Only)**
> WiFi is not used in production. It is exclusively used for the WiFi Simulator mode, where the mobile app bypasses BLE + LoRa and sends signed payloads directly to the Flask backend over HTTP (local LAN). This allows developers to demonstrate and test the full cryptographic and UI workflow without physical hardware.

---

### 3.4 Satellite Communicators (Evaluated & Rejected)

#### Examples: Garmin inReach, SPOT Gen4, Iridium RockBLOCK

| Attribute | Detail |
|-----------|--------|
| **Range** | Global (via satellite) |
| **Subscription** | ₹2,000 – ₹5,000/month |
| **Message Cost** | ₹5 – ₹50 per message |
| **Latency** | 30–90 seconds |

**Why Considered:** Satellite provides truly global coverage. Some parks may be too large for a LoRa mesh to cover.

> **❌ NOT SUITABLE — REJECTED**
> Prohibitively expensive recurring costs violate our "free-to-use" design objective. Monthly subscriptions and per-message fees are unacceptable for budget-constrained park services. The 30–90 second latency also degrades the real-time SOS experience. LoRa mesh is free, low-latency, and self-deployable.

---

### 3.5 Cellular Modems (Evaluated & Rejected)

#### Examples: SIM800L (2G), SIM7000 (4G LTE-M/NB-IoT)

| Attribute | Detail |
|-----------|--------|
| **Requirement** | Cell tower coverage + SIM card with data plan |
| **Power** | High (200–2000 mA during transmission) |
| **Cost** | Module ≈ ₹400–₹1,500 + SIM subscription |

**Why Considered:** Could provide an internet uplink from the gateway to a cloud-hosted dashboard.

> **❌ NOT SUITABLE — REJECTED**
> The fundamental premise of TrailGuard is operation in areas with **zero cellular coverage**. Additionally, the Command Center dashboard is designed to run locally (Python/Flask + SQLite) without any cloud dependency. Cellular modems are useless in our target environment.

---

## 4. Software Equipment & Libraries

### 4.1 Firmware Stack

| Component | Choice | Suitability |
|-----------|--------|-------------|
| **Build System** | PlatformIO (ESP-IDF / Arduino Core) | ✅ Selected |
| **Mesh Protocol** | Meshtastic (open-source) | ✅ Selected |
| **Language** | C++ (with C standard libs for size) | ✅ Selected |
| **Crypto Library** | TweetNaCl (C, Ed25519) | ✅ Selected |
| **Alt Crypto (Evaluated)** | micro-ecc (ECDSA/ECDH only) | ❌ Rejected — No Ed25519 support |
| **Alt Crypto (Evaluated)** | libsodium (full NaCl) | ❌ Rejected — Too large for ESP32 Flash (~500 KB) |
| **Hash Algorithm** | djb2-64 (custom implementation) | ✅ Selected |
| **Protocol Buffers** | Meshtastic protobuf (nanopb) | ✅ Selected |

### 4.2 Mobile Application Stack

| Component | Choice | Suitability |
|-----------|--------|-------------|
| **Framework** | React Native + Expo (EAS Build) | ✅ Selected |
| **Offline Maps** | `react-native-maplibre-gl` + MBTiles | ✅ Selected |
| **Cryptography** | `react-native-quick-crypto` (JSI, Ed25519) | ✅ Selected |
| **Secure Storage** | `react-native-keychain` (Secure Enclave) | ✅ Selected |
| **BLE Connectivity** | `react-native-ble-plx` | ✅ Selected |
| **Location Services** | `expo-location` | ✅ Selected |
| **State Persistence** | `AsyncStorage` | ✅ Selected |
| **Alt Map (Evaluated)** | `react-native-maps` (Google Maps) | ❌ Rejected — Requires internet |
| **Alt Framework (Evaluated)** | Flutter | ❌ Rejected — Weaker BLE/crypto ecosystem for our needs |

### 4.3 Dashboard & Backend Stack

| Component | Choice | Suitability |
|-----------|--------|-------------|
| **Backend Framework** | Python 3 + Flask | ✅ Selected |
| **Database** | SQLite3 (file-based, serverless) | ✅ Selected |
| **Frontend** | Vanilla HTML/CSS/JS + Jinja2 | ✅ Selected |
| **Map Library** | Leaflet.js + OpenStreetMap tiles | ✅ Selected |
| **Hardware Bridge** | `meshtastic` Python library (USB Serial) | ✅ Selected |
| **Real-time Updates** | JavaScript `fetch()` polling (5-second interval) | ✅ Selected |
| **Alt DB (Evaluated)** | PostgreSQL | ❌ Rejected — Requires daemon; overkill for local use |
| **Alt DB (Evaluated)** | MongoDB | ❌ Rejected — Heavy; not suitable for embedded deployment |
| **Alt Real-time (Evaluated)** | WebSockets (Socket.IO) | ⚠️ Deferred — Added complexity; polling is sufficient for < 100 hikers |

### 4.4 Cryptography Libraries (Cross-Platform Comparison)

| Layer | Library | Algorithm | Why Selected |
|-------|---------|-----------|-------------|
| **Firmware (C++)** | TweetNaCl | Ed25519 sign/verify | Tiny footprint (~20 KB), runs on ESP32, implements full NaCl Ed25519 |
| **Mobile App (React Native)** | `react-native-quick-crypto` | Ed25519 sign | JSI binding to C++ (no JS bridge overhead), hardware-accelerated on modern phones |
| **Dashboard (Python)** | PyNaCl (`nacl.signing`) | Ed25519 verify | Pure Python bindings to libsodium, fast verification for gateway ingest |

> All three implementations produce identical Ed25519 signatures and have been verified via cross-language test vectors (`test_vectors/hash_vectors.json` — 7/7 PASS across JS, Python, and C++).

---

## 5. Equipment Suitability Summary Table

| # | Equipment | Category | Verdict | Reason |
|---|-----------|----------|---------|--------|
| 1 | Heltec WiFi LoRa 32 V2 | MCU Board | ✅ Selected | All-in-one ESP32 + SX1276 + OLED + BLE |
| 2 | Heltec WiFi LoRa 32 V3 | MCU Board | ✅ Selected | Upgraded SX1262, BLE 5.0, USB-C; used for Gateway |
| 3 | TTGO T-Beam | MCU Board | ⚠️ Deferred | Integrated GPS (unnecessary); no OLED |
| 4 | Arduino Uno/Nano | MCU Board | ❌ Rejected | 2 KB RAM; cannot run Ed25519 or Meshtastic |
| 5 | Raspberry Pi Pico | MCU Board | ❌ Rejected | No Meshtastic support; no LoRa |
| 6 | STM32 Blue Pill | MCU Board | ❌ Rejected | No Meshtastic port; requires external modules |
| 7 | Semtech SX1276 | LoRa Transceiver | ✅ Selected | Integrated in Heltec V2 |
| 8 | Semtech SX1262 | LoRa Transceiver | ✅ Selected | Integrated in Heltec V3 and LoRa HAT |
| 9 | RFM95W (HopeRF) | LoRa Module | ⚠️ Not Selected | Requires manual wiring; Heltec is simpler |
| 10 | Smartphone GPS | GPS | ✅ Selected | Superior accuracy; zero added cost |
| 11 | u-blox NEO-6M | GPS Module | ⚠️ Deferred | Standalone nodes only |
| 12 | u-blox NEO-M8N | GPS Module | ⚠️ Deferred | Standalone nodes only |
| 13 | SSD1306 OLED | Display | ✅ Selected | Built into Heltec; key provisioning display |
| 14 | TFT LCD | Display | ❌ Rejected | High power; SPI conflict with LoRa |
| 15 | LiPo Battery (3.7V) | Power | ✅ Selected | Personal nodes; Heltec charging circuit |
| 16 | 18650 Li-ion Cell | Power | ✅ Selected | Relay nodes; higher capacity |
| 17 | Solar Panel (1–3W) | Power | ✅ Selected | Relay nodes; indefinite operation |
| 18 | USB Power Bank | Power | ⚠️ Optional | Auto-shutoff issues with low-current devices |
| 19 | Raspberry Pi Zero 2 W | Gateway | ✅ Selected | Production RadioHatTransport gateway |
| 20 | Raspberry Pi 4 | Gateway | ⚠️ Alternative | Overkill; higher power consumption |
| 21 | Laptop/Desktop | Gateway | ✅ Selected | Development + SerialTransport fallback |
| 22 | SX1262 LoRa HAT | Gateway | ✅ Selected | Paired with Pi Zero 2 W for production |
| 23 | Spring/Helical Antenna | Antenna | ✅ Selected | Personal nodes; built-in |
| 24 | External Whip (5–6 dBi) | Antenna | ✅ Selected | Relay & Gateway nodes; extended range |
| 25 | Yagi Directional Antenna | Antenna | ❌ Rejected | Narrow beam; incompatible with mesh |
| 26 | IP65 ABS Junction Box | Enclosure | ✅ Selected | Relay nodes; weather protection |
| 27 | 3D-Printed Enclosure | Enclosure | ⚠️ Optional | Personal nodes; mild weather only |
| 28 | LoRa (Meshtastic) | Communication | ✅ Selected | Primary backbone; free, long-range mesh |
| 29 | BLE 4.2 / 5.0 | Communication | ✅ Selected | Phone-to-Node link |
| 30 | WiFi (ESP32) | Communication | ⚠️ Demo Only | WiFi Simulator for testing |
| 31 | Satellite Communicator | Communication | ❌ Rejected | Expensive subscriptions; high latency |
| 32 | Cellular Modem | Communication | ❌ Rejected | No coverage in target environment |
| 33 | TweetNaCl | Crypto (Firmware) | ✅ Selected | Ed25519 on ESP32; tiny footprint |
| 34 | react-native-quick-crypto | Crypto (Mobile) | ✅ Selected | JSI Ed25519; hardware-accelerated |
| 35 | PyNaCl | Crypto (Dashboard) | ✅ Selected | Python Ed25519 verify; libsodium bindings |
| 36 | micro-ecc | Crypto (Firmware) | ❌ Rejected | ECDSA only; no Ed25519 |
| 37 | libsodium (full) | Crypto (Firmware) | ❌ Rejected | Too large for ESP32 flash |

---

## 6. Complete Working Description of the Project

### 6.1 System Architecture Overview

TrailGuard operates across three distinct architectural levels:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LEVEL 1: THE EDGE / CLIENT                       │
│                         (Hiker's Smartphone)                            │
│  ┌──────────────┐   ┌─────────────┐   ┌─────────────────────────────┐  │
│  │  Offline Map  │   │  Ed25519     │   │  BLE Client                 │  │
│  │  (MapLibre +  │   │  Key Pair    │   │  (react-native-ble-plx)     │  │
│  │   MBTiles)    │   │  Generation  │   │  Writes to BLE Char.        │  │
│  └──────────────┘   └─────────────┘   └──────────┬──────────────────┘  │
└──────────────────────────────────────────────────┼──────────────────────┘
                                        BLE (Bluetooth Low Energy)
┌──────────────────────────────────────────────────┼──────────────────────┐
│                     LEVEL 2: THE TRANSPORT MESH                         │
│                      (LoRa Hardware Nodes)                              │
│  ┌──────────────┐   ┌─────────────┐   ┌──────────┴──────────────────┐  │
│  │ Personal Node │──▶│ Relay Node  │──▶│ Relay Node                  │  │
│  │ (Heltec V2)   │   │ (Solar +    │   │ (Solar +                    │  │
│  │ + BLE + LoRa  │   │  18650)     │   │  18650)                     │  │
│  └──────────────┘   └─────────────┘   └──────────┬──────────────────┘  │
│                                          915 MHz LoRa Mesh              │
│                                                  │                      │
│  ┌───────────────────────────────────────────────┴──────────────────┐   │
│  │ Gateway Node (Heltec V3 via USB  — OR —  RPi Zero 2W + LoRa HAT│   │
│  └───────────────────────────────────────────────┬─────────────────┘   │
└──────────────────────────────────────────────────┼─────────────────────┘
                                         USB Serial / SPI GPIO
┌──────────────────────────────────────────────────┼─────────────────────┐
│                    LEVEL 3: THE COMMAND CENTER                          │
│                     (Ranger Station)                                    │
│  ┌──────────────┐   ┌─────────────┐   ┌──────────┴──────────────────┐  │
│  │  Flask API    │   │  SQLite DB   │   │  GatewayTransport           │  │
│  │  Backend      │◀─▶│ trailguard   │   │  (Python serial reader)     │  │
│  │  + Jinja2     │   │  .db         │   │                             │  │
│  └──────┬───────┘   └─────────────┘   └─────────────────────────────┘  │
│         │                                                               │
│  ┌──────┴───────────────────────────────────────────────────────────┐   │
│  │  Web Dashboard (HTML/CSS/JS)                                      │  │
│  │  • Live Map (Leaflet + OSM)     • Security Log (SOS Alerts)       │  │
│  │  • Node Status (Battery/Mesh)   • Hiker Management (TOFU)        │  │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Level 1 — The Edge / Client (Mobile App)

**Platform:** React Native (Expo) with EAS Build — cross-platform iOS and Android.

#### Initialization & Setup
1. The hiker downloads the TrailGuard app before leaving for the National Park.
2. On first launch, the app uses `react-native-quick-crypto` to generate a secure **Ed25519 Public/Private keypair**. The Private Key is locked in the phone's hardware **Secure Enclave** (iOS) or **Android Keystore** via `react-native-keychain`.
3. The hiker downloads the **offline vector map** (MBTiles format) for the specific park — rendered by `MapLibre GL Native` without any network tile requests.
4. When they arrive at the trailhead (zero cell service), they power on their personal Heltec LoRa node.
5. The app scans for and connects to the node via **Bluetooth Low Energy (BLE)** using `react-native-ble-plx`.

#### Sending a Check-In
1. The hiker opens the app and taps **"Check In"** (with an optional 140-character message).
2. The app reads the phone's GPS coordinates via `expo-location`.
3. It packages the GPS coordinates, the hiker's Public Key, timestamp, and message type into a **compact binary payload** (≈ 109 bytes).
4. The app signs this payload with the **Private Key**, producing a 64-byte Ed25519 signature.
5. The signed payload is written over BLE to the personal node's BLE Characteristic.
6. The node's firmware verifies the signature. If valid, it enqueues the packet and broadcasts it into the LoRa mesh.

#### Triggering an SOS
1. The hiker presses and holds the red **"SOS"** button for 3 seconds (animated fill bar prevents accidental activation).
2. The same signing process occurs, but the `Type` byte is set to `SOS` (High Priority).
3. The firmware broadcasts with **maximum transmission power** and priority flags, and the mesh routing gives SOS packets absolute priority over all other traffic.

#### Ack (Delivery Confirmation)
1. After sending, the UI shows **"Sent to node"** → **"Relay unconfirmed"**.
2. The dashboard generates a signed `Ack` message (Ed25519 signed by the gateway's keypair).
3. When the Ack reaches the phone via the mesh → BLE path, `AckVerifier.ts` validates the gateway's signature.
4. Only on verified Ack does the UI transition to **"Delivered"**. A 30-second timeout leaves it at "Relay unconfirmed".

---

### 6.3 Level 2 — The Transport Mesh (Hardware Nodes)

**Hardware:** ESP32-based Heltec boards running custom C++ firmware built on top of Meshtastic.

#### Node Types
| Node Type | Hardware | Deployment | Function |
|-----------|----------|------------|----------|
| **Personal Node** | Heltec V2 + LiPo | Carried by hiker (clipped to backpack) | Pairs with phone via BLE; broadcasts signed packets over LoRa |
| **Relay Node** | Heltec V2/V3 + 18650 + Solar + IP65 box | Mounted on trees, towers, peaks | Repeats mesh packets; extends coverage range |
| **Gateway Node** | Heltec V3 (USB) or RPi Zero 2W + LoRa HAT | Ranger Station | Receives mesh traffic; passes to Command Center |

#### Firmware Processing Pipeline
1. **Receive** — A LoRa packet arrives (or BLE payload from paired phone).
2. **Signature Verification** — `crypto.cpp` calls TweetNaCl's `crypto_sign_ed25519_open()` to verify the Ed25519 signature against the sender's public key.
3. **Replay Detection** — The firmware computes a 64-bit `djb2` hash of `(hiker_id:msg_type:timestamp)` and checks it against the partitioned circular buffers:
   - **Critical Buffer:** 100 slots reserved for SOS + CheckIn hashes.
   - **Trail Buffer:** 200 slots for TrailMessage hashes.
   - If the hash exists → **silently drop** (replay attack).
4. **Payload Size Enforcement** — Rejects oversized packets (SOS ≤ 256 bytes, CheckIn ≤ 160 bytes, TrailMessage ≤ 140 bytes).
5. **Priority Queue** — Valid packets are enqueued in a strict priority queue: `SOS > CheckIn > TrailMessage`. An SOS always preempts backlogged trail messages.
6. **Transmission** — The Meshtastic core handles LoRa modulation, CSMA collision avoidance, and multi-hop routing via relay nodes.
7. **Adaptive Sleep** — The firmware monitors battery percentage and solar input via `updateTelemetry()`. When battery < 20% and solar < 50 mW, non-critical transmissions are deferred and the MCU enters deep sleep between message windows.

---

### 6.4 Level 3 — The Command Center (Dashboard)

**Hardware:** Raspberry Pi Zero 2 W (production) or Laptop (development).
**Software:** Python 3 + Flask + SQLite3 + Vanilla HTML/CSS/JS.

#### Gateway Transport
Two transport adapters are available:

1. **RadioHatTransport (Production):** Raspberry Pi Zero 2 W + SX1262 LoRa HAT. The HAT connects via SPI GPIO. The gateway actively participates in the mesh as a first-class node, receiving all routed packets.

2. **SerialTransport (Development/Fallback):** A Heltec node connected to a laptop via USB. The `meshtastic` Python library reads binary packets from the serial port (`/dev/ttyUSB0` on Linux, `COM3` on Windows).

#### Data Ingest & Verification Pipeline
1. The `GatewayTransport` daemon reads the raw binary packet from the LoRa HAT (SPI) or USB serial.
2. It parses the Meshtastic protobuf wrapper and extracts the TrailGuard binary payload.
3. **Signature Verification:** `crypto_utils.py` uses PyNaCl to verify the Ed25519 signature.
4. **Replay Protection:** Computes the dedup key hash and checks the database — rejects packets older than 10 minutes or with duplicate hashes.
5. **TOFU Key Registration:** If the hiker's Public Key is unknown, it is accepted and flagged as "New Device" in the UI. Subsequent messages from this hiker must use the same key.
6. **Database Persistence:** The verified payload is saved to `trailguard.db` (SQLite):
   - `hiker_locations` table — updated with latest GPS coordinates and timestamp.
   - `security_logs` table — SOS events inserted with `escalation_status='ACTIVE'`.
   - `messages` table — all messages logged for audit trail.
7. **Ack Generation:** The backend signs an Ack message with the gateway's Ed25519 keypair and places it in the `/pending_acks` queue for the gateway to relay back through the mesh.

#### Web Dashboard UI
The Ranger views a responsive web interface served by Flask + Jinja2:

- **Live Map (Leaflet.js + OpenStreetMap):** Displays hiker positions as markers. SOS markers turn **red and pulse**. CheckIn markers are **teal**.
- **Security Log:** Tabular view of all SOS events with timestamps, GPS coordinates, and an **"Acknowledge"** / **"Resolve"** action workflow.
- **Node Infrastructure Status:** Battery levels, solar input, and mesh connectivity status for all deployed relay nodes.
- **Hiker Management:** List of known hikers with their Public Keys. "New Device" badges for TOFU-registered hikers.
- **Polling Mechanism:** The dashboard JavaScript runs a `setInterval` loop that calls `fetch('/api/map/data')` every 5 seconds. The Flask backend queries SQLite and returns a lightweight JSON array. DOM manipulation updates markers and alerts dynamically — no page reloads.

---

### 6.5 End-to-End Data Flow

```
Step 1: Hiker → App
   Hiker presses "Check In" or "SOS" on the TrailGuard Mobile App.
   App reads GPS, packages binary payload, signs with Ed25519 Private Key.

Step 2: App → Personal Node (BLE)
   Signed payload is written to the Heltec node's BLE Characteristic.
   Firmware verifies signature, checks for replay, enqueues in priority queue.

Step 3: Personal Node → Mesh (LoRa 915 MHz)
   Node modulates payload via SX1276/SX1262 LoRa transceiver.
   CSMA avoids collisions. Relay nodes repeat the signal across the forest.

Step 4: Mesh → Gateway (USB Serial / SPI)
   Gateway Node receives the LoRa transmission.
   Passes raw bytes via USB serial (Heltec) or SPI GPIO (LoRa HAT) to the
   GatewayTransport Python daemon.

Step 5: Gateway → Backend (Python / SQLite)
   Flask backend verifies Ed25519 signature, checks replay, applies TOFU.
   Saves to trailguard.db. Generates signed Ack.

Step 6: Backend → Dashboard (HTTP / JS Fetch)
   Dashboard JS polls /api/map/data every 5 seconds.
   Flask returns JSON array of hiker positions and active alerts.
   DOM updates markers and security log dynamically.

Step 7: Ack Return Path (Dashboard → Mesh → Phone)
   Signed Ack is relayed back through the mesh to the personal node.
   Node forwards Ack over BLE to the phone.
   App verifies Ack signature; UI transitions to "Delivered".
```

---

### 6.6 Security Architecture

#### Threat Model
TrailGuard operates in a **zero-trust, open-air** environment. Attack vectors include:

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Spoofing** | Attacker forges an SOS from a fake hiker | Ed25519 per-user signatures — Private Key never leaves the phone's Secure Enclave |
| **Replay Attack** | Attacker records a valid SOS and rebroadcasts later | Firmware + Dashboard djb2-64 hash ring with 10-minute acceptance window |
| **Message Tampering** | Attacker modifies GPS coordinates in transit | Ed25519 signature covers the entire payload — any modification invalidates the signature |
| **Node Theft** | Attacker steals a relay node and extracts the PSK | AES-PSK compromise only breaks confidentiality; Ed25519 non-repudiation prevents forging hiker identities |
| **Ack Forgery** | Attacker sends a fake "Delivered" Ack | Ack signatures are verified against the provisioned Gateway public key |
| **Buffer Flooding** | Attacker floods low-priority messages to evict SOS hashes | Circular buffers are partitioned: 100 critical slots + 200 trail slots (independent) |

#### Key Provisioning
- **Hiker Devices:** Trust-On-First-Use (TOFU). The first Check-In from an unknown Public Key is accepted and flagged as "New Device."
- **Infrastructure Nodes:** Manual provisioning via `provisioning.py` CLI — the node's Public Key (displayed on OLED) is whitelisted in the SQLite database before deployment.

---

### 6.7 Demo / WiFi Simulator Mode

For development and demonstration without physical LoRa hardware:

1. The hiker enables **"WiFi Simulator"** in the mobile app's Profile settings.
2. The app constructs the same cryptographically signed binary payload.
3. Instead of BLE → LoRa, the payload is Base64-encoded and sent as an **HTTP POST** to `http://<laptop-ip>:5000/api/demo-ingest`.
4. **Security Check:** The Flask backend strictly requires `FLASK_ENV=development` to accept this simulated data. It is disabled in production to prevent local network spoofing.
5. The Flask backend decodes the Base64 string and processes it through the **identical** ingest pipeline (signature verification, replay protection, TOFU, database persistence).
6. The dashboard updates in real-time, identical to production operation.

This allows the complete cryptographic and UI workflow to be demonstrated on a single laptop with no ESP32 boards required.

---

> **Document Version:** 1.0
> **Last Updated:** September 2026
> **Project:** TrailGuard — Off-Grid Safety & Tracking System
