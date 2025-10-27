// IMPORTANT: Uses ONLY the properties payload. No queries to labour/material tables.

// Re-export new builder and types
export { buildUiRooms, type UiRoom, type Route, type PropertyRow } from './rooms/buildUiRooms';
export { normaliseRouteFromName, areSynonyms, getSynonymsForRoute } from './rooms/names';

// Safe string utilities
export function safeLower(s?: string | null): string {
  return (s && typeof s === 'string') ? s.toLowerCase() : '';
}

export function normalizeLabel(s?: string | null): string {
  return safeLower(s).trim().replace(/\s+/g, ' ');
}

/**
 * @deprecated Use buildUiRooms instead for better type safety and robust joins
 */
export function buildRoomsFromProperties(properties: any): any[] {
  if (!properties) return [];

  const floorplanMin = properties.floorplan_min || [];
  const roomTotals = properties.room_totals || [];
  const roomGroups = properties.room_groups || [];
  const notInFloorplan: any[] = properties.not_in_floorplan || [];
  const primaryImageByRoom: Record<string, string> = properties.primary_image_url_by_room || {};
  const imagesByRoom: Record<string, string[]> = properties.image_urls_by_room || {};

  // Synonym mapping for room matching
  const synonyms: Record<string, string[]> = {
    'sitting room': ['living room', 'lounge'],
    'living room': ['sitting room', 'lounge'],
    'lounge': ['sitting room', 'living room'],
    'wc': ['cloakroom', 'toilet'],
    'cloakroom': ['wc', 'toilet'],
    'toilet': ['wc', 'cloakroom'],
    'hall': ['hallway'],
    'hallway': ['hall'],
  };

  function findMatchingTotal(roomName: string) {
    const normName = normalizeLabel(roomName);

    // Exact match first
    let match = roomTotals.find((rt: any) => normalizeLabel(rt.room_name) === normName);
    if (match) return match;

    // Synonym match
    const roomSynonyms = synonyms[normName] || [];
    match = roomTotals.find((rt: any) => {
      const rtNorm = normalizeLabel(rt.room_name);
      return roomSynonyms.includes(rtNorm) || (synonyms[rtNorm] || []).includes(normName);
    });

    return match || null;
  }

  const rooms: any[] = [];
  const processedRoomNames = new Set<string>();

  // Process floorplan rooms (canonical order)
  for (const fp of floorplanMin || []) {
    const roomName = fp.room_name;
    if (!roomName || processedRoomNames.has(normalizeLabel(roomName))) continue;

    const roomTotal = findMatchingTotal(roomName);
    let primaryImage = primaryImageByRoom[roomName] || null;
    let imageUrls = [...(imagesByRoom[roomName] || [])];

    // Merge room_groups images
    for (const group of roomGroups || []) {
      if (normalizeLabel(group.room_name) === normalizeLabel(roomName)) {
        imageUrls.push(...(group.image_urls || []));
      }
    }

    // Dedupe and set primary
    imageUrls = Array.from(new Set(imageUrls));
    if (!primaryImage && imageUrls.length > 0) primaryImage = imageUrls[0];

    rooms.push({
      room_name: roomName,
      display_name: roomName,
      floor: fp.floor,
      room_type: fp.room_type,
      area_sqm: fp.area_sqm,
      area_sq_ft: fp.area_sq_ft,
      window_count: fp.window_count,
      primary_image: primaryImage,
      image_urls: imageUrls,
      total_with_vat: roomTotal?.total_with_vat || roomTotal?.total_without_vat || 0,
      total_without_vat: roomTotal?.total_without_vat || null,
      is_exterior: false,
    });

    processedRoomNames.add(normalizeLabel(roomName));
  }

  // Process exterior rooms
  for (const ext of notInFloorplan || []) {
    const roomName = ext.room_name || 'Exterior';
    if (!ext.image_urls?.length || processedRoomNames.has(normalizeLabel(roomName))) continue;

    const roomTotal = findMatchingTotal(roomName);

    rooms.push({
      room_name: roomName,
      display_name: roomName,
      floor: null,
      room_type: null,
      area_sqm: null,
      area_sq_ft: null,
      window_count: null,
      primary_image: ext.image_urls[0] || null,
      image_urls: ext.image_urls || [],
      total_with_vat: roomTotal?.total_with_vat || roomTotal?.total_without_vat || 0,
      total_without_vat: roomTotal?.total_without_vat || null,
      is_exterior: true,
    });

    processedRoomNames.add(normalizeLabel(roomName));
  }

  return rooms;
}

/**
 * @deprecated Use buildUiRooms instead for better type safety and robust joins
 */
export function buildRooms(properties: any): any[] {
  return buildRoomsFromProperties(properties);
}

export function formatCurrency(amount: number | null | undefined, decimals = 0): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

export function getTopRoomsByCost(rooms: any[], maxRooms = 5): any[] {
  return rooms
    .filter(r => (r.total_with_vat || r.costWithVat || 0) > 0)
    .sort((a, b) => {
      const aVal = a.total_with_vat || a.costWithVat || 0;
      const bVal = b.total_with_vat || b.costWithVat || 0;
      return bVal - aVal;
    })
    .slice(0, maxRooms);
}
