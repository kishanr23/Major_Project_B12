#pragma once

#include <stdint.h>
#include <stddef.h>

namespace trailguard {
namespace crypto {

constexpr size_t PUBLIC_KEY_SIZE = 32;
constexpr size_t PRIVATE_KEY_SIZE = 64; // Seed + PubKey typically
constexpr size_t SIGNATURE_SIZE = 64;

// Verify an Ed25519 signature
// Returns true if valid, false otherwise.
bool verify_signature(
    const uint8_t* public_key,
    const uint8_t* message,
    size_t message_len,
    const uint8_t* signature
);

// Sign a message using Ed25519
// signature must be a pre-allocated buffer of SIGNATURE_SIZE
void sign_message(
    const uint8_t* private_key,
    const uint8_t* message,
    size_t message_len,
    uint8_t* signature_out
);

// Generates a new keypair
void generate_keypair(
    uint8_t* public_key_out,
    uint8_t* private_key_out
);

} // namespace crypto
} // namespace trailguard
