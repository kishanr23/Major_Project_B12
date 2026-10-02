"""
send_sos.py — TrailGuard SOS Sender
Run this on Laptop 2 to send a test/SOS message from the sender node.

Usage:
    python hardware/send_sos.py --port COM<X>
    python hardware/send_sos.py --port COM<X> --msg "TRAILGUARD_TEST_001"
    python hardware/send_sos.py --port COM<X> --sos
"""
import meshtastic
import meshtastic.serial_interface
import argparse
import time
from datetime import datetime

DIVIDER = "=" * 50

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TrailGuard SOS Sender")
    parser.add_argument("--port", required=True, help="Serial port of sender node (e.g. COM3)")
    parser.add_argument("--msg", default="TRAILGUARD_TEST_001", help="Message to send")
    parser.add_argument("--sos", action="store_true", help="Send full SOS alert instead of test message")
    args = parser.parse_args()

    print(f"Connecting to sender node on {args.port}...")
    iface = meshtastic.serial_interface.SerialInterface(args.port)
    time.sleep(2)  # Allow node info to populate

    # Print node identity
    myinfo = iface.myInfo
    nodes = iface.nodes or {}
    my_id = f"!{myinfo.my_node_num:08x}" if myinfo else "unknown"
    my_node = nodes.get(my_id, {}).get("user", {})
    print(f"\nSender Node  : {my_node.get('longName', 'Unknown')} ({my_id})")
    print(f"Firmware     : {iface.metadata.firmware_version if iface.metadata else '?'}")
    print(f"LoRa Region  : {iface.localConfig.lora.region if iface.localConfig else '?'}")
    print(f"Hop Limit    : {iface.localConfig.lora.hop_limit if iface.localConfig else '?'}")

    # Print known nodes
    print(f"\nKnown nodes in mesh:")
    for nid, n in nodes.items():
        u = n.get("user", {})
        print(f"  {u.get('longName','?'):20s} ({nid})  role={u.get('role','?')}")

    # Compose message
    if args.sos:
        ts = datetime.now().strftime("%H:%M:%S")
        message = f"SOS|NODE={my_node.get('shortName','TG1')}|TIME={ts}|MSG=EMERGENCY|ID=001"
    else:
        message = args.msg

    print(f"\n{DIVIDER}")
    print(f"  Sending: {message}")
    print(f"{DIVIDER}")

    iface.sendText(message)
    print(f"  Sent at {datetime.now().strftime('%H:%M:%S')} ✓")
    print(f"{DIVIDER}\n")

    time.sleep(2)
    iface.close()
