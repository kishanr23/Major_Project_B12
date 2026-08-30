/**
 * AckVerifier.ts — Verify gateway-signed Ack messages in the mobile app.
 *
 * Implements the canonical Ack signature payload as specified in
 * docs/MESSAGE_HASH_SPEC.md § 3:
 *
 *   payload = original_message_id_utf8 || ack_timestamp_unix_big_endian_4_bytes
 *
 * Verification uses react-native-quick-crypto (OpenSSL/BoringSSL Ed25519).
 * A return value of false means the Ack must be silently dropped — the UI
 * must NOT transition to "Delivered".
 */
import { createPublicKey, verify as cryptoVerify } from 'react-native-quick-crypto';

/** SPKI DER prefix for a raw 32-byte Ed25519 public key. */
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * Reconstruct the canonical Ack signature payload.
 * Must match build_ack_payload() in dashboard/crypto_utils.py exactly.
 */
export function buildAckPayload(originalMessageId: string, ackTimestampUnix: number): Buffer {
  const idBytes = Buffer.from(originalMessageId, 'utf8'); // 16 bytes
  const tsBytes = Buffer.alloc(4);
  tsBytes.writeUInt32BE(ackTimestampUnix, 0);
  return Buffer.concat([idBytes, tsBytes]);
}

/**
 * Verify a gateway-signed Ack.
 *
 * @param gatewayPublicKeyHex - 32-byte Ed25519 gateway public key (hex).
 *   An empty string always returns false (safe default when not provisioned).
 * @param originalMessageId   - 16-char lowercase hex string.
 * @param ackTimestampUnix    - uint32 Ack timestamp.
 * @param signatureBytes      - 64-byte Ed25519 signature from the Ack proto.
 * @returns true only if the signature is valid. false on any failure.
 */
export function verifyAck(
  gatewayPublicKeyHex: string,
  originalMessageId: string,
  ackTimestampUnix: number,
  signatureBytes: Uint8Array,
): boolean {
  if (!gatewayPublicKeyHex || gatewayPublicKeyHex.length !== 64) return false;
  if (!signatureBytes || signatureBytes.length !== 64) return false;

  try {
    const rawPubKey = Buffer.from(gatewayPublicKeyHex, 'hex');
    const spkiDer   = Buffer.concat([SPKI_PREFIX, rawPubKey]);
    const pubKeyObj  = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });
    const payload    = buildAckPayload(originalMessageId, ackTimestampUnix);
    return cryptoVerify(null, payload, pubKeyObj, Buffer.from(signatureBytes)) as unknown as boolean;
  } catch {
    return false;
  }
}
