/**
 * Root app entry point.
 *
 * Initialises the Ed25519 Signer, spins up the BLE MeshClient, and wraps
 * the tab navigator in NodeProvider so all screens share node state.
 *
 * Tab layout:
 *   Map     — offline MapLibre tile renderer
 *   Bearing — compass / distance back to node
 *   Check-In — signed check-in
 *   SOS     — signed emergency alert (hold to send)
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NodeProvider, useNode } from './src/context/NodeContext';
import { Signer } from './src/crypto/Signer';
import { MeshClient } from './src/ble/MeshClient';
import MapScreen from './src/screens/MapScreen';
import BearingScreen from './src/screens/BearingScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import SosScreen from './src/screens/SosScreen';

type Tab = 'map' | 'bearing' | 'checkin' | 'sos';

const HIKER_ID = 'hiker_' + Math.random().toString(36).slice(2, 10); // replace with persisted ID

function TrailGuardApp() {
  const { setNodeInfo, setIsConnected, isConnected } = useNode();
  const [tab, setTab] = useState<Tab>('map');
  const [client, setClient] = useState<MeshClient | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'connected' | 'error'>('idle');

  useEffect(() => {
    (async () => {
      await Signer.initialize();
      const mc = new MeshClient();
      mc.onNodeInfo((info) => {
        setNodeInfo(info);
        setIsConnected(true);
        setScanStatus('connected');
      });
      setClient(mc);
    })();
  }, []);

  async function handleConnect() {
    if (!client || scanStatus === 'scanning') return;
    setScanStatus('scanning');
    try {
      await client.connect();
    } catch {
      setScanStatus('error');
    }
  }

  const TAB_DEFS: { key: Tab; label: string; emoji: string }[] = [
    { key: 'map',     label: 'Map',      emoji: '🗺' },
    { key: 'bearing', label: 'Bearing',  emoji: '🧭' },
    { key: 'checkin', label: 'Check In', emoji: '✅' },
    { key: 'sos',     label: 'SOS',      emoji: '🆘' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Connection banner */}
      <View style={styles.header}>
        <Text style={styles.appName}>TrailGuard</Text>
        <TouchableOpacity
          style={[
            styles.connectBtn,
            scanStatus === 'connected' && styles.connectBtnOk,
            scanStatus === 'scanning' && styles.connectBtnScanning,
          ]}
          onPress={handleConnect}
        >
          <Text style={styles.connectBtnText}>
            {scanStatus === 'idle'      ? 'Connect Node' :
             scanStatus === 'scanning'  ? 'Scanning…'   :
             scanStatus === 'connected' ? '✓ Connected'  :
             '⚠ Retry'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen area */}
      <View style={styles.screenArea}>
        {tab === 'map'     && <MapScreen />}
        {tab === 'bearing' && <BearingScreen />}
        {tab === 'checkin' && <CheckInScreen meshClient={client} hikerId={HIKER_ID} />}
        {tab === 'sos'     && <SosScreen     meshClient={client} hikerId={HIKER_ID} />}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TAB_DEFS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NodeProvider>
        <TrailGuardApp />
      </NodeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f1117' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f1117',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e2840',
  },
  appName: { color: '#e0e8ff', fontSize: 18, fontWeight: '700' },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1e2840',
    borderWidth: 1,
    borderColor: '#2a3a60',
  },
  connectBtnOk:       { backgroundColor: '#0d3320', borderColor: '#1a6640' },
  connectBtnScanning: { backgroundColor: '#1e2840', borderColor: '#2a3a60', opacity: 0.6 },
  connectBtnText: { color: '#8898bb', fontSize: 13, fontWeight: '600' },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a0d18',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1e2840',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    opacity: 0.5,
  },
  tabItemActive: { opacity: 1 },
  tabEmoji: { fontSize: 22 },
  tabLabel: { color: '#8898bb', fontSize: 11, marginTop: 3 },
  tabLabelActive: { color: '#e0e8ff' },
});
