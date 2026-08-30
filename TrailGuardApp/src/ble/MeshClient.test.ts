import { MeshClient, ConnectionState } from './MeshClient';
import { BleManager } from 'react-native-ble-plx';

jest.mock('react-native-ble-plx', () => {
  return {
    BleManager: jest.fn().mockImplementation(() => {
      return {
        startDeviceScan: jest.fn(),
        stopDeviceScan: jest.fn(),
      };
    }),
  };
});

// Mock the crypto dependencies so the test doesn't crash on import
jest.mock('../crypto/Signer', () => ({
  Signer: {
    signMessage: jest.fn().mockReturnValue(new Uint8Array(64))
  }
}));
jest.mock('../crypto/AckVerifier', () => ({
  verifyAck: jest.fn().mockReturnValue(true)
}));

describe('MeshClient Handoff Logic', () => {
  let client: any;
  let mockManager: any;
  let mockDevice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    client = new MeshClient();
    mockManager = (client as any).manager;
    // mock out connected device
    mockDevice = {
      cancelConnection: jest.fn().mockResolvedValue(undefined),
      readRSSI: jest.fn().mockResolvedValue({ rssi: -90 }),
      onDisconnected: jest.fn()
    };
    client.connectedDevice = mockDevice;
    client.connectionState = ConnectionState.CONNECTED;
    
    // mock establishConnection to resolve successfully
    client.establishConnection = jest.fn().mockResolvedValue({ id: 'new_device' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('RSSI drop below -85 triggers a scan', async () => {
    (client as any).startRssiMonitoring();
    
    // Fast forward to trigger the interval
    await jest.advanceTimersByTimeAsync(3000);
    // Allow promises to resolve
    await Promise.resolve();

    expect(mockDevice.readRSSI).toHaveBeenCalled();
    expect(client.connectionState).toBe(ConnectionState.HANDOFF_IN_PROGRESS);
    expect(mockManager.startDeviceScan).toHaveBeenCalled();
  });

  it('early-exit at > -70 connects immediately', async () => {
    const handoffPromise = (client as any).triggerHandoff();
    await Promise.resolve(); // let the promise executor run
    
    // simulate scan callback with a strong node
    const scanCallback = mockManager.startDeviceScan.mock.calls[0][2];
    scanCallback(null, { name: 'Meshtastic-1234', rssi: -65 });

    await handoffPromise;

    expect(mockManager.stopDeviceScan).toHaveBeenCalled();
    expect(client.establishConnection).toHaveBeenCalledWith(expect.objectContaining({ rssi: -65 }));
  });

  it('a pending ackListener survives a handoff end-to-end', async () => {
    const mockAckCb = jest.fn();
    client.onAck('msg-123', mockAckCb);

    const handoffPromise = (client as any).triggerHandoff();
    await Promise.resolve(); // let the promise executor run

    // simulate scan finding a weak but valid node
    const scanCallback = mockManager.startDeviceScan.mock.calls[0][2];
    scanCallback(null, { name: 'Meshtastic-1234', rssi: -80 });

    // advance past 10s timeout
    await jest.advanceTimersByTimeAsync(10000);
    await handoffPromise;

    // ensure listener is still there
    expect(client.ackListeners.has('msg-123')).toBe(true);
    expect(client.ackListeners.get('msg-123')).toBe(mockAckCb);
  });

  it('prevents a race condition where timeout and early-exit land on the same tick', async () => {
    const handoffPromise = (client as any).triggerHandoff();
    await Promise.resolve();

    const scanCallback = mockManager.startDeviceScan.mock.calls[0][2];
    
    // Simulate both the 10s timeout and a strong scan callback occurring simultaneously
    scanCallback(null, { name: 'Meshtastic-1234', rssi: -65 });
    await jest.advanceTimersByTimeAsync(10000);
    
    await handoffPromise;

    // establishConnection should only be called once, not twice
    expect(client.establishConnection).toHaveBeenCalledTimes(1);
  });
});
