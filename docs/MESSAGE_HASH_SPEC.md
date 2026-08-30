# TrailGuard Canonical Message Hash Specification

## Purpose

This document is the **single source of truth** for the two hash functions used
by the TrailGuard system. All three implementations — C++ firmware, Python
dashboard, and TypeScript mobile app — **must** produce identical outputs for
identical inputs. Any divergence is a bug.

Cross-language test vectors are in `test_vectors/hash_vectors.json` and are
verified by the scripts in `test_vectors/`.

---

## Algorithm: djb2-64

**Both** hash functions below use this algorithm. It is a 64-bit variant of the
classic djb2 hash operating over UTF-8 encoded bytes.

```
hash ← 5381 (unsigned 64-bit integer)
for each byte b in the UTF-8 encoded input string:
    hash ← ((hash << 5) + hash + b) mod 2^64
return hash
```

Unsigned 64-bit wrapping arithmetic (no signed overflow). Implementations must
treat the accumulator as `uint64_t` (C++), a Python `int` masked with
`& 0xFFFFFFFFFFFFFFFF`, or a BigInt masked with `0xFFFFFFFFFFFFFFFFn` (TS/JS).

---

## 1. Dedup Key (Replay Protection)

Used by the **firmware** and **dashboard** to detect replayed packets before
relaying or logging them. Intentionally omits `node_id` so that the same SOS
arriving through two different mesh nodes (multi-path) is correctly identified
as a single event — not two separate events.

### Input construction

```
input = "{hiker_id}:{msg_type}:{timestamp_unix_decimal}"
```

- `hiker_id` — exact string value from the protobuf field, no trimming.
- `:` — a single ASCII colon (0x3A).
- `msg_type` — exact string value of the message type ("SOS", "CheckIn", or "TrailMessage").
- `:` — a single ASCII colon (0x3A).
- `timestamp_unix_decimal` — the decimal string representation of the
  `timestamp_unix` uint32 field with no leading zeros.

### Output

`djb2_64(input)` as an **unsigned decimal string** for storage, or held as a
`uint64_t` in the firmware's circular buffer.

### Examples (normative — see `hash_vectors.json` for machine-readable form)

| hiker_id | msg_type | timestamp_unix | input string | expected hex |
|---|---|---|---|---|
| `hiker_001` | `SOS` | `1700000000` | `hiker_001:SOS:1700000000` | see vectors file |
| `alice` | `CheckIn` | `0` | `alice:CheckIn:0` | see vectors file |
| `` (empty) | `TrailMessage` | `9999` | `:TrailMessage:9999` | see vectors file |

### Reconciliation note

The firmware's Phase 1 implementation used `"_"` (underscore) as a separator
and named the parameter `sender_id`. This is **corrected here and in the
firmware** to use `":"` (colon) and the field name `hiker_id` to match the
protobuf field name, eliminating any potential for an SOS/CheckIn naming
ambiguity. The cross-language test vectors enforce the corrected separator.

---

## 2. Message ID (Ack Correlation)

Used by the **dashboard** when generating an `Ack`, and by the **firmware** and
**mobile app** when matching an incoming `Ack` back to a pending message.
Includes `node_id` to uniquely address the originating node for Ack routing.

### Input construction

```
input = "{hiker_id}:{node_id}:{timestamp_unix_decimal}"
```

- `hiker_id` — exact string value from the protobuf field.
- `:` — ASCII colon (0x3A).
- `node_id` — exact string value from the protobuf field.
- `:` — ASCII colon (0x3A).
- `timestamp_unix_decimal` — decimal representation of `timestamp_unix`.

### Output

`djb2_64(input)` formatted as a **zero-padded 16-character lowercase hex string**
(8 bytes = 16 hex chars). This is stored in `Ack.original_message_id`.

### Examples

| hiker_id | node_id | timestamp_unix | input string | expected hex |
|---|---|---|---|---|
| `hiker_001` | `node_A` | `1700000000` | `hiker_001:node_A:1700000000` | see vectors file |

---

## 3. Ack Signature Payload

The gateway signs the Ack with its Ed25519 keypair. The payload being signed is:

```
sig_payload = original_message_id_utf8_bytes || ack_timestamp_unix_big_endian_4_bytes
```

- `original_message_id_utf8_bytes` — the UTF-8 encoding of the 16-char hex string.
- `||` — concatenation.
- `ack_timestamp_unix_big_endian_4_bytes` — the `ack_timestamp_unix` uint32 encoded as
  4 bytes, big-endian.

Verifiers must reconstruct this exact payload from the received Ack fields and
verify the Ed25519 signature against the provisioned gateway public key. If
verification fails, the Ack is silently dropped and the UI stays in
"Relay unconfirmed".
