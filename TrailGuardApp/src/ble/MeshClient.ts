/**
 * MeshClient.ts — BLE GATT client for communicating with a TrailGuard node.
 *
 * Phase 5 additions:
 *  - Decodes incoming Ack protobufs from the node's TX characteristic.
 *  - Verifies the Ack Ed25519 signature against the provisioned gateway public key.
 *    A tampered or unsigned Ack is silently dropped — the UI stays in
 *    "Relay unconfirmed" state; "Delivered" is only set on a verified Ack.
 *  - sendCheckIn() and sendSos() now return the message_id string so callers
 *    can match it against incoming Acks.
 *  - onAck() callback lets screens register per-message Ack listeners.
 *
 * IMPORTANT: GATEWAY_PUBLIC_KEY_HEX must be provisioned at build time via
 * dashboard/provisioning.py show-gateway-key before building the app.
 * Until it is set, Ack verification will always fail (safe default).
 */
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Signer } from '../crypto/Signer';
import { trailguard } from '../proto/trailguard';
import { computeMessageId } from '../utils/hashUtils';
import { verifyAck } from '../crypto/AckVerifier';

const SERVICE_UUID    = '12345678-1234-5678-1234-56789abcdef0';
const RX_CHAR_UUID    = '12345678-1234-5678-1234-56789abcdef1';
const TX_CHAR_UUID    = '12345678-1234-5678-1234-56789abcdef2';

/**
 * Gateway Ed25519 public key (32 bytes, hex).
 * Provisioned via: python dashboard/provisioning.py show-gateway-key
 * Set as a build-time constant. An empty string causes all Acks to be rejected
 * (safe: stays in "Relay unconfirmed" rather than falsely showing "Delivered").
 */
export const GATEWAY_PUBLIC_KEY_HEX = '';

type AckCallback = (messageId: string) => void;

export enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  HANDOFF_IN_PROGRESS,
}

export class MeshClient {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private onNodeInfoCallback: ((info: trailguard.NodeInfo) => void) | null = null;
  private ackListeners: Map<string, AckCallback> = new Map();
  
  public connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private rssiInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  /** Scans for a TrailGuard node and connects to it. */
  async connect(): Promise<Device> {
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      throw new Error('Already connected or connecting');
    }
    this.connectionState = ConnectionState.CONNECTING;
    
