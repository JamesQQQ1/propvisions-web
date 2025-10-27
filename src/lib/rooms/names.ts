// Route type matching common room categories
export type Route =
  | 'living_room' | 'kitchen' | 'bedroom' | 'bathroom'
  | 'hallway' | 'stairs' | 'roof' | 'garden' | 'facade'
  | 'storage' | 'other';

// Normalize string for comparison
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Synonym mapping: route → array of alternative names
const ROUTE_SYNONYMS: Record<Route, string[]> = {
  living_room: ['lounge', 'reception', 'reception room', 'living room', 'sitting room', 'drawing room'],
  kitchen: ['kitchen', 'kitchenette'],
  bedroom: ['bedroom', 'bed room', 'master bedroom', 'guest bedroom'],
  bathroom: ['bathroom', 'bath room', 'shower room', 'wet room', 'ensuite', 'en-suite'],
  hallway: ['entrance hall', 'hall', 'hallway', 'corridor', 'landing'],
  stairs: ['stairs', 'staircase', 'stairway'],
  roof: ['roof', 'loft', 'attic'],
  garden: ['garden', 'yard', 'back garden', 'front garden', 'rear garden'],
  facade: ['facade', 'front', 'exterior', 'external'],
  storage: ['store', 'storage', 'cupboard', 'utility', 'utility room'],
  other: ['other', 'misc', 'miscellaneous'],
};

// Reverse index: normalized name → route
const NAME_TO_ROUTE_MAP: Map<string, Route> = new Map();
for (const [route, synonyms] of Object.entries(ROUTE_SYNONYMS)) {
  for (const syn of synonyms) {
    NAME_TO_ROUTE_MAP.set(normalize(syn), route as Route);
  }
}

/**
 * Converts a room name to its canonical route.
 * Returns null if no match found.
 *
 * Examples:
 *   normaliseRouteFromName('Reception Room') → 'living_room'
 *   normaliseRouteFromName('Entrance Hall') → 'hallway'
 *   normaliseRouteFromName('Store') → 'storage'
 */
export function normaliseRouteFromName(name: string): Route | null {
  if (!name) return null;
  const normalized = normalize(name);
  return NAME_TO_ROUTE_MAP.get(normalized) || null;
}

/**
 * Gets all synonym names for a given route.
 */
export function getSynonymsForRoute(route: Route): string[] {
  return ROUTE_SYNONYMS[route] || [];
}

/**
 * Checks if two room names are synonyms (map to the same route).
 */
export function areSynonyms(name1: string, name2: string): boolean {
  const route1 = normaliseRouteFromName(name1);
  const route2 = normaliseRouteFromName(name2);
  return route1 !== null && route1 === route2;
}
