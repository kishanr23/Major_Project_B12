/**
 * BearingScreen — computes and displays the great-circle bearing and distance
 * from the hiker's current GPS fix to the nearest connected node.
 *
 * Location is polled at 2-second intervals using expo-location.
 * GPS accuracy radius is shown so the hiker understands fix quality.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useNode } from '../context/NodeContext';
import { haversine, formatDistance, bearingLabel } from '../utils/haversine';

export default function BearingScreen() {
  const { nodeInfo, isConnected } = useNode();
  const [gps, setGps] = useState<Location.LocationObject | null>(null);
  const [permError, setPermError] = useState(false);

  // Animated value drives the compass needle rotation.
  const needleAngle = useRef(new Animated.Value(0)).current;
  const lastBearing = useRef(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermError(true);
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (location) => setGps(location)
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  // Animate the needle whenever GPS or node position updates.
  useEffect(() => {
    if (!gps || !nodeInfo) return;
    const { bearingDeg } = haversine(
      gps.coords.latitude,
      gps.coords.longitude,
      nodeInfo.latitude as number,
      nodeInfo.longitude as number,
    );

    // Animate through shortest arc.
    const delta = ((bearingDeg - lastBearing.current + 540) % 360) - 180;
    const targetAngle = lastBearing.current + delta;
    lastBearing.current = bearingDeg;

    Animated.timing(needleAngle, {
      toValue: targetAngle,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [gps, nodeInfo]);

  const needleRotation = needleAngle.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Derived values
  const derived = (() => {
    if (!gps || !nodeInfo) return null;
    const { distanceM, bearingDeg } = haversine(
      gps.coords.latitude,
      gps.coords.longitude,
      nodeInfo.latitude as number,
      nodeInfo.longitude as number,
    );
    return {
      distanceStr: formatDistance(distanceM),
      bearing: Math.round(bearingDeg),
      cardinal: bearingLabel(bearingDeg),
      accuracy: Math.round(gps.coords.accuracy ?? 0),
    };
  })();

  if (permError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Location permission denied.{'\n'}Enable in Settings to use bearing.
        </Text>
      </View>
    );
  }

  if (!isConnected || !nodeInfo) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>Connect to a node first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Back to Trail</Text>
      <Text style={styles.nodeName}>📡 {nodeInfo.nodeId}</Text>

      {/* Compass */}
      <View style={styles.compassRing}>
        <Text style={styles.compassN}>N</Text>
        <Animated.View style={[styles.needle, { transform: [{ rotate: needleRotation }] }]}>
          <View style={styles.needleHead} />
          <View style={styles.needleTail} />
        </Animated.View>
      </View>

      {/* Readout */}
      {!derived ? (
        <ActivityIndicator size="large" color="#1e64dc" style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.readout}>
          <Text style={styles.bigDistance}>{derived.distanceStr}</Text>
          <Text style={styles.bearing}>
            {derived.bearing}° {derived.cardinal}
          </Text>
          <Text style={styles.accuracy}>GPS accuracy ±{derived.accuracy} m</Text>
        </View>
      )}
    </View>
  );
}

const RING = 220;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { fontSize: 22, fontWeight: '700', color: '#e0e8ff', marginBottom: 4 },
  nodeName: { fontSize: 14, color: '#8898bb', marginBottom: 36 },
  compassRing: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: '#1e64dc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181c2e',
  },
  compassN: {
    position: 'absolute',
    top: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#6c88dd',
  },
  needle: {
    width: 4,
    height: RING * 0.72,
    alignItems: 'center',
  },
  needleHead: {
    flex: 1,
    width: 4,
    backgroundColor: '#ff4d4d',
    borderRadius: 2,
  },
  needleTail: {
    flex: 1,
    width: 4,
    backgroundColor: '#3a4a80',
    borderRadius: 2,
  },
  readout: { marginTop: 40, alignItems: 'center' },
  bigDistance: { fontSize: 44, fontWeight: '800', color: '#e0e8ff' },
  bearing: { fontSize: 22, color: '#6c88dd', marginTop: 6 },
  accuracy: { fontSize: 13, color: '#4a5670', marginTop: 8 },
  subtitle: { fontSize: 16, color: '#8898bb' },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', lineHeight: 24 },
});