    return new Promise((resolve, reject) => {
      console.log('Scanning for TrailGuard nodes…');
      this.manager.startDeviceScan(null, null, async (error, device) => {
        if (error) {
          this.manager.stopDeviceScan();
          this.connectionState = ConnectionState.DISCONNECTED;
          reject(error);
          return;
        }
        if (device?.name?.includes('Meshtastic')) {
          this.manager.stopDeviceScan();
          try {
            const connected = await this.establishConnection(device);
            resolve(connected);
          } catch (err) {
            this.connectionState = ConnectionState.DISCONNECTED;
            reject(err);
          }
        }
      });
    });
  }

  private async establishConnection(device: Device): Promise<Device> {
    const connected  = await device.connect();
    const discovered = await connected.discoverAllServicesAndCharacteristics();
    this.connectedDevice = discovered;
    
    // Subscribe to incoming messages
    discovered.monitorCharacteristicForService(
      SERVICE_UUID, TX_CHAR_UUID, (err, char) => this.handleIncoming(err, char)
    );

    // Watch for hard disconnects
    discovered.onDisconnected((err, dev) => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        console.warn(`[MeshClient] Node ${dev.id} disconnected unexpectedly. Triggering handoff...`);
        this.triggerHandoff();
      }
    });

    this.connectionState = ConnectionState.CONNECTED;
    this.startRssiMonitoring();
    
    console.log(`[MeshClient] Connected to ${discovered.name || discovered.id}`);
    return discovered;
  }

  private startRssiMonitoring() {
    this.stopRssiMonitoring();
    this.rssiInterval = setInterval(async () => {
      if (this.connectionState !== ConnectionState.CONNECTED || !this.connectedDevice) return;
      try {
        const device = await this.connectedDevice.readRSSI();
        if (device.rssi !== null && device.rssi < -85) {
          console.log(`[MeshClient] RSSI weak (${device.rssi} dBm). Triggering handoff...`);
          this.triggerHandoff();
        }
      } catch (err) {
        // Read error often implies connection loss
        console.warn(`[MeshClient] Failed to read RSSI. Triggering handoff...`);
        this.triggerHandoff();
      }
    }, 3000);
  }

  private stopRssiMonitoring() {
    if (this.rssiInterval) {
      clearInterval(this.rssiInterval);
      this.rssiInterval = null;
    }
  }

  /**
   * Break-Before-Make handoff logic to find a better node.
   * Disconnects current node, scans for up to 10 seconds.
   *
   * Early-exit: if a node with RSSI > -70 dBm is seen, connect immediately.
   * Timeout path: if only weaker nodes were seen, connect to the strongest one
   *   found rather than falling to DISCONNECTED — a weak link beats no link
   *   when an active SOS Ack may still be in-flight.
   * True empty: if scan finds nothing at all, go DISCONNECTED.
   * Pending ackListeners are preserved across all three paths.
   */
  private async triggerHandoff() {
    if (this.connectionState === ConnectionState.HANDOFF_IN_PROGRESS) return;
    this.connectionState = ConnectionState.HANDOFF_IN_PROGRESS;
    this.stopRssiMonitoring();

    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (e) { /* ignore — device may already be gone */ }
      this.connectedDevice = null;
    }

    console.log('[MeshClient] Handoff: Scanning for new node (10 s)...');
    let bestDevice: Device | null = null;
    let handoffComplete = false; // guard against double-resolve if early-exit races timeout

    return new Promise<void>((resolve) => {
      const scanTimeout = setTimeout(() => {
        this.manager.stopDeviceScan();
        if (handoffComplete) return;
        handoffComplete = true; // Set synchronously

        if (bestDevice) {
          // Connect to the strongest node we found, even if it is weak.
          // During an active SOS a marginal connection is always better than none.
          console.log(`[MeshClient] Handoff timeout: connecting to best found node (RSSI ${bestDevice.rssi} dBm)`);
          this.establishConnection(bestDevice)
            .then(() => { resolve(); })
            .catch(() => {
              console.warn('[MeshClient] Handoff: connection to best node failed. Going DISCONNECTED.');
              this.connectionState = ConnectionState.DISCONNECTED;
              resolve();
            });
        } else {
          console.warn('[MeshClient] Handoff failed: scan timeout with no nodes found. Going DISCONNECTED.');
          this.connectionState = ConnectionState.DISCONNECTED;
          resolve();
        }
      }, 10000);

      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error || handoffComplete) return;
        if (device?.name?.includes('Meshtastic')) {
          // Track the strongest node seen so far
          if (!bestDevice || (device.rssi != null && bestDevice.rssi != null && device.rssi > bestDevice.rssi)) {
            bestDevice = device;
          }
          // Early-exit: strong node found — connect immediately without waiting for timeout
          if (device.rssi != null && device.rssi > -70) {
            clearTimeout(scanTimeout);
            this.manager.stopDeviceScan();
            handoffComplete = true; // Set synchronously
            this.establishConnection(device)
              .then(() => { resolve(); })
              .catch(() => {
                this.connectionState = ConnectionState.DISCONNECTED;
                resolve();
              });
          }
        }
      });
    });
  }


  onNodeInfo(cb: (info: trailguard.NodeInfo) => void) {
    this.onNodeInfoCallback = cb;
  }

  /**
   * Register a callback to be called when a verified Ack matching messageId
   * arrives over BLE. The callback is automatically removed after firing once.
   */
  onAck(messageId: string, cb: AckCallback): void {
    this.ackListeners.set(messageId, cb);
  }

  removeAckListener(messageId: string): void {
    this.ackListeners.delete(messageId);
  }

  // ── Incoming message handler ───────────────────────────────────────────────

  private handleIncoming(error: any, characteristic: Characteristic | null): void {
    if (error || !characteristic?.value) return;

    const buffer = Buffer.from(characteristic.value, 'base64');

    // Try decoding as Ack first (discriminated by proto field presence).
    // In production a discriminating envelope message would be cleaner;
    // for Phase 5 we probe by attempting Ack decode.
    try {
      const ack = trailguard.Ack.decode(buffer);
      if (ack.originalMessageId && ack.signature && ack.signature.length === 64) {
        this.handleAck(ack);
        return;
      }
    } catch {
      // Not an Ack — fall through to NodeInfo.
    }

    try {
      const nodeInfo = trailguard.NodeInfo.decode(buffer);
      this.onNodeInfoCallback?.(nodeInfo);
    } catch (e) {
      console.error('Failed to decode incoming protobuf:', e);
    }
  }

  /**
   * Verifies the gateway signature on the Ack. If valid, fires the
   * corresponding onAck callback (which transitions the UI to "Delivered").
   * If invalid, the message is silently dropped — UI stays in "Relay unconfirmed".
   */
  private handleAck(ack: trailguard.Ack): void {
    const mid       = ack.originalMessageId as string;
    const ackTs     = ack.ackTimestampUnix as number;
    const sigBytes  = ack.signature as Uint8Array;

    const valid = verifyAck(GATEWAY_PUBLIC_KEY_HEX, mid, ackTs, sigBytes);
    if (!valid) {
      console.warn(`[MeshClient] Ack for ${mid} rejected: invalid gateway signature`);
      return;
    }

    console.log(`[MeshClient] Verified Ack received for ${mid}`);
    const cb = this.ackListeners.get(mid);
    if (cb) {
      cb(mid);
      this.ackListeners.delete(mid);
    }
  }

  // ── Send helpers ───────────────────────────────────────────────────────────

  private async writeCharacteristic(payload: Buffer): Promise<void> {
    if (!this.connectedDevice) throw new Error('Not connected to a node');
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      SERVICE_UUID, RX_CHAR_UUID, payload.toString('base64')
    );
  }

  /**
   * Signs and sends a CheckIn message. Returns the message_id for Ack matching.
   */
  async sendCheckIn(hikerId: string, nodeId: string): Promise<string> {
    const ts = Math.floor(Date.now() / 1000);
    const msg = trailguard.CheckIn.create({ hikerId, nodeId, timestampUnix: ts });

    const serialized = trailguard.CheckIn.encode(msg).finish();
    const buf = Buffer.from(serialized.buffer, serialized.byteOffset, serialized.length);
    const sig = Signer.signMessage(buf);
    msg.signature = sig;

    const final = trailguard.CheckIn.encode(msg).finish();
    await this.writeCharacteristic(
      Buffer.from(final.buffer, final.byteOffset, final.length)
    );

    return computeMessageId(hikerId, nodeId, ts);
  }

  /**
   * Signs and sends an SOS. Returns the message_id for Ack matching.
   */
  async sendSos(
    hikerId: string,
    nodeId: string,
    lat: number,
    lon: number,
    message: string,
  ): Promise<string> {
    const ts = Math.floor(Date.now() / 1000);
    const msg = trailguard.SOS.create({
      hikerId, nodeId, timestampUnix: ts,
      hikerLat: lat, hikerLon: lon, message,
    });

    const serialized = trailguard.SOS.encode(msg).finish();
    const buf = Buffer.from(serialized.buffer, serialized.byteOffset, serialized.length);
    const sig = Signer.signMessage(buf);
    msg.signature = sig;

    const final = trailguard.SOS.encode(msg).finish();
    await this.writeCharacteristic(
      Buffer.from(final.buffer, final.byteOffset, final.length)
    );

    return computeMessageId(hikerId, nodeId, ts);
  }
}
