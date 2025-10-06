import type { RoomData, AggregatedRoom } from '@/types/refurb';

export function normalizeRoomIdentity(room: RoomData): string {
  const label = room.floorplan_room_label || room.room_label || '';
  const type = room.room_type || '';

  // Normalize the label
  let normalized = label.toLowerCase().trim().replace(/\s+/g, ' ');

  // Extract bedroom index
  const bedroomMatch = normalized.match(/bed(?:room)?\s*(\d+)/i);
  if (bedroomMatch) {
    return `bedroom_${bedroomMatch[1]}`;
  }

  // Other room type mappings
  if (normalized.includes('sitting') || normalized.includes('lounge') || normalized.includes('living')) {
    return 'sitting_room';
  }

  if (type) {
    return type.toLowerCase().replace(/\s+/g, '_');
  }

  return normalized.replace(/\s+/g, '_') || 'unknown';
}

export function getDisplayName(room: RoomData): string {
  const label = room.floorplan_room_label || room.room_label;
  if (label) return label;

  if (room.room_type) {
    return room.room_type.replace(/[_-]/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }

  return 'Unknown Room';
}

export function groupRoomsByIdentity(rooms: RoomData[]): Map<string, AggregatedRoom> {
  const grouped = new Map<string, AggregatedRoom>();

  rooms.forEach(room => {
    const identity = normalizeRoomIdentity(room);
    const existing = grouped.get(identity);

    if (existing) {
      // Merge room data
      existing.labour_total_gbp += room.labour_total_gbp || 0;
      existing.materials_total_gbp += room.materials_total_gbp || 0;
      existing.total_gbp = room.total_gbp || (existing.labour_total_gbp + existing.materials_total_gbp);
      existing.image_urls.push(...(room.image_urls || []));
    } else {
      const labour = room.labour_total_gbp || 0;
      const materials = room.materials_total_gbp || 0;
      const total = room.total_gbp || (labour + materials);

      grouped.set(identity, {
        identity,
        displayName: getDisplayName(room),
        floor: room.floor,
        room_type: room.room_type,
        labour_total_gbp: labour,
        materials_total_gbp: materials,
        total_gbp: total,
        image_urls: [...(room.image_urls || [])],
        primary_image: room.image_urls?.[0] || null
      });
    }
  });

  // Dedupe images and set primary
  grouped.forEach(room => {
    room.image_urls = Array.from(new Set(room.image_urls));
    room.primary_image = room.image_urls[0] || null;
  });

  return grouped;
}

export function extractRefurbData(property: any): RoomData[] {
  return property?.refurb_totals_by_room ||
         property?.results?.refurb_totals_by_room ||
         property?.refurb_estimates ||
         [];
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