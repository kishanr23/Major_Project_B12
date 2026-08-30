/**
 * SosScreen — emergency SOS interface.
 *
 * Status state machine (Phase 5):
 *   idle → holding → sending → sent_unconfirmed → delivered
 *                                              └→ error
 *
 * "Delivered" is ONLY set when a verified, gateway-signed Ack is received
 * over BLE. A missing or invalid Ack leaves the UI in "Relay unconfirmed".
 * See AckVerifier.ts and MeshClient.handleAck() for the verification logic.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Animated, Easing, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Signer } from '../crypto/Signer';
import { useNode } from '../context/NodeContext';

const MAX_TEXT = 140;
const HOLD_MS  = 3000;
const ACK_TIMEOUT_MS = 30_000; // give up waiting for Ack after 30 s

type Status = 'idle' | 'holding' | 'sending' | 'sent_unconfirmed' | 'delivered' | 'error';

interface SosScreenProps {
  meshClient: {
    sendSos: (hikerId: string, nodeId: string, lat: number, lon: number, message: string) => Promise<string>;
    onAck:   (messageId: string, cb: (id: string) => void) => void;
    removeAckListener: (messageId: string) => void;
  } | null;
  hikerId: string;
}

export default function SosScreen({ meshClient, hikerId }: SosScreenProps) {
  const { nodeInfo, isConnected } = useNode();
  const [message, setMessage]     = useState('');
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [gps, setGps]             = useState<{ lat: number; lon: number } | null>(null);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdAnim     = useRef<Animated.CompositeAnimation | null>(null);
  const pendingMid   = useRef<string | null>(null);
  const ackTimeout   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
        setGps({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      } catch { /* GPS optional */ }
    })();
  }, []);

  // Clean up Ack listener and timeout on unmount.
  useEffect(() => {
    return () => {
      if (pendingMid.current) meshClient?.removeAckListener(pendingMid.current);
      if (ackTimeout.current) clearTimeout(ackTimeout.current);
    };
  }, [meshClient]);

  function startHold() {
    if (status === 'sending' || status === 'sent_unconfirmed' || status === 'delivered') return;
    setStatus('holding');
    holdAnim.current = Animated.timing(holdProgress, {
      toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => { if (finished) sendSos(); });
  }

  function cancelHold() {
    holdAnim.current?.stop();
    holdProgress.setValue(0);
    if (status === 'holding') setStatus('idle');
  }

  async function sendSos() {
    if (!isConnected || !nodeInfo || !meshClient) {
      setStatus('error'); setErrorMsg('Not connected to a node'); return;
    }
    setStatus('sending');
    try {
      const mid = await meshClient.sendSos(
        hikerId, nodeInfo.nodeId as string, gps?.lat ?? 0, gps?.lon ?? 0, message,
      );
      pendingMid.current = mid;
      setStatus('sent_unconfirmed');

      // Register Ack listener — fires only when gateway signature is verified.
      meshClient.onAck(mid, () => {
        if (ackTimeout.current) clearTimeout(ackTimeout.current);
        setStatus('delivered');
      });

      // Timeout — give up waiting; UI stays in "Relay unconfirmed".
      ackTimeout.current = setTimeout(() => {
        meshClient.removeAckListener(mid);
        // Status stays 'sent_unconfirmed' — no silent upgrade to delivered.
      }, ACK_TIMEOUT_MS);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Unknown error');
      setStatus('error');
    }
  }

  const barWidth  = holdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const remaining = MAX_TEXT - message.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🆘 SOS</Text>
        <Text style={styles.subtitle}>Sends a signed emergency alert to the trailhead via the node mesh.</Text>

        {!isConnected && (
          <View style={styles.banner}><Text style={styles.bannerText}>⚠ Not connected to a node</Text></View>
        )}

        {gps
          ? <Text style={styles.gpsStatus}>📍 GPS fix: {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}</Text>
          : <Text style={styles.gpsStatus}>📍 Acquiring GPS…</Text>
        }

        <TextInput
          style={styles.input}
          placeholder="Optional message (e.g. 'Broken leg, south ridge')"
          placeholderTextColor="#5a3333"
          maxLength={MAX_TEXT}
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <Text style={[styles.counter, remaining < 20 && styles.counterWarn]}>
          {remaining} characters remaining
        </Text>

        {/* ── Status readouts ── */}
        {status === 'sending' && (
          <View style={styles.statusRow}>
            <ActivityIndicator color="#ff4d4d" />
            <Text style={styles.statusText}>Sending SOS…</Text>
          </View>
        )}
        {status === 'sent_unconfirmed' && (
          <View>
            <Text style={styles.statusOk}>✓ Sent to node</Text>
            <Text style={styles.statusUnconfirmed}>Relay to trailhead unconfirmed — awaiting Ack…</Text>
          </View>
        )}
        {status === 'delivered' && (
          <View>
            <Text style={styles.statusDelivered}>✅ Delivered — trailhead confirmed receipt</Text>
          </View>
        )}
        {status === 'error' && (
          <Text style={styles.statusError}>Error: {errorMsg}</Text>
        )}

        {/* ── Hold-to-confirm button (only shown when actionable) ── */}
        {(status === 'idle' || status === 'holding') && (
          <View style={styles.holdButtonContainer}>
            <TouchableOpacity
              style={styles.holdButton}
              onPressIn={startHold}
              onPressOut={cancelHold}
              disabled={!isConnected}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Hold to send SOS"
            >
              <Animated.View style={[StyleSheet.absoluteFill, styles.holdFill, { width: barWidth }]} />
              <Text style={styles.holdText}>
                {status === 'holding' ? 'Keep holding…' : 'Hold 3 s to send SOS'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.holdHint}>Release to cancel</Text>
          </View>
        )}

        <Text style={styles.legalNote}>
          Only send a real SOS in a genuine emergency. False alerts waste ranger resources.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flexGrow: 1, backgroundColor: '#110808', padding: 24, paddingTop: 60 },
  title:           { fontSize: 32, fontWeight: '800', color: '#ff4d4d', marginBottom: 6 },
  subtitle:        { fontSize: 14, color: '#a05050', marginBottom: 20, lineHeight: 20 },
  banner:          { backgroundColor: '#2e1a00', borderRadius: 8, padding: 10, marginBottom: 16 },
  bannerText:      { color: '#ffaa33', fontSize: 14 },
  gpsStatus:       { color: '#886060', fontSize: 13, marginBottom: 16 },
  input:           { backgroundColor: '#1e0e0e', borderColor: '#5a2020', borderWidth: 1, borderRadius: 10, color: '#ffcece', fontSize: 16, minHeight: 80, padding: 14, textAlignVertical: 'top' },
  counter:         { color: '#5a3333', fontSize: 12, marginTop: 6, textAlign: 'right' },
  counterWarn:     { color: '#ff9900' },
  statusRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  statusText:      { color: '#a05050', fontSize: 14, marginLeft: 8 },
  statusOk:        { color: '#ff6b6b', fontSize: 16, fontWeight: '700', marginTop: 16 },
  statusUnconfirmed: { color: '#7a4040', fontSize: 12, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
  statusDelivered: { color: '#3dd68c', fontSize: 16, fontWeight: '700', marginTop: 16 },
  statusError:     { color: '#ff6b6b', fontSize: 14, marginTop: 16 },
  holdButtonContainer: { marginTop: 32 },
  holdButton:      { height: 64, borderRadius: 12, backgroundColor: '#3a0a0a', borderWidth: 2, borderColor: '#ff4d4d', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  holdFill:        { backgroundColor: '#ff4d4d33', height: '100%' },
  holdText:        { color: '#ff4d4d', fontSize: 16, fontWeight: '700', zIndex: 1 },
  holdHint:        { color: '#5a3333', fontSize: 12, textAlign: 'center', marginTop: 8 },
  legalNote:       { color: '#4a2020', fontSize: 12, marginTop: 28, textAlign: 'center', lineHeight: 18 },
});
