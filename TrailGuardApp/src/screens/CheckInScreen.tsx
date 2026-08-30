/**
 * CheckInScreen — signed hiker check-in interface.
 *
 * Status state machine (Phase 5):
 *   idle → sending → sent_unconfirmed → delivered
 *                 └→ error
 *
 * "Delivered" is ONLY set when a verified, gateway-signed Ack is received
 * over BLE. A missing or invalid Ack leaves the UI in "Relay unconfirmed".
 * See AckVerifier.ts and MeshClient.handleAck() for the verification logic.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNode } from '../context/NodeContext';

const MAX_TEXT      = 140;
const ACK_TIMEOUT_MS = 30_000;

type Status = 'idle' | 'sending' | 'sent_unconfirmed' | 'delivered' | 'error';

interface CheckInScreenProps {
  meshClient: {
    sendCheckIn: (hikerId: string, nodeId: string) => Promise<string>;
    onAck:       (messageId: string, cb: (id: string) => void) => void;
    removeAckListener: (messageId: string) => void;
  } | null;
  hikerId: string;
}

export default function CheckInScreen({ meshClient, hikerId }: CheckInScreenProps) {
  const { nodeInfo, isConnected } = useNode();
  const [note, setNote]           = useState('');
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  const pendingMid = useRef<string | null>(null);
  const ackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up listener and timeout on unmount.
  useEffect(() => {
    return () => {
      if (pendingMid.current) meshClient?.removeAckListener(pendingMid.current);
      if (ackTimeout.current) clearTimeout(ackTimeout.current);
    };
  }, [meshClient]);

  async function handleSend() {
    if (!isConnected || !nodeInfo || !meshClient) return;
    setStatus('sending');
    try {
      const mid = await meshClient.sendCheckIn(hikerId, nodeInfo.nodeId as string);
      pendingMid.current = mid;
      setNote('');
      setStatus('sent_unconfirmed');

      // Register Ack listener — callback fires only after gateway sig verified.
      meshClient.onAck(mid, () => {
        if (ackTimeout.current) clearTimeout(ackTimeout.current);
        setStatus('delivered');
      });

      // Timeout — stay in "Relay unconfirmed" if no verified Ack arrives.
      ackTimeout.current = setTimeout(() => {
        meshClient.removeAckListener(mid);
        // Intentionally no state change — silence is not confirmation.
      }, ACK_TIMEOUT_MS);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Unknown error');
      setStatus('error');
    }
  }

  const remaining = MAX_TEXT - note.length;
  const isBusy    = status === 'sending' || status === 'sent_unconfirmed' || status === 'delivered';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Check In</Text>

        {!isConnected && (
          <View style={styles.banner}><Text style={styles.bannerText}>⚠ Not connected to a node</Text></View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Optional note (e.g. 'All good, reached summit')"
          placeholderTextColor="#4a5670"
          maxLength={MAX_TEXT}
          multiline
          value={note}
          onChangeText={setNote}
        />
        <Text style={[styles.counter, remaining < 20 && styles.counterWarn]}>
          {remaining} characters remaining
        </Text>

        {/* ── Status readouts ── */}
        {status === 'sending' && (
          <View style={styles.statusRow}>
            <ActivityIndicator color="#1e64dc" />
            <Text style={styles.statusText}>Sending to node…</Text>
          </View>
        )}
        {status === 'sent_unconfirmed' && (
          <View style={styles.statusRow}>
            <Text style={styles.statusOk}>✓ Sent to node</Text>
            <Text style={styles.statusUnconfirmed}>  Relay unconfirmed — awaiting Ack…</Text>
          </View>
        )}
        {status === 'delivered' && (
          <Text style={styles.statusDelivered}>✅ Delivered — trailhead confirmed receipt</Text>
        )}
        {status === 'error' && (
          <Text style={styles.statusError}>Error: {errorMsg}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!isConnected || isBusy) && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={!isConnected || isBusy}
          accessibilityRole="button"
          accessibilityLabel="Send Check-In"
        >
          <Text style={styles.buttonText}>Send Check-In</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Your check-in will be signed with your device key and relayed to the trailhead.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flexGrow: 1, backgroundColor: '#0f1117', padding: 24, paddingTop: 60 },
  title:             { fontSize: 26, fontWeight: '700', color: '#e0e8ff', marginBottom: 24 },
  banner:            { backgroundColor: '#2e1a00', borderRadius: 8, padding: 10, marginBottom: 16 },
  bannerText:        { color: '#ffaa33', fontSize: 14 },
  input:             { backgroundColor: '#181c2e', borderColor: '#2a3560', borderWidth: 1, borderRadius: 10, color: '#e0e8ff', fontSize: 16, minHeight: 100, padding: 14, textAlignVertical: 'top' },
  counter:           { color: '#4a5670', fontSize: 12, marginTop: 6, textAlign: 'right' },
  counterWarn:       { color: '#ff9900' },
  statusRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  statusText:        { color: '#8898bb', fontSize: 14, marginLeft: 8 },
  statusOk:          { color: '#3dd68c', fontSize: 14, fontWeight: '600' },
  statusUnconfirmed: { color: '#8898bb', fontSize: 12, fontStyle: 'italic' },
  statusDelivered:   { color: '#3dd68c', fontSize: 16, fontWeight: '700', marginTop: 16 },
  statusError:       { color: '#ff6b6b', fontSize: 14, marginTop: 16 },
  button:            { backgroundColor: '#1e64dc', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled:    { backgroundColor: '#1a2a4a', opacity: 0.5 },
  buttonText:        { color: '#fff', fontSize: 17, fontWeight: '700' },
  hint:              { color: '#4a5670', fontSize: 12, marginTop: 16, lineHeight: 18, textAlign: 'center' },
});
