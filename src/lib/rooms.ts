// IMPORTANT: This module uses ONLY the properties payload. Do not query labour/material tables.

export interface FloorplanMin {
  floor: string | null;
  room_name: string;
  room_type: string | null;
  area_sqm: number | null;
  area_sq_ft: number | null;
  window_count: number | null;
}

export interface RoomTotal {
  room_name: string;
  total_with_vat: number | null;
  total_without_vat: number | null;
  labour_total_gbp?: number | null;
  materials_total_gbp?: number | null;
}

export interface RoomGroup {
  room_name: string;
  floor: string | null;
  route: string | null;
  image_urls: string[];
}

export interface UiRoom {
  room_name: string;
  display_name: string;
  floor: string | null;
  room_type: string | null;
  area_sqm: number | null;
  area_sq_ft: number | null;
  window_count: number | null;
  primary_image: string | null;
  image_urls: string[];
  total_with_vat: number;
  total_without_vat: number | null;
  labour_total_gbp: number | null;
  materials_total_gbp: number | null;
  has_cost_split: boolean;
  is_exterior: boolean;
}

// Synonym mapping for room matching
const ROOM_SYNONYMS: Record<string, string[]> = {
  'sitting room': ['living room', 'lounge'],
  'living room': ['sitting room', 'lounge'],
  'lounge': ['sitting room', 'living room'],
  'wc': ['cloakroom', 'toilet'],
  'cloakroom': ['wc', 'toilet'],
  'toilet': ['wc', 'cloakroom'],
  'hall': ['hallway'],
  'hallway': ['hall'],
};

export function normaliseLabel(label: string): string {
  return label.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function isSameRoom(a: string, b: string): boolean {
  const normA = normaliseLabel(a);
  const normB = normaliseLabel(b);

  if (normA === normB) return true;

  // Check synonyms
  const synonymsA = ROOM_SYNONYMS[normA] || [];
  const synonymsB = ROOM_SYNONYMS[normB] || [];

  return synonymsA.includes(normB) || synonymsB.includes(normA);
}

export function findMatchingRoomTotal(roomName: string, roomTotals: RoomTotal[]): RoomTotal | null {
  // First try exact match
  let match = roomTotals.find(rt => normaliseLabel(rt.room_name) === normaliseLabel(roomName));
  if (match) return match;

  // Then try synonym match
  match = roomTotals.find(rt => isSameRoom(rt.room_name, roomName));
  return match || null;
}

export function buildRooms(properties: any): UiRoom[] {
  if (!properties) return [];

  const floorplanMin: FloorplanMin[] = properties.floorplan_min || [];
  const roomTotals: RoomTotal[] = properties.room_totals || [];
  const roomGroups: RoomGroup[] = properties.room_groups || [];
  const notInFloorplan: any[] = properties.not_in_floorplan || [];

  const primaryImageByRoom: Record<string, string> = properties.primary_image_url_by_room || {};
  const imagesByRoom: Record<string, string[]> = properties.image_urls_by_room || {};
  const imagesMap: Record<string, string> = properties.images_map || {};

  const rooms: UiRoom[] = [];
  const processedRoomNames = new Set<string>();

  // Process floorplan rooms first (canonical order)
  for (const fp of floorplanMin) {
    const roomName = fp.room_name;
    if (processedRoomNames.has(normaliseLabel(roomName))) continue;

    // Find matching cost data
    const roomTotal = findMatchingRoomTotal(roomName, roomTotals);

    // Collect images for this room
    let primaryImage = primaryImageByRoom[roomName] || null;
    let imageUrls = [...(imagesByRoom[roomName] || [])];

    // Add room_groups images that match this room
    for (const group of roomGroups) {
      if (isSameRoom(group.room_name, roomName)) {
        imageUrls.push(...(group.image_urls || []));
      }
    }

    // Dedupe images and set primary if not already set
    imageUrls = Array.from(new Set(imageUrls));
    if (!primaryImage && imageUrls.length > 0) {
      primaryImage = imageUrls[0];
    }

    // Build room object
    const totalWithVat = roomTotal?.total_with_vat || 0;
    const totalWithoutVat = roomTotal?.total_without_vat || null;
    const labourTotal = roomTotal?.labour_total_gbp || null;
    const materialsTotal = roomTotal?.materials_total_gbp || null;

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
      total_with_vat: totalWithVat,
      total_without_vat: totalWithoutVat,
      labour_total_gbp: labourTotal,
      materials_total_gbp: materialsTotal,
      has_cost_split: labourTotal !== null || materialsTotal !== null,
      is_exterior: false,
    });

    processedRoomNames.add(normaliseLabel(roomName));
  }

  // Process exterior/other rooms from not_in_floorplan and room_groups
  const exteriorSources = [
    ...notInFloorplan,
    ...roomGroups.filter(g =>
      g.floor === null ||
      ['facade', 'garden', 'other'].includes(g.route || '')
    )
  ];

  for (const ext of exteriorSources) {
    const roomName = ext.room_name || ext.name || 'Exterior';
    if (processedRoomNames.has(normaliseLabel(roomName))) continue;

    const roomTotal = findMatchingRoomTotal(roomName, roomTotals);
    let imageUrls = ext.image_urls || [];
    let primaryImage = imageUrls[0] || null;

    if (imageUrls.length > 0) {
      const totalWithVat = roomTotal?.total_with_vat || 0;
      const totalWithoutVat = roomTotal?.total_without_vat || null;
      const labourTotal = roomTotal?.labour_total_gbp || null;
      const materialsTotal = roomTotal?.materials_total_gbp || null;

      rooms.push({
        room_name: roomName,
        display_name: roomName === 'Exterior' ? 'Exterior' : roomName,
        floor: null,
        room_type: null,
        area_sqm: null,
        area_sq_ft: null,
        window_count: null,
        primary_image: primaryImage,
        image_urls: imageUrls,
        total_with_vat: totalWithVat,
        total_without_vat: totalWithoutVat,
        labour_total_gbp: labourTotal,
        materials_total_gbp: materialsTotal,
        has_cost_split: labourTotal !== null || materialsTotal !== null,
        is_exterior: true,
      });

      processedRoomNames.add(normaliseLabel(roomName));
    }
  }

  return rooms;
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

// Chart helper: get top rooms by cost
export function getTopRoomsByCost(rooms: UiRoom[], maxRooms = 5): UiRoom[] {
  return rooms
    .filter(r => r.total_with_vat > 0)
    .sort((a, b) => b.total_with_vat - a.total_with_vat)
    .slice(0, maxRooms);
}

// Chart helper: check if any rooms have cost split data
export function hasAnyCostSplit(rooms: UiRoom[]): boolean {
  return rooms.some(r => r.has_cost_split);
}