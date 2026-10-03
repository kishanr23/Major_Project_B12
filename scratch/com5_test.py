import time
import meshtastic.serial_interface
import sys

print("Connecting to COM5...")
try:
    iface = meshtastic.serial_interface.SerialInterface(devPath="COM5")
    print("Sending text to COM4 over LoRa...")
    iface.sendText("TG:test_packet_over_lora", channelIndex=0)
    print("Sent. Waiting 5 seconds for flush...")
    time.sleep(5)
    iface.close()
    print("Done.")
except Exception as e:
    print(f"Error: {e}")
