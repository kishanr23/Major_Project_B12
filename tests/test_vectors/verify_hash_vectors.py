"""
verify_hash_vectors.py — Python cross-language verifier.

Run with: python test_vectors/verify_hash_vectors.py
Verifies the djb2-64 hash implementation against the canonical test vectors
in hash_vectors.json.

SIMULATED — exercises the hash algorithm only; no radio hardware needed.
"""

import json
import sys
from pathlib import Path


def djb2_64(s: str) -> int:
    """djb2-64: operates over UTF-8 bytes, wraps at 2^64."""
    h = 5381
    for b in s.encode("utf-8"):
        h = ((h << 5) + h + b) & 0xFFFFFFFFFFFFFFFF
    return h


def to_hex16(n: int) -> str:
    return f"{n:016x}"


def main() -> int:
    vectors_path = Path(__file__).parent / "hash_vectors.json"
    vectors = json.loads(vectors_path.read_text(encoding="utf-8"))

    passed = 0
    failed = 0

    def check(section: str, v: dict) -> None:
        nonlocal passed, failed
        got = djb2_64(v["input"])
        hex_ok = to_hex16(got) == v["hex"]
        dec_ok = str(got) == v["decimal"]
        ok = hex_ok and dec_ok
        mark = "PASS" if ok else "FAIL"
        print(
            f"  [{mark}] {section} | input={v['input']!r}"
            f" expected={v['hex']} got={to_hex16(got)}"
        )
        if ok:
            passed += 1
        else:
            failed += 1

    print("[SIMULATED] Python djb2-64 Hash Vector Verification\n")

    print("Dedup vectors:")
    for v in vectors["dedup_vectors"]:
        check("dedup", v)

    print("\nMessage-ID vectors:")
    for v in vectors["message_id_vectors"]:
        check("msgid", v)

    print(f"\n{passed + failed} total — {passed} passed, {failed} failed")
    if failed > 0:
        print("HASH VECTOR VERIFICATION FAILED", file=sys.stderr)
        return 1
    print("ALL HASH VECTOR TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
