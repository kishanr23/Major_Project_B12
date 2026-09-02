"""
provisioning.py — TrailGuard node provisioning CLI.

Use this script when setting up a new TrailGuard node to:
  1. Display the gateway's public key (for flashing into nodes and the mobile app).
  2. Register a node's public key (read off the OLED or serial console) into the DB.
  3. List all provisioned nodes.

Usage:
  python dashboard/provisioning.py show-gateway-key
  python dashboard/provisioning.py add-node --node-id "node_A" --pubkey-hex "abcdef..."
  python dashboard/provisioning.py list-nodes

See docs/ARCHITECTURE.md § Key Provisioning for the full workflow.
"""

import argparse
import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).parent
DB_PATH  = BASE_DIR / "trailguard.db"
KEYPAIR_PATH = BASE_DIR / "gateway_keypair.json"


def cmd_show_gateway_key(_args: argparse.Namespace) -> None:
    if not KEYPAIR_PATH.exists():
        print("Gateway keypair not found. Start dashboard/app.py once to generate it.")
        return
    data = json.loads(KEYPAIR_PATH.read_text())
    print(f"\nGateway Ed25519 PUBLIC KEY (hex):\n  {data['verify_key_hex']}\n")
    print("Provision this key into every node (via build flag or OLED-confirmed serial)")
    print("and into the mobile app (bundled as a build constant in Signer.ts).\n")


def cmd_add_node(args: argparse.Namespace) -> None:
    with sqlite3.connect(str(DB_PATH)) as db:
        db.execute(
            "INSERT OR REPLACE INTO nodes (node_id, public_key_hex) VALUES (?, ?)",
            (args.node_id, args.pubkey_hex),
        )
        db.commit()
    print(f"Node '{args.node_id}' registered with public key {args.pubkey_hex[:16]}…")


def cmd_list_nodes(_args: argparse.Namespace) -> None:
    with sqlite3.connect(str(DB_PATH)) as db:
        cur = db.execute("SELECT node_id, public_key_hex, last_seen_unix FROM nodes")
        rows = cur.fetchall()
    if not rows:
        print("No nodes provisioned yet.")
        return
    print(f"{'Node ID':<20} {'Public Key (first 16 chars)':<30} Last seen")
    print("-" * 70)
    for node_id, pubkey, last_seen in rows:
        seen = str(last_seen) if last_seen else "never"
        print(f"{node_id:<20} {(pubkey or '')[:16]+'...':<30} {seen}")


def main() -> None:
    parser = argparse.ArgumentParser(description="TrailGuard node provisioning")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("show-gateway-key", help="Print the gateway public key")

    p_add = sub.add_parser("add-node", help="Register a node public key")
    p_add.add_argument("--node-id",   required=True, help="Node ID string (e.g. node_A)")
    p_add.add_argument("--pubkey-hex", required=True, help="32-byte Ed25519 pub key as hex")

    sub.add_parser("list-nodes", help="List provisioned nodes")

    # User management
    p_user_add = sub.add_parser("add-user", help="Add a dashboard user")
    p_user_add.add_argument("--username", required=True)
    p_user_add.add_argument("--password", required=True)
    p_user_add.add_argument("--role", required=True, choices=["admin", "ranger", "viewer"])

    sub.add_parser("list-users", help="List dashboard users")

    p_user_del = sub.add_parser("delete-user", help="Delete a dashboard user")
    p_user_del.add_argument("--username", required=True)

    args = parser.parse_args()
    
    if args.command == "add-user":
        from dashboard.auth import hash_password
        with sqlite3.connect(str(DB_PATH)) as db:
            db.execute("INSERT OR REPLACE INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       (args.username, hash_password(args.password), args.role))
            db.commit()
        print(f"User '{args.username}' added with role '{args.role}'.")
    elif args.command == "list-users":
        with sqlite3.connect(str(DB_PATH)) as db:
            cur = db.execute("SELECT username, role, created_at FROM users")
            rows = cur.fetchall()
        if not rows:
            print("No users found.")
        else:
            print(f"{'Username':<20} {'Role':<15} {'Created At'}")
            print("-" * 55)
            for username, role, created_at in rows:
                print(f"{username:<20} {role:<15} {created_at}")
    elif args.command == "delete-user":
        with sqlite3.connect(str(DB_PATH)) as db:
            db.execute("DELETE FROM users WHERE username = ?", (args.username,))
            db.commit()
        print(f"User '{args.username}' deleted.")
    else:
        {"show-gateway-key": cmd_show_gateway_key,
         "add-node":         cmd_add_node,
         "list-nodes":       cmd_list_nodes}[args.command](args)


if __name__ == "__main__":
    main()
