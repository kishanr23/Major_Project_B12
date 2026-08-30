"""
serial_adapter.py — TrailGuard gateway simulator (loopback transport).

SIMULATED — This module replaces the RadioHatTransport that would run on a
Raspberry Pi Zero 2 W with an SX1262 LoRa HAT in production. It:
  1. Sends pre-built protobuf payloads to the dashboard /ingest endpoint.
  2. Polls /pending_acks for signed Acks and "relays" them back to the
     originating node.
  3. MODELS MULTI-HOP ROUTING as a software stand-in for Phase 7 testing.
     Topology: Phone <-> Node_A <-> Node_B <-> Gateway <-> Dashboard

All output is clearly labelled "[SIMULATED]" so it is never mistaken for
real hardware evidence in test reports.

Run after starting dashboard/app.py:
  python gateway/serial_adapter.py
"""

from __future__ import annotations

import json
import time
import urllib.request
import urllib.error
from typing import Any

import nacl.signing

DASHBOARD_URL = "http://localhost:5000"
POLL_INTERVAL = 2  # seconds between Ack polls


def post_json(url: str, body: dict[str, Any]) -> dict[str, Any]:
    data  = json.dumps(body).encode()
    req   = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read())


def delete_json(url: str) -> None:
    req = urllib.request.Request(url, method="DELETE")
    with urllib.request.urlopen(req, timeout=5):
        pass


def get_json(url: str) -> Any:
    with urllib.request.urlopen(url, timeout=5) as resp:
        return json.loads(resp.read())


# ── Simulated Mesh Topology ───────────────────────────────────────────────────

class SimulatedNode:
    def __init__(self, name: str, next_hop: SimulatedNode | None = None):
        self.name = name
        self.next_hop = next_hop
        self.prev_hop = None
        if next_hop:
            next_hop.prev_hop = self

    def receive_from_ble(self, payload: dict):
        print(f"[SIMULATED] {self.name} received message via BLE from Phone.")
        self.forward(payload)

    def forward(self, payload: dict):
        if self.next_hop:
            print(f"[SIMULATED] {self.name} routing message to {self.next_hop.name}...")
            time.sleep(0.5) # Simulate LoRa airtime
            self.next_hop.forward(payload)
        else:
            # We are the gateway node
            print(f"[SIMULATED] {self.name} (Gateway) forwarding to Dashboard...")
            try:
                resp = post_json(f"{DASHBOARD_URL}/ingest", payload)
                print(f"[SIMULATED] Dashboard response: {resp['status']} | message_id={resp.get('message_id', 'n/a')}")
            except urllib.error.URLError as e:
                print(f"[SIMULATED] Error contacting dashboard: {e}")

    def route_ack_back(self, ack_data: dict):
        if self.prev_hop:
            print(f"[SIMULATED] {self.name} routing Ack to {self.prev_hop.name}...")
            time.sleep(0.5)
            self.prev_hop.route_ack_back(ack_data)
        else:
            # We are the edge node
            print(f"[SIMULATED] {self.name} delivering Ack to Phone via BLE!")


# ── Simulate sending a hiker SOS ──────────────────────────────────────────────

def simulate_sos(
    *,
    hiker_id: str,
    entry_node: SimulatedNode,
    hiker_lat: float,
    hiker_lon: float,
    message: str,
    sk: nacl.signing.SigningKey,
):
    ts = int(time.time())
    payload_json = json.dumps({
        "hiker_lat": hiker_lat,
        "hiker_lon": hiker_lon,
        "message":   message,
    })
    sig = sk.sign(payload_json.encode()).signature

    body = {
        "msg_type":       "SOS",
        "hiker_id":       hiker_id,
        "node_id":        entry_node.name,
        "timestamp_unix": ts,
        "public_key_hex": sk.verify_key.encode().hex(),
        "signature_hex":  sig.hex(),
        "payload_json":   payload_json,
    }

    print(f"\n[SIMULATED] Phone initiating SOS for {hiker_id}...")
    entry_node.receive_from_ble(body)


def simulate_checkin(
    *,
    hiker_id: str,
    entry_node: SimulatedNode,
    sk: nacl.signing.SigningKey,
):
    ts = int(time.time())
    payload_json = json.dumps({})
    sig = sk.sign(payload_json.encode()).signature

    body = {
        "msg_type":       "CheckIn",
        "hiker_id":       hiker_id,
        "node_id":        entry_node.name,
        "timestamp_unix": ts,
        "public_key_hex": sk.verify_key.encode().hex(),
        "signature_hex":  sig.hex(),
        "payload_json":   payload_json,
    }

    print(f"\n[SIMULATED] Phone initiating CheckIn for {hiker_id}...")
    entry_node.receive_from_ble(body)


# ── Ack relay loop ─────────────────────────────────────────────────────────────

def relay_pending_acks(gateway_node: SimulatedNode) -> None:
    try:
        acks = get_json(f"{DASHBOARD_URL}/pending_acks")
    except urllib.error.URLError as e:
        print(f"[SIMULATED] Ack poll error: {e}")
        return

    for ack in acks:
        mid = ack["message_id"]
        print(f"\n[SIMULATED] Gateway picked up Ack from Dashboard | message_id={mid}")
        gateway_node.route_ack_back(ack)
        try:
            delete_json(f"{DASHBOARD_URL}/pending_acks/{mid}")
        except urllib.error.URLError:
            pass


# ── Main demo loop ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("[SIMULATED] TrailGuard multi-hop gateway simulator starting…")
    print(f"[SIMULATED] Dashboard target: {DASHBOARD_URL}")
    print("[SIMULATED] NOTE: All mesh/radio activity is simulated as a stand-in for Phase 7 field tests.\n")

    # Set up topology: Node_A <-> Node_B <-> Gateway
    gateway_node = SimulatedNode("GatewayNode")
    node_b = SimulatedNode("Node_B", next_hop=gateway_node)
    node_a = SimulatedNode("Node_A", next_hop=node_b)

    # Generate a fresh hiker keypair for the demo
    alice_sk = nacl.signing.SigningKey.generate()
    print(f"[SIMULATED] Alice public key: {alice_sk.verify_key.encode().hex()[:16]}…\n")

    # Send one CheckIn
    simulate_checkin(hiker_id="alice_demo", entry_node=node_a, sk=alice_sk)
    time.sleep(1)

    # Send one SOS
    simulate_sos(
        hiker_id="alice_demo",
        entry_node=node_a,
        hiker_lat=37.7749,
        hiker_lon=-122.4194,
        message="Twisted ankle, south ridge",
        sk=alice_sk,
    )

    print("\n[SIMULATED] Entering Ack relay loop (Ctrl-C to stop)…")
    while True:
        time.sleep(POLL_INTERVAL)
        relay_pending_acks(gateway_node)
