#include <Arduino.h>
#include "TrailGuardModule.h"

trailguard::TrailGuardModule module;

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("=========================================");
    Serial.println("TrailGuard Standalone Module Test");
    Serial.println("=========================================");
    
    // Test telemetry update
    module.updateTelemetry(85.0f, 150.0f);
    
    if (module.shouldDeepSleep()) {
        Serial.println("Module state: DEEP SLEEP (Low Battery)");
    } else {
        Serial.println("Module state: AWAKE (Active/Charging)");
    }

    Serial.println("\n--- Module Initialization Complete ---");
    Serial.println("Listening for mock serial input to test the queue...");
}

void loop() {
    // Just a placeholder loop to simulate ongoing module checks
    if (module.getQueueSize() > 0) {
        trailguard::TrailGuardPacket packet;
        if (module.popNextMessage(packet)) {
            Serial.print("Popped high-priority message from queue. Sender: ");
            Serial.println(packet.sender_id.c_str());
        }
    }

    delay(2000);
}
