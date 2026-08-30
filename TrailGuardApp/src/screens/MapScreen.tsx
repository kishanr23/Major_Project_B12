/**
 * MapScreen — renders the offline MBTiles trail map via MapLibre GL Native.
 *
 * Uses @maplibre/maplibre-react-native v10+ API (named exports):
 *   Map, Camera (initialViewState), RasterSource (tiles), Layer (source),
 *   Marker (lngLat), UserLocation (animated / accuracy)
 *
 * The MBTiles file must be placed at:
 *   Android: android/app/src/main/assets/trail.mbtiles
 *   iOS:     ios/<AppName>/trail.mbtiles  (added to Xcode "Copy Bundle Resources")
 *
 * Tiles are served via the MapLibre mbtiles:// scheme, giving full offline
 * operation with no network dependency at runtime.
 */
import React, { useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import {
  Map,
  Camera,
  RasterSource,
  Layer,
  Marker,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import type { MapRef, LngLat } from '@maplibre/maplibre-react-native';
import { useNode } from '../context/NodeContext';

/** Platform-appropriate URI fragment for the bundled MBTiles asset. */
const MBTILES_PATH =
  Platform.OS === 'android'
    ? 'asset://trail.mbtiles'
    : 'trail.mbtiles';

/** Inline MapLibre style JSON — offline raster tiles only, no network. */
const OFFLINE_STYLE = JSON.stringify({
  version: 8,
  sources: {},
  layers: [],
});

const DEFAULT_CENTER: LngLat = [0, 0];
const DEFAULT_ZOOM = 10;
const NODE_ZOOM = 14;

export default function MapScreen() {
  const mapRef = useRef<MapRef>(null);
  const { nodeInfo } = useNode();

  const hasNode = nodeInfo != null;
  const nodeLon  = hasNode ? (nodeInfo.longitude as number) : 0;
  const nodeLat  = hasNode ? (nodeInfo.latitude  as number) : 0;
  const nodeLngLat: LngLat = [nodeLon, nodeLat];

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        style={styles.map}
        mapStyle={OFFLINE_STYLE}
      >
        {/* Camera — positions to the node coordinate on first render. */}
        <Camera
          initialViewState={{
            center: hasNode ? nodeLngLat : DEFAULT_CENTER,
            zoom: hasNode ? NODE_ZOOM : DEFAULT_ZOOM,
          }}
        />

        {/* Offline raster tile overlay from MBTiles file. */}
        <RasterSource
          id="trail-source"
          tiles={[`mbtiles://${MBTILES_PATH}`]}
          tileSize={256}
        >
          <Layer
            id="trail-layer"
            type="raster"
            source="trail-source"
          />
        </RasterSource>

        {/* Node pin */}
        {hasNode && (
          <Marker id="node-marker" lngLat={nodeLngLat}>
            <View style={styles.nodeMarker}>
              <Text style={styles.nodeMarkerText}>📡</Text>
            </View>
          </Marker>
        )}

        {/* User location dot (no prop needed — defaults show accuracy ring). */}
        <UserLocation animated accuracy />
      </Map>

      {/* HUD overlay — pointer-events none so map stays interactive. */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.hudText}>
          {hasNode ? `📡 ${nodeInfo?.nodeId}` : 'No node connected'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  nodeMarker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,100,220,0.15)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1e64dc',
  },
  nodeMarkerText: { fontSize: 20 },
  hud: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hudText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
