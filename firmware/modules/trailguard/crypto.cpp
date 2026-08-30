#include "crypto.h"
#include "tweetnacl.h"
#include <cstring>
#include <cstdlib>
#include <iostream>

#ifndef REAL_HARDWARE
#ifndef TEST_BUILD
#error "REAL_HARDWARE not defined! Do not ship dummy RNG to production."
#endif
// TweetNaCl requires an external randombytes function.
// Mocking it for Phase 2 simulation. In production ESP32, this calls esp_fill_random.
extern "C" void randombytes(unsigned char * x, unsigned long long xlen) {
    for (unsigned long long i = 0; i < xlen; ++i) {
        x[i] = rand() & 0xFF; // Mock RNG — replaced by esp_fill_random on REAL_HARDWARE
    }
}
#endif

namespace trailguard {
namespace crypto {

// Maximum serialized payload size the crypto layer will ever accept.
// Sized to the largest per-type cap (SOS = 256 bytes, see TrailGuardModule.h).
// The original code had a VLA here (`uint8_t sm[SIGNATURE_SIZE + message_len]`)
// which is unbounded on the stack. This fixed-size array eliminates that VLA
// entirely; the explicit bounds check below ensures message_len can never push
// past this ceiling, so the fixed arrays are always large enough.
static constexpr size_t MAX_CRYPTO_PAYLOAD = 256; // == MAX_PAYLOAD_SOS in TrailGuardModule.h

bool verify_signature(
    const uint8_t* public_key,
    const uint8_t* message,
    size_t message_len,
    const uint8_t* signature
) {
    // Explicit bounds check before touching the fixed-size stack buffers.
    // This replaces the original VLA that was unbounded by message_len.
    if (message_len > MAX_CRYPTO_PAYLOAD) {
        std::cerr << "Crypto: verify_signature rejected oversized payload ("
                  << message_len << " > " << MAX_CRYPTO_PAYLOAD << ")" << std::endl;
        return false;
    }

    // Fixed-size buffers: 320 bytes each on the stack (SIGNATURE_SIZE=64 + MAX_CRYPTO_PAYLOAD=256).
    // TweetNaCl crypto_sign_open expects layout: [ signature (64B) | message (N B) ]
    uint8_t sm[SIGNATURE_SIZE + MAX_CRYPTO_PAYLOAD];
    uint8_t m[SIGNATURE_SIZE + MAX_CRYPTO_PAYLOAD];

    std::memcpy(sm, signature, SIGNATURE_SIZE);
    std::memcpy(sm + SIGNATURE_SIZE, message, message_len);

    unsigned long long mlen = 0;
    int result = crypto_sign_open(m, &mlen, sm, SIGNATURE_SIZE + message_len, public_key);
    return result == 0;
}

void sign_message(
    const uint8_t* private_key,
    const uint8_t* message,
    size_t message_len,
    uint8_t* signature_out
) {
    // Same bounds check as verify_signature; replaces the original VLA.
    if (message_len > MAX_CRYPTO_PAYLOAD) {
        std::cerr << "Crypto: sign_message rejected oversized payload ("
                  << message_len << " > " << MAX_CRYPTO_PAYLOAD << ")" << std::endl;
        return;
    }

    // Fixed 320-byte buffer. TweetNaCl crypto_sign writes [ signature (64B) | message (N B) ].
    uint8_t sm[SIGNATURE_SIZE + MAX_CRYPTO_PAYLOAD];
    unsigned long long smlen = 0;

    crypto_sign(sm, &smlen, message, message_len, private_key);

    // Extract just the 64-byte signature prefix.
    std::memcpy(signature_out, sm, SIGNATURE_SIZE);
}

void generate_keypair(
    uint8_t* public_key_out,
    uint8_t* private_key_out
) {
    crypto_sign_keypair(public_key_out, private_key_out);
}

} // namespace crypto
} // namespace trailguard

