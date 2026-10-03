import meshtastic.serial_interface
import time
from pubsub import pub

def on_receive(packet, interface):
    print("COM5 PACKET:", packet)

pub.subscribe(on_receive, "meshtastic.receive")
iface = meshtastic.serial_interface.SerialInterface("COM5")
print("Listening on COM5...")
time.sleep(15)
