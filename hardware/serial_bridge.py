"""
serial_bridge.py — TrailGuard Serial Bridge (COM4 ↔ Dashboard).

Routes every Meshtastic packet to the dashboard:
  • TG_PAYLOAD: / TG:  →  full SOS/CheckIn pipeline  →  POST /ingest
  • plain text / NODEINFO / POSITION  →  node heartbeat  →  POST /api/node-heartbeat

Any node that transmits ANYTHING appears in the Mesh Nodes page immediately.
"""

import sys
import time
import json
import base64
import requests
import meshtastic
import meshtastic.serial_interface
from pubsub import pub
import trailguard_pb2

DASHBOARD_BASE = "http://localhost:5000"
INGEST_URL     = f"{DASHBOARD_BASE}/ingest"
HEARTBEAT_URL  = f"{DASHBOARD_BASE}/api/node-heartbeat"


# ── Helpers ────────────────────────────────────────────────────────────────────

def _node_id_from_packet(packet: dict) -> str:
    """Return a stable '!<hex>' node ID from any Meshtastic packet."""
    from_val = packet.get("fromId") or packet.get("from")
    if from_val:
        if isinstance(from_val, str):
            return from_val
        return f"!{from_val:08x}"
    return "!unknown"


def _send_heartbeat(node_id: str, label: str = "", lat=None, lon=None):
    """Tell the dashboard this node is alive."""
    body = {"node_id": node_id, "label": label}
    if lat is not None:
        body["lat"] = lat
    if lon is not None:
        body["lon"] = lon
    try:
        resp = requests.post(HEARTBEAT_URL, json=body, timeout=5)
        print(f"[Serial Bridge] Heartbeat → {node_id}  ({resp.status_code})")
    except Exception as e:
        print(f"[Serial Bridge] Heartbeat failed for {node_id}: {e}")

# ── Main receive handler ───────────────────────────────────────────────────────

def on_receive(packet, interface):
    try:
        print(f"\n[DEBUG RAW] {packet}\n")

        node_id = _node_id_from_packet(packet)

        if 'decoded' not in packet:
            print(f"[Serial Bridge] Undecoded packet from {node_id} — heartbeat only")
            _send_heartbeat(node_id)
            return

        decoded = packet['decoded']
        portnum = decoded.get('portnum')

        # ── NODEINFO ──────────────────────────────────────────────────────────
        if portnum in ('NODEINFO_APP', 67):
            user  = decoded.get('user') or {}
            label = user.get('longName') or user.get('shortName') or ""
            print(f"[Serial Bridge] NODEINFO from {node_id} ('{label}')")
            _send_heartbeat(node_id, label=label)
            return

        # ── POSITION ──────────────────────────────────────────────────────────
        if portnum in ('POSITION_APP', 3):
            pos = decoded.get('position') or {}
            lat = pos.get('latitudeI',  0) / 1e7 if pos.get('latitudeI')  else None
            lon = pos.get('longitudeI', 0) / 1e7 if pos.get('longitudeI') else None
            print(f"[Serial Bridge] POSITION from {node_id}: lat={lat}, lon={lon}")
            _send_heartbeat(node_id, lat=lat, lon=lon)
            return

        # ── TEXT MESSAGE ──────────────────────────────────────────────────────
        if portnum in ('TEXT_MESSAGE_APP', 1):
            text_msg = decoded.get('text', '')
            if not text_msg and 'payload' in decoded:
                try:
                    text_msg = decoded['payload'].decode('utf-8', errors='ignore')
                except Exception:
                    pass

            print(f"[Serial Bridge] TEXT from {node_id}: {repr(text_msg)}")

            if "TG_PAYLOAD:" in text_msg:
                _handle_tg_payload(text_msg, node_id, interface)
                return

            if text_msg.startswith("TG:"):
                _handle_tg_legacy(text_msg, node_id, interface)
                return

            # Plain-text (e.g. 'TRAILGUARD TEST') — node is alive, register it
            print(f"[Serial Bridge] Plain-text from {node_id} — not a TrailGuard protobuf, heartbeat only.")
            _send_heartbeat(node_id)
            return

        # ── Everything else: heartbeat only ───────────────────────────────────
        print(f"[Serial Bridge] portnum={portnum} from {node_id} — heartbeat only")
        _send_heartbeat(node_id)

    except Exception as e:
        print(f"[Serial Bridge] Error processing packet: {e}")


