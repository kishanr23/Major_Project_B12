/**
 * verify_hash_vectors.js — TypeScript/JavaScript cross-language verifier.
 *
 * Run with: node test_vectors/verify_hash_vectors.js
 * Verifies the djb2-64 hash implementation against the canonical test vectors
 * in hash_vectors.json. This covers both dedup_vectors and message_id_vectors.
 *
 * SIMULATED — exercises the hash algorithm only; no radio/BLE hardware needed.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const vectors = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'hash_vectors.json'), 'utf8')
);

// ── djb2-64 implementation (mirrors src/utils/hashUtils.ts in the mobile app) ──
function djb2_64(str) {
  let hash = 5381n;
  const bytes = Buffer.from(str, 'utf8');
  for (const b of bytes) {
    hash = ((hash << 5n) + hash + BigInt(b)) & 0xFFFFFFFFFFFFFFFFn;
  }
  return hash;
}

function toHex16(n) {
  return n.toString(16).padStart(16, '0');
}

// ── Runner ───────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function check(section, v) {
  const got = djb2_64(v.input);
  const ok  = toHex16(got) === v.hex && got.toString() === v.decimal;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${section} | input="${v.input}" expected=${v.hex} got=${toHex16(got)}`);
  if (ok) passed++; else failed++;
}

console.log('[SIMULATED] TypeScript/JS djb2-64 Hash Vector Verification\n');

console.log('Dedup vectors:');
for (const v of vectors.dedup_vectors)    check('dedup', v);

console.log('\nMessage-ID vectors:');
for (const v of vectors.message_id_vectors) check('msgid', v);

console.log(`\n${passed + failed} total — ${passed} passed, ${failed} failed`);
if (failed > 0) { console.error('HASH VECTOR VERIFICATION FAILED'); process.exit(1); }
else console.log('ALL HASH VECTOR TESTS PASSED');
