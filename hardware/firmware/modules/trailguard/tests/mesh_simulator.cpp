#include <iostream>
#include <vector>
#include <cassert>
#include "../src/TrailGuardModule.h"

using namespace trailguard;

// Simulates Meshtastic's internal radio/mesh transport layer
class MockRadioMesh {
public:
    void registerNode(const std::string& node_id, TrailGuardModule* module) {
        nodes.push_back({node_id, module});
    }
    
    // Transmit a packet from sender to all other nodes in range
    void broadcast(const std::string& sender_id, const std::vector<uint8_t>& payload) {
        std::cout << "\n[MESH] Radio Broadcast from " << sender_id << " (size: " << payload.size() << " bytes)" << std::endl;
        
        for (auto& node : nodes) {
            if (node.id != sender_id) {
                std::cout << "  -> Delivering to " << node.id << std::endl;
                // In Meshtastic, the raw protobuf bytes arrive at the portnum handler
                node.module->onReceive(payload);
            }
        }
    }

private:
    struct NodeEntry {
        std::string id;
        TrailGuardModule* module;
    };
    std::vector<NodeEntry> nodes;
};

void run_phase2_simulation() {
    std::cout << "=== Phase 2: Mesh Simulation ===" << std::endl;
    
    TrailGuardModule node_a;
    TrailGuardModule node_b;
    
    MockRadioMesh mesh;
    mesh.registerNode("node_a", &node_a);
    mesh.registerNode("node_b", &node_b);
    
    // Simulate mobile app connected to Node A via BLE, sending a CheckIn
    std::vector<uint8_t> checkin_payload = {0x01, 0x02, 0x03}; // Mock protobuf bytes
    
    std::cout << "[BLE] Mobile App -> Node A (CheckIn)" << std::endl;
    bool accepted = node_a.enqueueMessage(MessageType::CHECK_IN, "hiker_alice", checkin_payload, 1000);
    assert(accepted);
    
    // Node A processes its tx_queue (adaptive sleep / mesh Tx window opens)
    TrailGuardPacket tx_packet;
    if (node_a.popNextMessage(tx_packet)) {
        // Broadcast over LoRa
        mesh.broadcast("node_a", tx_packet.payload);
    }
    
    // Simulate Node B receiving it, then App on Node B
    std::cout << "[BLE] Node B -> Mobile App (Telemetry/Forwarded Messages)" << std::endl;
    
    std::cout << "=== Simulation Complete ===" << std::endl;
}

int main() {
    run_phase2_simulation();
    return 0;
}