# ── TrailGuard protobuf handlers ───────────────────────────────────────────────

def _handle_tg_payload(text_msg: str, node_id: str, interface):
    """Handle TG_PAYLOAD:<base64> [TG_PUBKEY:<hex>] messages."""
    base64_str = text_msg.split("TG_PAYLOAD:")[1].strip().split()[0]
    protobuf_bytes = base64.b64decode(base64_str)
    pubkey_hex = "0" * 64
    if "TG_PUBKEY:" in text_msg:
        try:
            pubkey_hex = text_msg.split("TG_PUBKEY:")[1].strip().split()[0]
        except Exception:
            pass
    _forward_protobuf(protobuf_bytes, pubkey_hex, node_id, interface)


def _handle_tg_legacy(text_msg: str, node_id: str, interface):
    """Handle TG:<base64_proto>[:<base64_pubkey>] messages."""
    parts = text_msg.split(":")
    if len(parts) < 2:
        print("[Serial Bridge] Malformed TG: message — skipping")
        return
    protobuf_bytes = base64.b64decode(parts[1])
    pubkey_hex = "0" * 64
    if len(parts) >= 3:
        try:
            pubkey_hex = base64.b64decode(parts[2]).hex()
        except Exception:
            pass
    _forward_protobuf(protobuf_bytes, pubkey_hex, node_id, interface)


def _forward_protobuf(protobuf_bytes: bytes, pubkey_hex: str, node_id: str, interface):
    """Parse a TrailGuard protobuf and POST to /ingest."""
    sos_msg = trailguard_pb2.SOS()
    try:
        sos_msg.ParseFromString(protobuf_bytes)
    except Exception as e:
        print(f"[Serial Bridge] Failed to parse protobuf: {e}")
        return

    msg_type = "SOS" if (hasattr(sos_msg, 'message') and sos_msg.message) else "CheckIn"
    hiker_id = sos_msg.hikerId
    ts       = sos_msg.timestampUnix
    sig_hex  = sos_msg.signature.hex() if sos_msg.signature else ""

    if msg_type == "SOS":
        payload_json = json.dumps({
            "lat":     sos_msg.hikerLat,
            "lon":     sos_msg.hikerLon,
            "message": sos_msg.message,
        })
    else:
        payload_json = "{}"

    sos_msg.ClearField('signature')
    original_b64 = base64.b64encode(sos_msg.SerializeToString()).decode('utf-8')

    ingest_data = {
        "msg_type":       msg_type,
        "hiker_id":       hiker_id,
        "node_id":        node_id,
        "timestamp_unix": ts,
        "public_key_hex": pubkey_hex,
        "signature_hex":  sig_hex,
        "payload_json":   payload_json,
        "protobuf_b64":   original_b64,
    }

    print(f"[Serial Bridge] Forwarding {msg_type} from {hiker_id} via {node_id} → dashboard…")
    try:
        resp = requests.post(INGEST_URL, json=ingest_data, timeout=5)
        print(f"[Serial Bridge] Dashboard response: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[Serial Bridge] Failed to reach dashboard: {e}")
        return

    if resp.status_code == 200:
        try:
            ack_dict = resp.json().get("ack")
            if ack_dict:
                ack_msg = trailguard_pb2.Ack()
                ack_msg.originalMessageId = ack_dict["original_message_id"]
                ack_msg.ackTimestampUnix  = ack_dict["ack_timestamp_unix"]
                if ack_dict.get("signature_hex"):
                    ack_msg.signature = bytes.fromhex(ack_dict["signature_hex"])
                ack_b64  = base64.b64encode(ack_msg.SerializeToString()).decode('utf-8')
                out_text = f"TG_ACK:{ack_b64}"
                print("[Serial Bridge] Broadcasting signed ACK back to mesh…")
                interface.sendText(out_text)
        except Exception as e:
            print(f"[Serial Bridge] ACK relay error: {e}")

def main():
    print("[Serial Bridge] Connecting to local Meshtastic base-station…")
    try:
        port = "COM4"  # CLIENT_MUTE base station (TG-Relay-A)
        interface = meshtastic.serial_interface.SerialInterface(devPath=port)
        print(f"[Serial Bridge] Connected to {port}! Listening for TrailGuard messages…")
        pub.subscribe(on_receive, "meshtastic.receive")
        while True:
            time.sleep(1)
    except Exception as e:
        print(f"[Serial Bridge] Failed to connect: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

