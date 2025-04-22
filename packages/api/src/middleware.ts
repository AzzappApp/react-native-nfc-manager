import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Handle both /graphql and /api/graphql paths
  if (nextUrl.pathname === '/graphql') {
    const latitude = parseFloat(
      request.headers.get('x-vercel-ip-latitude') || '',
    );
    const longitude = parseFloat(
      request.headers.get('x-vercel-ip-longitude') || '',
    );

    if (!isNaN(latitude) && !isNaN(longitude)) {
      // Trouver la région la plus proche
      let closestRegion: string | null = null;
      let shortestDistance = Infinity;

      for (const region of REGIONS) {
        const distance = haversine(
          latitude,
          longitude,
          region.latitude,
          region.longitude,
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestRegion = region.name;
        }
      }
      if (closestRegion && NODE_JS_REGIONS.includes(closestRegion)) {
        return NextResponse.rewrite(new URL(`/graphql/node`, request.url));
      }
    }
    return NextResponse.rewrite(new URL(`/graphql/edge`, request.url));
  }

  return undefined;
}

export const config = {
  matcher: ['/graphql'],
};

// Fonction pour calculer la distance entre deux points (Haversine)
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Liste des régions avec leurs coordonnées
const REGIONS = [
  { name: 'fra1', latitude: 50.1109, longitude: 8.6821 }, // Francfort
  { name: 'iad1', latitude: 38.9445, longitude: -77.4558 }, // Virginie
  { name: 'pdx1', latitude: 45.5234, longitude: -122.6762 }, // Portland
  { name: 'gru1', latitude: -23.5505, longitude: -46.6333 }, // São Paulo
  { name: 'sin1', latitude: 1.3521, longitude: 103.8198 }, // Singapour
] as const;

// Liste des régions Node.js
const NODE_JS_REGIONS = ['fra1', 'iad1', 'gru1'];
