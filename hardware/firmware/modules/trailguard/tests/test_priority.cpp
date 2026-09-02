#include <iostream>
#include <vector>
#include <cassert>
#include <cstring>
#include "../src/TrailGuardModule.h"
#include "../src/crypto.h"

using namespace trailguard;

// Helper to sign and enqueue
bool sign_and_enqueue(TrailGuardModule& module, MessageType type, const std::string& sender_id, const std::vector<uint8_t>& payload, uint32_t timestamp, const uint8_t* pk, const uint8_t* sk) {
    uint8_t signature[crypto::SIGNATURE_SIZE];
    crypto::sign_message(sk, payload.data(), payload.size(), signature);
    return module.enqueueMessage(type, sender_id, payload, timestamp, signature, pk);
}

void test_priority_queue() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);

    std::vector<uint8_t> tm_payload(50, 'A');
    
    assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_1", tm_payload, 1000, pk, sk));
    assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_2", tm_payload, 1001, pk, sk));
    assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_3", tm_payload, 1002, pk, sk));
    assert(module.getQueueSize() == 3);

    std::vector<uint8_t> sos_payload(30, 'S');
    assert(sign_and_enqueue(module, MessageType::SOS, "hiker_4", sos_payload, 1003, pk, sk));

    std::vector<uint8_t> checkin_payload(15, 'C');
    assert(sign_and_enqueue(module, MessageType::CHECK_IN, "hiker_5", checkin_payload, 1004, pk, sk));
    assert(module.getQueueSize() == 5);

    TrailGuardPacket popped;
    bool success = module.popNextMessage(popped);
    assert(success);
    assert(popped.type == MessageType::SOS);
    assert(popped.sender_id == "hiker_4");

    success = module.popNextMessage(popped);
    assert(success);
    assert(popped.type == MessageType::CHECK_IN);
    assert(popped.sender_id == "hiker_5");

    success = module.popNextMessage(popped);
    assert(success);
    assert(popped.type == MessageType::TRAIL_MESSAGE);
    assert(popped.sender_id == "hiker_1");
    
    std::cout << "Priority Queue test passed!" << std::endl;
}

void test_trailmessage_size_limit() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);
    
    std::vector<uint8_t> valid_payload(140, 'A');
    assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_1", valid_payload, 2000, pk, sk));
    
    std::vector<uint8_t> invalid_payload(161, 'A');
    assert(!sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_1", invalid_payload, 2001, pk, sk));
    
    std::cout << "Size Limit test passed!" << std::endl;
}

void test_replay_protection() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);
    
    std::vector<uint8_t> sos_payload(30, 'S');
    uint32_t timestamp = 5000;
    
    assert(sign_and_enqueue(module, MessageType::SOS, "hiker_1", sos_payload, timestamp, pk, sk));
    assert(module.getQueueSize() == 1);
    
    assert(!sign_and_enqueue(module, MessageType::SOS, "hiker_1", sos_payload, timestamp, pk, sk));
    assert(module.getQueueSize() == 1);
    
    std::cout << "Replay Protection test passed!" << std::endl;
}

void test_replay_protection_different_types() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);
    
    std::vector<uint8_t> payload(10, 'X');
    uint32_t timestamp = 6000;
    
    assert(sign_and_enqueue(module, MessageType::SOS, "hiker_1", payload, timestamp, pk, sk));
    assert(module.getQueueSize() == 1);
    
    assert(sign_and_enqueue(module, MessageType::CHECK_IN, "hiker_1", payload, timestamp, pk, sk));
    assert(module.getQueueSize() == 2);
    
    std::cout << "Replay Protection Different Types test passed!" << std::endl;
}

void test_replay_protection_wrap() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);
    
    std::vector<uint8_t> payload(10, 'X');
    
    for (uint32_t i = 1; i <= 150; ++i) {
        std::string hiker_id = "flood_" + std::to_string(i);
        assert(sign_and_enqueue(module, MessageType::SOS, hiker_id, payload, 10000 + i, pk, sk));
    }
    
    assert(sign_and_enqueue(module, MessageType::SOS, "flood_1", payload, 10001, pk, sk));
    assert(!sign_and_enqueue(module, MessageType::SOS, "flood_100", payload, 10100, pk, sk));
    
    std::cout << "Replay Protection Wrap test passed!" << std::endl;
}

void test_invalid_signature() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);
    
    std::vector<uint8_t> message = {0xDE, 0xAD, 0xBE, 0xEF};
    uint8_t signature[crypto::SIGNATURE_SIZE];
    crypto::sign_message(sk, message.data(), message.size(), signature);
    
    // Valid signature works
    assert(module.enqueueMessage(MessageType::CHECK_IN, "hiker_1", message, 500, signature, pk));
    
    // Flipped bit signature fails
    signature[0] ^= 0x01;
    assert(!module.enqueueMessage(MessageType::CHECK_IN, "hiker_2", message, 501, signature, pk));
    
    std::cout << "Invalid Signature Rejection test passed!" << std::endl;
}

void test_priority_during_tx_contention() {
    TrailGuardModule module;
    uint8_t pk[crypto::PUBLIC_KEY_SIZE];
    uint8_t sk[crypto::PRIVATE_KEY_SIZE];
    crypto::generate_keypair(pk, sk);
    
    std::vector<uint8_t> tm_payload(50, 'A');
    std::vector<uint8_t> sos_payload(30, 'S');

    // 1. Initial state: radio is idle. A single TrailMessage arrives.
    assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_tx_0", tm_payload, 2000, pk, sk));

    // 2. Radio becomes active. It pops the message to begin transmission.
    TrailGuardPacket current_tx;
    bool success = module.popNextMessage(current_tx);
    assert(success);
    assert(current_tx.type == MessageType::TRAIL_MESSAGE);
    assert(module.getQueueSize() == 0);

    // 3. Radio is now "busy" transmitting the TrailMessage over LoRa (takes ~1-2 seconds).
    //    During this busy window, a flood of 5 TrailMessages arrives from the mesh.
    for (uint32_t i = 1; i <= 5; ++i) {
        assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_tx_" + std::to_string(i), tm_payload, 2000 + i, pk, sk));
    }
    
    // 4. Still during the same busy window, a critical SOS arrives.
    assert(sign_and_enqueue(module, MessageType::SOS, "hiker_sos_1", sos_payload, 2006, pk, sk));
    
    // 5. Another TrailMessage arrives after the SOS, still busy.
    assert(sign_and_enqueue(module, MessageType::TRAIL_MESSAGE, "hiker_tx_6", tm_payload, 2007, pk, sk));

    // Queue now has 7 messages sitting there waiting for TX to finish.
    assert(module.getQueueSize() == 7);

    // 6. Radio finishes transmission and asks for the next packet.
    TrailGuardPacket next_tx;
    success = module.popNextMessage(next_tx);
    
    // 7. VERIFICATION: The SOS MUST preempt the 5 TrailMessages that arrived before it
    //    and the 1 that arrived after it.
    assert(success);
    assert(next_tx.type == MessageType::SOS);
    assert(next_tx.sender_id == "hiker_sos_1");

    std::cout << "Priority During TX Contention test passed!" << std::endl;
}

int main() {
    test_priority_queue();
    test_trailmessage_size_limit();
    test_replay_protection();
    test_replay_protection_different_types();
    test_replay_protection_wrap();
    test_invalid_signature();
    test_priority_during_tx_contention();
    std::cout << "All Phase 2 tests passed (including real Ed25519 crypto verification)!" << std::endl;
    return 0;
}
