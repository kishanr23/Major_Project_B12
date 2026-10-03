#include "crypto.h"
#include "../lib/tweetnacl/tweetnacl.h"
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>

#ifdef REAL_HARDWARE
// On ESP32, use the hardware RNG
extern "C" {
#include "esp_random.h"
}
extern "C" void randombytes(unsigned char *x, unsigned long long xlen) {
    esp_fill_random(x, (size_t)xlen);
}
#else
#ifndef TEST_BUILD
#error "REAL_HARDWARE not defined! Do not ship dummy RNG to production."
#endif
// Mock RNG for simulation/test builds only
extern "C" void randombytes(unsigned char *x, unsigned long long xlen) {
    for (unsigned long long i = 0; i < xlen; ++i) {
        x[i] = rand() & 0xFF;
    }
}
#endif

namespace trailguard {
namespace crypto {

// Maximum serialized payload size the crypto layer will ever accept.
// Sized to the largest per-type cap (SOS = 256 bytes, see TrailGuardModule.h).
static constexpr size_t MAX_CRYPTO_PAYLOAD = 256;

bool verify_signature(
    const uint8_t* public_key,
    const uint8_t* message,
    size_t message_len,
    const uint8_t* signature
) {
    if (message_len > MAX_CRYPTO_PAYLOAD) {
        printf("Crypto: verify_signature rejected oversized payload (%zu > %zu)\n", message_len, MAX_CRYPTO_PAYLOAD);
        return false;
    }

    // Fixed-size buffers: TweetNaCl layout: [ signature (64B) | message (N B) ]
    uint8_t sm[SIGNATURE_SIZE + MAX_CRYPTO_PAYLOAD];
    uint8_t m[SIGNATURE_SIZE + MAX_CRYPTO_PAYLOAD];

    memcpy(sm, signature, SIGNATURE_SIZE);
    memcpy(sm + SIGNATURE_SIZE, message, message_len);

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
    if (message_len > MAX_CRYPTO_PAYLOAD) {
        printf("Crypto: sign_message rejected oversized payload (%zu > %zu)\n", message_len, MAX_CRYPTO_PAYLOAD);
        return;
    }

    uint8_t sm[SIGNATURE_SIZE + MAX_CRYPTO_PAYLOAD];
    unsigned long long smlen = 0;

    crypto_sign(sm, &smlen, message, message_len, private_key);

    // Extract just the 64-byte signature prefix
    memcpy(signature_out, sm, SIGNATURE_SIZE);
}

void generate_keypair(
    uint8_t* public_key_out,
    uint8_t* private_key_out
) {
    crypto_sign_keypair(public_key_out, private_key_out);
}

} // namespace crypto
} // namespace trailguard
