#include "TrailGuardModule.h"
#include "crypto.h"
#include <iostream>

namespace trailguard {

TrailGuardModule::TrailGuardModule() {}

bool TrailGuardModule::onReceive(const std::vector<uint8_t>& raw_bytes) {
    // In a real Meshtastic module, we would unpack the Protobuf here,
    // verify the Ed25519 signature, and decide whether to forward or drop.
    return true;
}

void TrailGuardModule::updateTelemetry(float battery_pct, float solar_mw) {
    current_battery_pct = battery_pct;
    current_solar_mw = solar_mw;
}

bool TrailGuardModule::shouldDeepSleep() const {
    // If we have messages to send, stay awake
    if (!tx_queue.empty()) {
        return false;
    }
    
    // If battery is extremely low and we aren't generating solar, sleep to survive for SOS wakeups
    if (current_battery_pct < 20.0f && current_solar_mw < 10.0f) {
        return true; 
    }
    
    // Otherwise, stay awake to act as a mesh relay backbone
    return false;
}

bool TrailGuardModule::enqueueMessage(MessageType type, const std::string& sender_id, const std::vector<uint8_t>& payload, uint32_t timestamp, const uint8_t* signature, const uint8_t* public_key) {
    // 1. Verify cryptographic signature first using TweetNaCl
    if (!crypto::verify_signature(public_key, payload.data(), payload.size(), signature)) {
        std::cerr << "Message rejected: invalid Ed25519 signature." << std::endl;
        return false;
    }

    // 2. Check for replay attacks before queueing
    if (isReplay(type, sender_id, timestamp)) {
        std::cerr << "Message rejected: replay detected for " << sender_id << " at " << timestamp << std::endl;
        return false;
    }

    // 3. Per-type payload size caps derived from worst-case protobuf wire-format analysis.
    //    Each cap is type-specific so an oversized SOS (with free-text + GPS) is not
    //    silently rejected by a cap sized only for TrailMessages.
    size_t max_payload;
    if (type == MessageType::SOS) {
        max_payload = MAX_PAYLOAD_SOS;          // 256 bytes
    } else if (type == MessageType::CHECK_IN) {
        max_payload = MAX_PAYLOAD_CHECKIN;      // 160 bytes
    } else {
        max_payload = MAX_PAYLOAD_TRAILMESSAGE; // 140 bytes
    }
    if (payload.size() > max_payload) {
        std::cerr << "Message rejected: payload size " << payload.size()
                  << " exceeds cap " << max_payload << " for type " << static_cast<int>(type) << std::endl;
        return false;
    }

    TrailGuardPacket packet{type, payload, timestamp, sender_id};
    tx_queue.push(packet);
    return true;
}

bool TrailGuardModule::popNextMessage(TrailGuardPacket& out_packet) {
    if (tx_queue.empty()) {
        return false;
    }
    out_packet = tx_queue.top();
    tx_queue.pop();
    return true;
}

size_t TrailGuardModule::getQueueSize() const {
    return tx_queue.size();
}


bool TrailGuardModule::isReplay(MessageType type, const std::string& sender_id, uint32_t timestamp) {
    // Hash using canonical separator ':' per docs/MESSAGE_HASH_SPEC.md.
    // IMPORTANT: separator must match dashboard (crypto_utils.py) and mobile
    // (hashUtils.ts). Cross-language vectors in test_vectors/hash_vectors.json.
    std::string type_str = (type == MessageType::SOS) ? "SOS" :
                           (type == MessageType::CHECK_IN) ? "CheckIn" : "TrailMessage";
    std::string raw_string = sender_id + ":" + type_str + ":" + std::to_string(timestamp);
    
    // Simple 64-bit hash (djb2 variant)
    uint64_t hash = 5381;
    for (char c : raw_string) {
        hash = ((hash << 5) + hash) + c;
    }
    
    if (type == MessageType::SOS || type == MessageType::CHECK_IN) {
        // Check critical buffer
        for (size_t i = 0; i < MAX_SEEN_CRITICAL; ++i) {
            if (seen_critical_hashes[i] == hash) return true; // Replay!
        }
        // Record it, overwriting oldest
        seen_critical_hashes[critical_hash_index] = hash;
        critical_hash_index = (critical_hash_index + 1) % MAX_SEEN_CRITICAL;
    } else {
        // Check trail message buffer
        for (size_t i = 0; i < MAX_SEEN_TRAIL; ++i) {
            if (seen_trail_hashes[i] == hash) return true; // Replay!
        }
        // Record it, overwriting oldest
        seen_trail_hashes[trail_hash_index] = hash;
        trail_hash_index = (trail_hash_index + 1) % MAX_SEEN_TRAIL;
    }
    
    return false;
}

} // namespace trailguard
