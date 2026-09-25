#include "TrailGuardModule.h"
#include "crypto.h"
#include <iostream>

namespace trailguard {

TrailGuardModule::TrailGuardModule() : SinglePortModule("TrailGuard", meshtastic_PortNum_PRIVATE_APP) {}

ProcessMessage TrailGuardModule::handleReceived(const meshtastic_MeshPacket &mp) {
    if (mp.which_payload_variant == meshtastic_MeshPacket_decoded_tag) {
        const auto& p = mp.decoded;
        if (p.portnum == ourPortNum) {
            std::vector<uint8_t> raw_bytes(p.payload.bytes, p.payload.bytes + p.payload.size);
            
            // In a real module, unpack Protobuf here,
            // verify the Ed25519 signature, and decode.
            std::cout << "TrailGuard module received a packet of size: " << raw_bytes.size() << std::endl;
            return ProcessMessage::STOP;
        }
    }
    return ProcessMessage::CONTINUE;
}

void TrailGuardModule::updateTelemetry(float battery_pct, float solar_mw) {
    current_battery_pct = battery_pct;
    current_solar_mw = solar_mw;
}

bool TrailGuardModule::shouldDeepSleep() const {
    if (!tx_queue.empty()) {
        return false;
    }
    
    if (current_battery_pct < 20.0f && current_solar_mw < 10.0f) {
        return true; 
    }
    
    return false;
}

bool TrailGuardModule::enqueueMessage(MessageType type, const std::string& sender_id, const std::vector<uint8_t>& payload, uint32_t timestamp, const uint8_t* signature, const uint8_t* public_key) {
    if (!crypto::verify_signature(public_key, payload.data(), payload.size(), signature)) {
        std::cerr << "Message rejected: invalid Ed25519 signature." << std::endl;
        return false;
    }

    if (isReplay(type, sender_id, timestamp)) {
        std::cerr << "Message rejected: replay detected for " << sender_id << " at " << timestamp << std::endl;
        return false;
    }

    size_t max_payload;
    if (type == MessageType::SOS) {
        max_payload = MAX_PAYLOAD_SOS;
    } else if (type == MessageType::CHECK_IN) {
        max_payload = MAX_PAYLOAD_CHECKIN;
    } else {
        max_payload = MAX_PAYLOAD_TRAILMESSAGE;
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
    std::string type_str = (type == MessageType::SOS) ? "SOS" :
                           (type == MessageType::CHECK_IN) ? "CheckIn" : "TrailMessage";
    std::string raw_string = sender_id + ":" + type_str + ":" + std::to_string(timestamp);
    
    uint64_t hash = 5381;
    for (char c : raw_string) {
        hash = ((hash << 5) + hash) + c;
    }
    
    if (type == MessageType::SOS || type == MessageType::CHECK_IN) {
        for (size_t i = 0; i < MAX_SEEN_CRITICAL; ++i) {
            if (seen_critical_hashes[i] == hash) return true;
        }
        seen_critical_hashes[critical_hash_index] = hash;
        critical_hash_index = (critical_hash_index + 1) % MAX_SEEN_CRITICAL;
    } else {
        for (size_t i = 0; i < MAX_SEEN_TRAIL; ++i) {
            if (seen_trail_hashes[i] == hash) return true;
        }
        seen_trail_hashes[trail_hash_index] = hash;
        trail_hash_index = (trail_hash_index + 1) % MAX_SEEN_TRAIL;
    }
    
    return false;
}

} // namespace trailguard
