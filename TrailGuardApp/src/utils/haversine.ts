/**
 * Haversine formula to calculate great-circle distance (metres) and
 * initial bearing (degrees, 0–360) from point A to point B.
 */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceM: number; bearingDeg: number } {
  const R = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const distanceM = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearingDeg = ((θ * 180) / Math.PI + 360) % 360;

  return { distanceM, bearingDeg };
}

/** Format metres into a human-readable string (m / km). */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

/** Convert decimal degrees bearing to compass cardinal / intercardinal label. */
export function bearingLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return dirs[Math.round(deg / 45)];
}
