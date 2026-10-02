#!/usr/bin/env python3
"""
TrailGuard -- Heltec V3 Node Setup Script
=========================================

Plug in ONE Heltec board at a time and run:
    python hardware/setup_nodes.py

The script will:
  1. Auto-detect the connected board's COM port.
  2. Let you pick a role (Base Station or Relay Node 1/2/3).
  3. Set the board's long name and short name.
  4. Remove the Bluetooth pairing PIN (set to 0 = no PIN).
  5. Enable displaying received text messages on the OLED screen.
  6. Set the LoRa region to IN (India).

Repeat for each of your 4 boards.

Requirements:
    pip install meshtastic
"""

from __future__ import annotations

import sys
import time
import subprocess
import shutil
import serial.tools.list_ports

# -- Configuration ------------------------------------------------------------

LORA_REGION = "IN"  # India. Change to "US", "EU_868", etc. as needed.

NODE_CONFIGS = {
    "1": {
        "long_name": "TG-BaseStation",
        "short_name": "BASE",
        "role": "CLIENT_MUTE",
        "description": "Base Station (connected to laptop / dashboard)",
    },
    "2": {
        "long_name": "TG-RelayAlpha",
        "short_name": "RA",
        "role": "CLIENT",
        "description": "Relay Node Alpha",
    },
    "3": {
        "long_name": "TG-RelayBravo",
        "short_name": "RB",
        "role": "CLIENT",
        "description": "Relay Node Bravo",
    },
    "4": {
        "long_name": "TG-RelayCharlie",
        "short_name": "RC",
        "role": "CLIENT",
        "description": "Relay Node Charlie",
    },
}


# -- Helpers -------------------------------------------------------------------

def find_heltec_port():
    """Auto-detect the Heltec V3 USB-serial port (CP210x / CH9102 / CH340)."""
    ports = serial.tools.list_ports.comports()
    candidates = []
    for p in ports:
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        if any(chip in desc for chip in ("cp210", "ch910", "ch340", "usb-serial", "uart")):
            candidates.append(p)
        elif "10c4" in hwid or "1a86" in hwid:
            candidates.append(p)

    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0].device

    print("\nMultiple serial ports detected:")
    for i, p in enumerate(candidates, 1):
        print(f"  {i}. {p.device}  -- {p.description}")
    while True:
        choice = input(f"Pick a port [1-{len(candidates)}]: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(candidates):
            return candidates[int(choice) - 1].device
        print("Invalid choice, try again.")


def find_meshtastic_exe():
    """Find the meshtastic CLI executable."""
    scripts_dir = sys.executable.replace("python.exe", "Scripts")
    candidate = f"{scripts_dir}\\meshtastic.exe"
    if shutil.which(candidate):
        return candidate
    found = shutil.which("meshtastic")
    if found:
        return found
    return None


def run_meshtastic(port, *args):
    """Run a meshtastic CLI command and return success."""
    exe = find_meshtastic_exe()
    if exe:
        cmd = [exe, "--port", port] + list(args)
    else:
        cmd = [sys.executable, "-m", "meshtastic", "--port", port] + list(args)

    print(f"  > {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        stderr = result.stderr.strip()
        if stderr:
            print(f"    WARNING: {stderr[:200]}")
        return False
    stdout = result.stdout.strip()
    if stdout:
        for line in stdout.split("\n")[:5]:
            print(f"    {line}")
    return True


def configure_node(port, cfg):
    """Apply Meshtastic settings to the node on the given port."""
    long_name = cfg["long_name"]
    short_name = cfg["short_name"]
    role = cfg["role"]

    print(f"\n{'='*60}")
    print(f"  Configuring: {cfg['description']}")
    print(f"  Port: {port}")
    print(f"  Long Name:  {long_name}")
    print(f"  Short Name: {short_name}")
    print(f"  Role: {role}")
    print(f"{'='*60}\n")

    # 1. Set device role
    print("[1/5] Setting device role...")
    run_meshtastic(port, "--set", "device.role", role)
    time.sleep(1)

    # 2. Set long name and short name
    print("[2/5] Setting long name and short name...")
    run_meshtastic(port, "--setlongname", long_name)
    time.sleep(0.5)
    run_meshtastic(port, "--setshortname", short_name)
    time.sleep(1)

    # 3. Remove Bluetooth PIN (set mode to NO_PIN)
    print("[3/5] Removing Bluetooth PIN (no PIN required)...")
    run_meshtastic(port, "--set", "bluetooth.mode", "NO_PIN")
    time.sleep(1)

    # 4. Set LoRa region and network parameters
    print(f"[4/5] Setting LoRa region to {LORA_REGION}, Hop Limit to 3, Preset to LONG_FAST...")
    run_meshtastic(port, "--set", "lora.region", LORA_REGION)
    run_meshtastic(port, "--set", "lora.hop_limit", "3")
    run_meshtastic(port, "--set", "lora.modem_preset", "LONG_FAST")
    time.sleep(1)

    # 5. Enable always-on OLED display with message carousel
    print("[5/5] Enabling screen display of messages...")
    run_meshtastic(port, "--set", "display.screenOnSecs", "0")
    run_meshtastic(port, "--set", "display.autoScreenCarouselSecs", "5")
    time.sleep(1)

    # 6. Apply Reboot
    print("[6/6] Rebooting node to apply changes...")
    run_meshtastic(port, "--reboot")

    print(f"\n  DONE: {long_name} configured successfully!")
    print(f"  The board is rebooting. Bluetooth will advertise as '{long_name}'.")
    print(f"  No PIN is required for pairing.\n")


# -- Main ---------------------------------------------------------------------

def main():
    print("""
============================================================
         TrailGuard -- Heltec V3 Node Setup Tool
============================================================
  Plug in ONE Heltec board via USB, then run this tool.
  Repeat for each of your 4 boards.
============================================================
    """)

    # Step 1: Find the board
    print("Searching for connected Heltec board...")
    port = find_heltec_port()
    if not port:
        print("\nERROR: No Heltec board detected! Make sure:")
        print("   - The board is plugged in via USB")
        print("   - The USB cable supports data (not charge-only)")
        print("   - CP210x / CH9102 drivers are installed")
        sys.exit(1)

    print(f"Found board on {port}")

    # Step 2: Pick a role
    print("\nWhich role should this board have?\n")
    for key, cfg in NODE_CONFIGS.items():
        desc = cfg["description"]
        name = cfg["long_name"]
        print(f"  {key}. {desc:45s} ({name})")
    print()

    while True:
        choice = input("Enter choice [1-4]: ").strip()
        if choice in NODE_CONFIGS:
            break
        print("Invalid choice. Please enter 1, 2, 3, or 4.")

    # Step 3: Configure
    configure_node(port, NODE_CONFIGS[choice])

    print("-" * 60)
    print("Unplug this board and plug in the next one, then run again.")
    print("-" * 60)


if __name__ == "__main__":
    main()
