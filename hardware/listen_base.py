"""
listen_base.py — TrailGuard Base Station Listener
Run this on Laptop 1 to receive and display all incoming LoRa messages.

Usage:
    python hardware/listen_base.py --port COM4
"""
import meshtastic
import meshtastic.serial_interface
from pubsub import pub
import argparse
import time
from datetime import datetime

DIVIDER = "=" * 50

def on_receive(packet, interface):
    ts = datetime.now().strftime("%H:%M:%S")
    decoded = packet.get("decoded", {})
    portnum = decoded.get("portnum", "UNKNOWN")
    sender = packet.get("fromId", "?")
    to = packet.get("toId", "^all")
    hop_limit = packet.get("hopLimit", "?")
    hop_start = packet.get("hopStart", "?")
    hops_taken = (hop_start - hop_limit) if isinstance(hop_start, int) and isinstance(hop_limit, int) else "?"
    rssi = packet.get("rxRssi", "?")
    snr = packet.get("rxSnr", "?")

    # Get the human-readable node name if possible
    node_db = interface.nodes or {}
    sender_info = node_db.get(sender, {}).get("user", {})
    sender_name = sender_info.get("longName", sender)

    print(f"\n{DIVIDER}")
    print(f"  PACKET RECEIVED @ {ts}")
    print(f"{DIVIDER}")
    print(f"  From     : {sender_name} ({sender})")
    print(f"  To       : {to}")
    print(f"  Port     : {portnum}")
    print(f"  Hops     : {hops_taken} (hopLimit={hop_limit}, hopStart={hop_start})")
    print(f"  RSSI     : {rssi} dBm")
    print(f"  SNR      : {snr} dB")

    # Text message
    if portnum == "TEXT_MESSAGE_APP":
        text = decoded.get("text", "")
        print(f"{DIVIDER}")
        if "SOS" in text.upper():
            print(f"  *** SOS ALERT ***")
        print(f"  Message  : {text}")

    # Position
    elif portnum == "POSITION_APP":
        pos = decoded.get("position", {})
        lat = pos.get("latitudeI", 0) / 1e7
        lon = pos.get("longitudeI", 0) / 1e7
        print(f"  Position : lat={lat:.6f}, lon={lon:.6f}")

    # Telemetry
    elif portnum == "TELEMETRY_APP":
        tel = decoded.get("telemetry", {})
        print(f"  Telemetry: {tel}")

    else:
        print(f"  Payload  : {decoded}")

    print(f"{DIVIDER}")


def on_connection(interface, topic=pub.AUTO_TOPIC):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Connected to base station node.")
    nodes = interface.nodes or {}
    for nid, n in nodes.items():
        u = n.get("user", {})
        print(f"  Known node: {u.get('longName','?')} ({nid})")
    print(f"\nListening for incoming LoRa messages...\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TrailGuard Base Station Listener")
    parser.add_argument("--port", default="COM4", help="Serial port of base station node")
    args = parser.parse_args()

    pub.subscribe(on_receive, "meshtastic.receive")
    pub.subscribe(on_connection, "meshtastic.connection.established")

    print(f"Connecting to base station on {args.port}...")
    iface = meshtastic.serial_interface.SerialInterface(args.port)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping listener.")
        iface.close()
