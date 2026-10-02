# TrailGuard — Heltec LoRa Network Test Plan

This document describes the full two-laptop, four-node test for the TrailGuard
LoRa mesh network. Each laptop has a clearly defined role. Follow your section only.

---

## Physical Topology

```
LAPTOP 2  --USB--  TG1 (SOS Sender)
                        |
                     LoRa hop
                        |
                   Node #2 (power bank)
                        |
                     LoRa hop
                        |
                   Node #3 (power bank)
                        |
                     LoRa hop
                        |
              TG-Relay-A / Base Station  --USB--  LAPTOP 1
```

**Laptop 1** = Base Station machine (the one that pushed this repo)
**Laptop 2** = SOS Sender machine (the one that cloned this repo)

---

## Known Node Inventory (from Laptop 1)

| Node | Long Name | Short Name | Node ID | Role | Location |
|------|-----------|------------|---------|------|----------|
| Base | TG-Relay-A | TGA | !043cfe24 | CLIENT_MUTE | USB -> Laptop 1 / COM4 |
| Sender | Meshtastic fe20 | fe20 | !c72723db | CLIENT | USB -> Laptop 2 |
| Relay 1 | Unknown - needs ID | - | - | CLIENT | Power bank (middle) |
| Relay 2 | Unknown - needs ID | - | - | CLIENT | Power bank (middle) |

> All nodes must use the same LoRa settings:
> Region=IN, Preset=LONG_FAST, HopLimit=3, Channel PSK=AQ== (default)

---

## LoRa Configuration Reference

These are the confirmed settings on the Base Station. All other nodes must match.

```
region        = IN
modemPreset   = LONG_FAST
bandwidth     = 250
spreadFactor  = 11
codingRate    = 5
hopLimit      = 3
txPower       = 30
channel PSK   = AQ== (default)
```

---

# LAPTOP 1 - Base Station Instructions

**You are RECEIVING. Do not send anything.**

### Prerequisites
```
pip install meshtastic
```

### Step 1 - Confirm base node is connected
```
python -c "import serial.tools.list_ports; [print(p.device, '|', p.description) for p in serial.tools.list_ports.comports()]"
```
Look for Silicon Labs CP210x. That is the base node (should be COM4).

### Step 2 - Verify base node identity
```
python -m meshtastic --port COM4 --info
```
Expected: Owner=TG-Relay-A, role=CLIENT_MUTE, region=IN

### Step 3 - Start the base station listener
```
python hardware/listen_base.py --port COM4
```
Keep this running. Every received LoRa packet prints automatically with:
- Sender name and node ID
- Hop count (how many nodes forwarded it)
- RSSI (signal strength dBm)
- SNR (signal quality dB)
- Full message text

### What to watch for

When Laptop 2 sends a test message:
```
==================================================
  PACKET RECEIVED @ 14:45:01
==================================================
  From     : Meshtastic fe20 (!c72723db)
  Hops     : 2 (hopLimit=1, hopStart=3)
  RSSI     : -85 dBm
  SNR      : 6.25 dB
  Message  : TRAILGUARD_TEST_001
==================================================
```
Hops > 0 confirms intermediate nodes forwarded the packet.

When Laptop 2 sends SOS:
```
  *** SOS ALERT ***
  Message  : SOS|NODE=fe20|TIME=14:46:00|MSG=EMERGENCY|ID=001
```

---

# LAPTOP 2 - SOS Sender Instructions

**You are SENDING. Follow these steps in order.**

### Prerequisites
```
pip install meshtastic
```

### Step 1 - Find the COM port of TG1
```
python -c "import serial.tools.list_ports; [print(p.device, '|', p.description) for p in serial.tools.list_ports.comports()]"
```
Look for Silicon Labs CP210x. Note the port (e.g. COM3).
Replace COM3 with your actual port in all commands below.

### Step 2 - Verify sender node identity
```
python -m meshtastic --port COM3 --info
```
Check:
- role = CLIENT (NOT CLIENT_MUTE)
- region = IN

If region is NOT IN, fix it:
```
python -m meshtastic --port COM3 --set lora.region IN --reboot
```
Wait 10 seconds then re-run Step 2.

### Step 3 - Phase 1: Send basic test message
```
python hardware/send_sos.py --port COM3 --msg "TRAILGUARD_TEST_001"
```
Wait 30 seconds. Ask Laptop 1 if received.
If not received: make sure relay nodes are powered on, wait 60s, try again.

### Step 4 - Phase 2: Send second test
```
python hardware/send_sos.py --port COM3 --msg "TRAILGUARD_TEST_002"
```
Confirm Laptop 1 received it. Note hop count.

### Step 5 - Phase 3: Send the SOS
```
python hardware/send_sos.py --port COM3 --sos
```
This sends: SOS|NODE=fe20|TIME=HH:MM:SS|MSG=EMERGENCY|ID=001
Laptop 1 should show the SOS ALERT banner.

### Step 6 - Check mesh topology
```
python -m meshtastic --port COM3 --nodes
```
Lists every node TG1 can see with signal info.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| COM port not found | Unplug/replug USB, re-run Step 1 |
| PermissionError on COM port | Another app is using it. Close any serial programs |
| Message not received | Ensure relay nodes are powered, wait 3 min for mesh to form |
| Wrong region | python -m meshtastic --port COMX --set lora.region IN --reboot |
| No module named meshtastic | pip install meshtastic |
| Nodes not in mesh | Wait 3 minutes - nodes announce periodically |

---

## What to Record

- [ ] COM port of each node
- [ ] Node ID (!xxxxxxxx) of each node
- [ ] Firmware version of each node
- [ ] Test message sent and timestamp
- [ ] Whether Laptop 1 received it (yes/no)
- [ ] Hop count shown on Laptop 1
- [ ] RSSI and SNR values
- [ ] Any errors

---

## Success Criteria

1. Laptop 1 receives TRAILGUARD_TEST_001 sent from Laptop 2
2. Hop count > 0 (proves intermediate nodes forwarded it)
3. Laptop 1 receives the SOS with the SOS ALERT banner
