/**
 * hashUtils.ts — Canonical djb2-64 hash utility for the TrailGuard mobile app.
 *
 * This is the TypeScript implementation of the djb2-64 algorithm specified in
 * docs/MESSAGE_HASH_SPEC.md. Cross-language correctness is validated by
 * test_vectors/verify_hash_vectors.js against hash_vectors.json.
 *
 * Uses BigInt for correct uint64 wrapping — must target ES2020+.
 */

/** 64-bit djb2 over UTF-8 bytes. Wraps at 2^64. */
function djb2_64(s: string): bigint {
  let hash = 5381n;
  const bytes = new TextEncoder().encode(s);
  for (const b of bytes) {
    hash = ((hash << 5n) + hash + BigInt(b)) & 0xFFFFFFFFFFFFFFFFn;
  }
  return hash;
}

function toHex16(n: bigint): string {
  return n.toString(16).padStart(16, '0');
}

/**
 * Replay-dedup key: djb2_64('{hiker_id}:{msg_type}:{timestamp_unix}').
 * Omits node_id intentionally — same SOS through two mesh paths = one event.
 */
export function dedupKey(hikerId: string, msgType: string, timestampUnix: number): bigint {
  return djb2_64(`${hikerId}:${msgType}:${timestampUnix}`);
}

/**
 * Ack-correlation message ID: hex(djb2_64('{hiker_id}:{node_id}:{timestamp_unix}')).
 * Zero-padded 16-char lowercase hex string, matching the Ack.original_message_id field.
 */
export function computeMessageId(
  hikerId: string,
  nodeId: string,
  timestampUnix: number,
): string {
  return toHex16(djb2_64(`${hikerId}:${nodeId}:${timestampUnix}`));
}
