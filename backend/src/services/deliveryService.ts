import https from 'https';
import { URL } from 'url';

export const DELIVERY_ORIGIN = {
  label: 'Jackson Heights base',
  address: process.env.DELIVERY_ORIGIN_ADDRESS || '37-68 74th St, Jackson Heights, NY 11372',
  latitude: Number(process.env.DELIVERY_ORIGIN_LATITUDE || 40.7489),
  longitude: Number(process.env.DELIVERY_ORIGIN_LONGITUDE || -73.885)
};

export interface DeliveryPoint {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeId?: string;
  provider?: string;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
}

const GOOGLE_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

const requestJson = (urlString: string, options: https.RequestOptions, body?: unknown): Promise<any> => new Promise((resolve, reject) => {
  const url = new URL(urlString);
  const req = https.request({ ...options, hostname: url.hostname, path: `${url.pathname}${url.search}`, protocol: url.protocol }, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        if ((res.statusCode || 500) >= 400) return reject(new Error(`Routing provider HTTP ${res.statusCode}`));
        resolve(parsed);
      } catch (error) { reject(error); }
    });
  });
  req.on('error', reject);
  if (body !== undefined) req.write(JSON.stringify(body));
  req.end();
});

const secondsFromDuration = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const match = String(value || '').match(/^([0-9.]+)s$/);
  return match ? Math.round(Number(match[1])) : 0;
};

export const addressText = (address: { street: string; city: string; state: string; zipCode: string; country?: string }) =>
  [address.street, address.city, address.state, address.zipCode, address.country || 'USA'].filter(Boolean).join(', ');

export const haversineMeters = (a: DeliveryPoint, b: DeliveryPoint): number => {
  const radius = 6371000;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
};

export const approximatePointForAddress = (address: { city?: string; state?: string; zipCode?: string }): DeliveryPoint | null => {
  const city = `${address.city || ''} ${address.zipCode || ''}`.toLowerCase();
  if (city.includes('bronx') || /^104/.test(address.zipCode || '')) return { latitude: 40.8525, longitude: -73.8654, provider: 'borough-estimate' };
  if (city.includes('manhattan') || /^10[01]/.test(address.zipCode || '')) return { latitude: 40.7831, longitude: -73.9712, provider: 'borough-estimate' };
  if (city.includes('brooklyn') || /^112/.test(address.zipCode || '')) return { latitude: 40.6782, longitude: -73.9442, provider: 'borough-estimate' };
  if (city.includes('queens') || /^11/.test(address.zipCode || '')) return { latitude: 40.7282, longitude: -73.7949, provider: 'borough-estimate' };
  if (city.includes('staten') || /^103/.test(address.zipCode || '')) return { latitude: 40.5795, longitude: -74.1502, provider: 'borough-estimate' };
  return null;
};

export const geocodeAddress = async (address: string): Promise<DeliveryPoint | null> => {
  if (!GOOGLE_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(GOOGLE_KEY)}`;
  const response = await requestJson(url, { method: 'GET' });
  const result = response?.results?.[0];
  if (!result?.geometry?.location) return null;
  return {
    latitude: Number(result.geometry.location.lat),
    longitude: Number(result.geometry.location.lng),
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
    provider: 'google-geocoding'
  };
};

export const calculateDirectRoute = async (origin: DeliveryPoint, destination: DeliveryPoint): Promise<RouteLeg> => {
  if (GOOGLE_KEY) {
    try {
      const response = await requestJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
        }
      }, {
        origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
        destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE'
      });
      const route = response?.routes?.[0];
      if (route) return { distanceMeters: Number(route.distanceMeters || 0), durationSeconds: secondsFromDuration(route.duration) };
    } catch {
      // Use the deterministic local fallback below when Google is not enabled or rejects the key.
    }
  }
  const straightLine = haversineMeters(origin, destination);
  return { distanceMeters: Math.round(straightLine * 1.35), durationSeconds: Math.max(300, Math.round(straightLine * 1.35 / 7.5)) };
};

export const optimizeRoute = async (origin: DeliveryPoint, stops: DeliveryPoint[]) => {
  if (GOOGLE_KEY && stops.length > 0) {
    try {
      const response = await requestJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.optimizedIntermediateWaypointIndex'
        }
      }, {
        origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
        destination: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
        intermediates: stops.map(point => ({ location: { latLng: { latitude: point.latitude, longitude: point.longitude } } })),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        optimizeWaypointOrder: true
      });
      const route = response?.routes?.[0];
      if (route) return {
        order: Array.isArray(route.optimizedIntermediateWaypointIndex) ? route.optimizedIntermediateWaypointIndex.map(Number) : stops.map((_, index) => index),
        totalDistanceMeters: Number(route.distanceMeters || 0),
        totalDurationSeconds: secondsFromDuration(route.duration),
        provider: 'google-routes'
      };
    } catch {
      // fallback below
    }
  }

  const remaining = stops.map((point, index) => ({ point, index }));
  const order: number[] = [];
  let current = origin;
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  while (remaining.length) {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const distance = haversineMeters(current, candidate.point);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    const next = remaining.splice(best, 1)[0];
    order.push(next.index);
    const leg = await calculateDirectRoute(current, next.point);
    totalDistanceMeters += leg.distanceMeters;
    totalDurationSeconds += leg.durationSeconds;
    current = next.point;
  }
  const returnLeg = await calculateDirectRoute(current, origin);
  totalDistanceMeters += returnLeg.distanceMeters;
  totalDurationSeconds += returnLeg.durationSeconds;
  return { order, totalDistanceMeters, totalDurationSeconds, provider: 'local-nearest-neighbor' };
};

export const mapsNavigationUrl = (origin: string, destinations: string[]) => {
  const params = new URLSearchParams({ api: '1', origin, destination: destinations[destinations.length - 1] || origin });
  if (destinations.length > 1) params.set('waypoints', destinations.slice(0, -1).join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
