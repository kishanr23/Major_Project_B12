const nacl = require('tweetnacl');
const crypto = require('crypto');

console.log("=== Ed25519 Cross-Library Interoperability Test ===");
console.log("Firmware Crypto: TweetNaCl (via tweetnacl-js)");
console.log("Mobile Crypto: OpenSSL/libsodium (via Node.js crypto module)\n");

const message = Buffer.from("CheckIn_Hiker_Alice_12345");

// ---------------------------------------------------------
// Test 1: Firmware signs (TweetNaCl), Mobile verifies (Node Crypto)
// ---------------------------------------------------------
console.log("[Test 1] Firmware signs -> Mobile verifies");
// Firmware generates keypair
const fwKeypair = nacl.sign.keyPair();

// Firmware signs (TweetNaCl produces signature + message by default for crypto_sign, 
// but crypto_sign_detached is 64 bytes. For our firmware we used the first 64 bytes of crypto_sign).
// tweetnacl-js provides nacl.sign.detached for just the signature.
const fwSignature = nacl.sign.detached(message, fwKeypair.secretKey);

// Mobile parses the public key by wrapping the raw Ed25519 key in a standard SPKI DER structure
const derPrefix = Buffer.from('302a300506032b6570032100', 'hex');
const pubKeyDer = Buffer.concat([derPrefix, fwKeypair.publicKey]);

const mobileVerifyKeyRaw = crypto.createPublicKey({
    key: pubKeyDer,
    format: 'der',
    type: 'spki'
});

const mobileVerifiesFw = crypto.verify(null, message, mobileVerifyKeyRaw, Buffer.from(fwSignature));
console.log(`Result: ${mobileVerifiesFw ? 'PASS' : 'FAIL'}\n`);

// ---------------------------------------------------------
// Test 2: Mobile signs (Node Crypto), Firmware verifies (TweetNaCl)
// ---------------------------------------------------------
console.log("[Test 2] Mobile signs -> Firmware verifies");
// Mobile generates keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

// Mobile signs
const mobileSignature = crypto.sign(null, message, privateKey);

// Firmware parses the raw public key by extracting it from the exported DER
const mobilePublicKeyDer = publicKey.export({ format: 'der', type: 'spki' });
// The raw 32-byte key is at the end of the 44-byte DER structure
const mobilePublicKeyRaw = mobilePublicKeyDer.subarray(12);

// Firmware verifies
const fwVerifiesMobile = nacl.sign.detached.verify(message, mobileSignature, mobilePublicKeyRaw);
console.log(`Result: ${fwVerifiesMobile ? 'PASS' : 'FAIL'}\n`);

// ---------------------------------------------------------
// Test 3: Edge Cases and Failure Modes
// ---------------------------------------------------------
console.log("[Test 3] Edge Cases & Tamper Detection");
const tamperedMessage = Buffer.from("CheckIn_Hiker_Bob_12345");
const fwVerifiesTampered = nacl.sign.detached.verify(tamperedMessage, mobileSignature, mobilePublicKeyRaw);
console.log(`Tampered message verification: ${fwVerifiesTampered === false ? 'PASS (Rejected)' : 'FAIL (Accepted)'}`);

// Malformed signature (flip first byte)
const malformedSignature = Buffer.from(mobileSignature);
malformedSignature[0] ^= 0xFF;
const fwVerifiesMalformedSig = nacl.sign.detached.verify(message, malformedSignature, mobilePublicKeyRaw);
console.log(`Malformed signature verification: ${fwVerifiesMalformedSig === false ? 'PASS (Rejected)' : 'FAIL (Accepted)'}`);

// Wrong key length (truncate by 1 byte)
let fwVerifiesShortKey = false;
try {
    const shortKey = mobilePublicKeyRaw.subarray(0, 31);
    fwVerifiesShortKey = nacl.sign.detached.verify(message, mobileSignature, shortKey);
} catch (e) {
    // TweetNaCl throws on invalid key length
    fwVerifiesShortKey = false;
}
console.log(`Wrong key length verification: ${fwVerifiesShortKey === false ? 'PASS (Rejected/Throw)' : 'FAIL (Accepted)'}`);

// Empty payload (should still sign and verify successfully)
const emptyMessage = Buffer.from("");
const emptySignature = crypto.sign(null, emptyMessage, privateKey);
const fwVerifiesEmpty = nacl.sign.detached.verify(emptyMessage, emptySignature, mobilePublicKeyRaw);
console.log(`Empty payload verification: ${fwVerifiesEmpty === true ? 'PASS (Accepted)' : 'FAIL (Rejected)'}\n`);

if (mobileVerifiesFw && fwVerifiesMobile && !fwVerifiesTampered && !fwVerifiesMalformedSig && !fwVerifiesShortKey && fwVerifiesEmpty) {
    console.log("=== ALL CRYPTO INTEROP TESTS PASSED ===");
} else {
    console.error("=== CRYPTO INTEROP TESTS FAILED ===");
    process.exit(1);
}
