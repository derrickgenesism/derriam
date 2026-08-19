/**
 * Haversine formula — calculates great-circle distance between two coordinates.
 * Returns distance in kilometres.
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Known city coordinates — populated from timezone during onboarding.
 * Extend as needed; backend will store real lat/lng per user.
 */
export const CITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  "Africa/Kampala":   { lat: 0.3476,   lon: 32.5825,  label: "Kampala" },
  "Africa/Nairobi":   { lat: -1.2921,  lon: 36.8219,  label: "Nairobi" },
  "Africa/Lagos":     { lat: 6.5244,   lon: 3.3792,   label: "Lagos" },
  "Africa/Accra":     { lat: 5.6037,   lon: -0.1870,  label: "Accra" },
  "Africa/Dar_es_Salaam": { lat: -6.7924, lon: 39.2083, label: "Dar es Salaam" },
  "Europe/London":    { lat: 51.5074,  lon: -0.1278,  label: "London" },
  "Europe/Paris":     { lat: 48.8566,  lon: 2.3522,   label: "Paris" },
  "America/New_York": { lat: 40.7128,  lon: -74.0060, label: "New York" },
  "America/Los_Angeles": { lat: 34.0522, lon: -118.2437, label: "Los Angeles" },
  "Asia/Dubai":       { lat: 25.2048,  lon: 55.2708,  label: "Dubai" },
  "Asia/Kolkata":     { lat: 28.6139,  lon: 77.2090,  label: "Delhi" },
  "Australia/Sydney": { lat: -33.8688, lon: 151.2093, label: "Sydney" },
};

export function distanceBetweenTimezones(tz1: string, tz2: string): number | null {
  const c1 = CITY_COORDS[tz1];
  const c2 = CITY_COORDS[tz2];
  if (!c1 || !c2) return null;
  return haversineKm(c1.lat, c1.lon, c2.lat, c2.lon);
}

export function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1).replace(/\.0$/, "")}k km`;
  return `${km} km`;
}
