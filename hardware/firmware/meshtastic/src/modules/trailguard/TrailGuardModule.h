#pragma once

#include "mesh/SinglePortModule.h"
#include <queue>
#include <string>
#include <vector>
#include <memory>
#include <array>

namespace trailguard {

enum class MessageType {
    SOS = 0,
    CHECK_IN = 1,
    TRAIL_MESSAGE = 2
};

struct TrailGuardPacket {
    MessageType type;
    std::vector<uint8_t> payload;
    uint32_t timestamp_unix;
    std::string sender_id;

    // For priority queue ordering (lower value = higher priority)
    bool operator<(const TrailGuardPacket& other) const {
        if (type != other.type) {
            // SOS (0) > CHECK_IN (1) > TRAIL_MESSAGE (2)
            return type > other.type; 
        }
        // If same type, FIFO based on timestamp
        return timestamp_unix > other.timestamp_unix;
    }
};

class TrailGuardModule : public SinglePortModule {
public:
    TrailGuardModule();
    virtual ~TrailGuardModule() = default;

    // Node telemetry updates
    void updateTelemetry(float battery_pct, float solar_mw);

    // Determines if the node should enter deep sleep based on power state and queue depth
    bool shouldDeepSleep() const;

    // Enqueues a message for sending over the mesh (now requires Ed25519 signature and pubkey for verification)
    bool enqueueMessage(MessageType type, const std::string& sender_id, const std::vector<uint8_t>& payload, uint32_t timestamp, const uint8_t* signature, const uint8_t* public_key);

    // Pops the highest priority message from the queue (for radio transmission)
    bool popNextMessage(TrailGuardPacket& out_packet);

    // Returns the number of messages pending in the queue
    size_t getQueueSize() const;

protected:
    virtual ProcessMessage handleReceived(const meshtastic_MeshPacket &mp) override;

private:
    // Priority queue for outbound mesh messages
    std::priority_queue<TrailGuardPacket> tx_queue;
    
    // Fixed-size circular buffers for replay protection, partitioned by priority
    static constexpr size_t MAX_SEEN_CRITICAL = 100; // SOS & CheckIn
    static constexpr size_t MAX_SEEN_TRAIL = 200;    // TrailMessages

    std::array<uint64_t, MAX_SEEN_CRITICAL> seen_critical_hashes{};
    size_t critical_hash_index = 0;

    std::array<uint64_t, MAX_SEEN_TRAIL> seen_trail_hashes{};
    size_t trail_hash_index = 0;

    // Telemetry state
    float current_battery_pct = 100.0f;
    float current_solar_mw = 0.0f;

    static constexpr size_t MAX_PAYLOAD_SOS          = 256; // 228 + 28 margin
    static constexpr size_t MAX_PAYLOAD_CHECKIN      = 160; // 128 + 32 margin
    static constexpr size_t MAX_PAYLOAD_TRAILMESSAGE = 140;

    bool isReplay(MessageType type, const std::string& sender_id, uint32_t timestamp);
};

} // namespace trailguard
