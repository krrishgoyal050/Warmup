import fetch from 'node-fetch';
import { config } from '../config';

export interface LocationDetail {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  rating?: number;
  priceLevel?: number;
}

export interface RouteSegment {
  distanceText: string;
  distanceValue: number;
  durationText: string;
  durationValue: number;
  polyline: string;
}

// In-Memory Caching Store for high-efficiency sub-millisecond lookups
const routeCache = new Map<string, RouteSegment>();
const placeCache = new Map<string, LocationDetail[]>();

// Procedural mock coordinates for different destinations to populate stunning maps
const DESTINATION_MOCK_COORDS: Record<string, { lat: number; lng: number; places: LocationDetail[] }> = {
  paris: {
    lat: 48.8566,
    lng: 2.3522,
    places: [
      { name: 'Eiffel Tower', address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris', lat: 48.8584, lng: 2.2945, placeId: 'ch_eiffel', rating: 4.7 },
      { name: 'Louvre Museum', address: 'Rue de Rivoli, 75001 Paris', lat: 48.8606, lng: 2.3376, placeId: 'ch_louvre', rating: 4.8 },
      { name: 'Cathédrale Notre-Dame de Paris', address: '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris', lat: 48.8530, lng: 2.3499, placeId: 'ch_notredame', rating: 4.7 },
      { name: 'Arc de Triomphe', address: 'Pl. Charles de Gaulle, 75008 Paris', lat: 48.8738, lng: 2.2950, placeId: 'ch_arc', rating: 4.7 },
      { name: 'Le Jules Verne', address: 'Eiffel Tower, 2nd floor, Avenue Gustave Eiffel, 75007 Paris', lat: 48.8582, lng: 2.2942, placeId: 'ch_julesverne', rating: 4.5, priceLevel: 4 },
      { name: 'Angelina Paris', address: '226 Rue de Rivoli, 75001 Paris', lat: 48.8626, lng: 2.3278, placeId: 'ch_angelina', rating: 4.4, priceLevel: 3 },
      { name: 'Hotel Regina Louvre', address: '2 Place des Pyramides, 75001 Paris', lat: 48.8631, lng: 2.3315, placeId: 'ch_reginahotel', rating: 4.6 },
    ],
  },
  tokyo: {
    lat: 35.6762,
    lng: 139.6503,
    places: [
      { name: 'Senso-ji Temple', address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032', lat: 35.7148, lng: 139.7967, placeId: 'ch_sensoji', rating: 4.5 },
      { name: 'Tokyo Tower', address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011', lat: 35.6586, lng: 139.7454, placeId: 'ch_tokyotower', rating: 4.4 },
      { name: 'Meiji Jingu Shrine', address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557', lat: 35.6764, lng: 139.6993, placeId: 'ch_meiji', rating: 4.6 },
      { name: 'Shibuya Crossing', address: '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo 150-0043', lat: 35.6595, lng: 139.7005, placeId: 'ch_shibuya', rating: 4.5 },
      { name: 'Ichiran Ramen Shibuya', address: '1 Chome-22-7 Jinnan, Shibuya City, Tokyo 150-0041', lat: 35.6617, lng: 139.7001, placeId: 'ch_ichiran', rating: 4.3, priceLevel: 1 },
      { name: 'Park Hyatt Tokyo', address: '3 Chome-7-1-2 Nishishinjuku, Shinjuku City, Tokyo 163-1055', lat: 35.6856, lng: 139.6908, placeId: 'ch_parkhyatt', rating: 4.7 },
    ],
  },
  newyork: {
    lat: 40.7128,
    lng: -74.0060,
    places: [
      { name: 'Statue of Liberty', address: 'New York, NY 10004', lat: 40.6892, lng: -74.0445, placeId: 'ch_sol', rating: 4.7 },
      { name: 'Empire State Building', address: '20 W 34th St., New York, NY 10001', lat: 40.7484, lng: -73.9857, placeId: 'ch_esb', rating: 4.7 },
      { name: 'Central Park', address: 'New York, NY', lat: 40.7829, lng: -73.9654, placeId: 'ch_centralpark', rating: 4.8 },
      { name: 'Metropolitan Museum of Art', address: '1000 5th Ave, New York, NY 10028', lat: 40.7794, lng: -73.9632, placeId: 'ch_themet', rating: 4.8 },
      { name: 'Eleven Madison Park', address: '11 Madison Ave, New York, NY 10010', lat: 40.7416, lng: -73.9872, placeId: 'ch_elevenmadison', rating: 4.6, priceLevel: 4 },
      { name: 'The Plaza Hotel', address: '768 5th Ave, New York, NY 10019', lat: 40.7644, lng: -73.9744, placeId: 'ch_theplaza', rating: 4.6 },
    ],
  },
};

export const mapsService = {
  // --- PLACES API ---
  async searchPlaces(query: string, category: string): Promise<LocationDetail[]> {
    const cacheKey = `${query.toLowerCase().trim()}_${category.toLowerCase()}`;
    if (placeCache.has(cacheKey)) {
      console.log(`[MAPS CACHE] Cache Hit for place search: "${cacheKey}"`);
      return placeCache.get(cacheKey) || [];
    }

    if (config.googleMaps.isMock) {
      console.log(`[MAPS SERVICE MOCK] Searching places for "${query}" (category: ${category})`);
      const queryLower = query.toLowerCase();
      
      let selectedKey = 'paris'; 
      for (const key of Object.keys(DESTINATION_MOCK_COORDS)) {
        if (queryLower.includes(key)) {
          selectedKey = key;
          break;
        }
      }

      const dest = DESTINATION_MOCK_COORDS[selectedKey];
      let filtered = dest.places;
      if (category === 'hotel') {
        filtered = dest.places.filter(p => p.name.toLowerCase().includes('hotel') || p.name.toLowerCase().includes('plaza') || p.name.toLowerCase().includes('hyatt'));
      } else if (category === 'restaurant') {
        filtered = dest.places.filter(p => p.name.toLowerCase().includes('verne') || p.name.toLowerCase().includes('angelina') || p.name.toLowerCase().includes('ramen') || p.name.toLowerCase().includes('madison'));
      } else if (category === 'attraction') {
        filtered = dest.places.filter(p => !p.name.toLowerCase().includes('hotel') && !p.name.toLowerCase().includes('restaurant') && !p.name.toLowerCase().includes('verne') && !p.name.toLowerCase().includes('ramen'));
      }

      if (filtered.length === 0) {
        filtered = dest.places;
      }

      placeCache.set(cacheKey, filtered);
      return filtered;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + category)}&key=${config.googleMaps.apiKey}`;
      const response = await fetch(url);
      const data = (await response.json()) as { results?: Array<{ name: string; formatted_address: string; geometry: { location: { lat: number; lng: number } }; place_id: string; rating?: number; price_level?: number }> };
      
      if (!data.results) {
        return [];
      }

      const mappedResults = data.results.slice(0, 8).map((p) => ({
        name: p.name,
        address: p.formatted_address,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        placeId: p.place_id,
        rating: p.rating,
        priceLevel: p.price_level,
      }));

      placeCache.set(cacheKey, mappedResults);
      return mappedResults;
    } catch (error) {
      console.error('[MAPS SERVICE ERROR] Places TextSearch API failed:', error);
      return [];
    }
  },

  // --- DIRECTIONS API ---
  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: 'walking' | 'driving' | 'transit' = 'driving'
  ): Promise<RouteSegment> {
    const cacheKey = `${origin.lat},${origin.lng}_${destination.lat},${destination.lng}_${mode}`;
    if (routeCache.has(cacheKey)) {
      console.log(`[MAPS CACHE] Cache Hit for directions: "${cacheKey}"`);
      return routeCache.get(cacheKey) as RouteSegment;
    }

    if (config.googleMaps.isMock) {
      const dx = (destination.lat - origin.lat) * 111; 
      const dy = (destination.lng - origin.lng) * 111 * Math.cos(origin.lat * Math.PI / 180);
      const distanceKm = Math.sqrt(dx * dx + dy * dy);
      const distanceMeters = Math.round(distanceKm * 1000);

      let speedKmh = 40; 
      if (mode === 'walking') speedKmh = 5;
      else if (mode === 'transit') speedKmh = 25;

      const durationSeconds = Math.round((distanceKm / speedKmh) * 3600);
      const polyline = `_p~iF~ps|U_s@~s@_s@_s@`; 

      const result = {
        distanceText: `${distanceKm.toFixed(1)} km`,
        distanceValue: distanceMeters,
        durationText: durationSeconds > 3600 
          ? `${Math.floor(durationSeconds / 3600)} hr ${Math.round((durationSeconds % 3600) / 60)} min`
          : `${Math.round(durationSeconds / 60)} min`,
        durationValue: durationSeconds,
        polyline,
      };

      routeCache.set(cacheKey, result);
      return result;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${config.googleMaps.apiKey}`;
      const response = await fetch(url);
      const data = (await response.json()) as { status: string; routes?: Array<{ legs: Array<{ distance: { text: string; value: number }; duration: { text: string; value: number } }>; overview_polyline: { points: string } }> };

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Directions failed: ${data.status || 'No routes'}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      const result = {
        distanceText: leg.distance.text,
        distanceValue: leg.distance.value,
        durationText: leg.duration.text,
        durationValue: leg.duration.value,
        polyline: route.overview_polyline.points,
      };

      routeCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[MAPS SERVICE ERROR] Directions API failed:', error);
      return {
        distanceText: '1.2 km',
        distanceValue: 1200,
        durationText: '15 mins',
        durationValue: 900,
        polyline: '_p~iF~ps|U',
      };
    }
  },

  // --- DISTANCE MATRIX API ---
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>,
    mode: 'walking' | 'driving' | 'transit' = 'driving'
  ): Promise<Array<{ distanceValue: number; durationValue: number }>> {
    if (config.googleMaps.isMock) {
      const results = [];
      for (let i = 0; i < origins.length; i++) {
        const o = origins[i];
        const d = destinations[i] || destinations[0];
        const route = await this.getRoute(o, d, mode);
        results.push({
          distanceValue: route.distanceValue,
          durationValue: route.durationValue,
        });
      }
      return results;
    }

    try {
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destsStr}&mode=${mode}&key=${config.googleMaps.apiKey}`;
      
      const response = await fetch(url);
      const data = (await response.json()) as { status: string; rows?: Array<{ elements: Array<{ status: string; distance: { value: number }; duration: { value: number } }> }> };

      if (data.status !== 'OK' || !data.rows) {
        throw new Error(`Distance Matrix failed: ${data.status}`);
      }

      const results: Array<{ distanceValue: number; durationValue: number }> = [];
      data.rows.forEach((row) => {
        row.elements.forEach((elem) => {
          if (elem.status === 'OK') {
            results.push({
              distanceValue: elem.distance.value,
              durationValue: elem.duration.value,
            });
          } else {
            results.push({ distanceValue: 1000, durationValue: 600 }); 
          }
        });
      });

      return results;
    } catch (error) {
      console.error('[MAPS SERVICE ERROR] Distance Matrix API failed:', error);
      return origins.map(() => ({ distanceValue: 1500, durationValue: 720 }));
    }
  },
  
  getCityCenterCoords(cityName: string): { lat: number; lng: number } {
    const key = cityName.toLowerCase().replace(/[^a-z]/g, '');
    if (DESTINATION_MOCK_COORDS[key]) {
      return { lat: DESTINATION_MOCK_COORDS[key].lat, lng: DESTINATION_MOCK_COORDS[key].lng };
    }
    return { lat: 48.8566, lng: 2.3522 };
  }
};
