import type { Route } from './names';
import { normaliseRouteFromName } from './names';
import type {
  PropertyFloorplanMin,
  PropertyRoomTotal,
  PropertyRoomGroup,
  PropertyNotInFloorplan,
} from '@/types/property';

export type { Route };

export type UiRoom = {
  route: Route;
  displayName: string;
  floor?: string | null;
  areaSqm?: number | null;
  areaSqft?: number | null;
  primaryImageUrl?: string | null;
  imageUrls: string[];
  primaryImageId?: string | null;
  inFloorplan: boolean;
  costWithVat?: number | null;
  costWithoutVat?: number | null;
  source: 'group' | 'floorplan-only' | 'orphaned-image';
  // Legacy fields for backwards compatibility
  room_name?: string;
  display_name?: string;
  area_sqm?: number | null;
  area_sq_ft?: number | null;
  primary_image?: string | null;
  image_urls?: string[];
  total_with_vat?: number;
  total_without_vat?: number | null;
  is_exterior?: boolean;
  room_type?: string | null;
  window_count?: number | null;
};

export interface PropertyRow {
  room_groups?: PropertyRoomGroup[];
  floorplan_min?: PropertyFloorplanMin[];
  room_totals?: PropertyRoomTotal[];
  not_in_floorplan?: PropertyNotInFloorplan[];
  primary_image_url_by_room?: Record<string, string>;
  image_urls_by_room?: Record<string, string[]>;
  images_by_room?: Record<string, any>;
}

// Normalize string for case-insensitive comparison
function normalize(s?: string | null): string {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Build cost indices for efficient lookup
interface CostIndices {
  byImageId: Map<string, PropertyRoomTotal>;
  byRoute: Map<Route, PropertyRoomTotal>;
  byRoomName: Map<string, PropertyRoomTotal>;
}

function buildCostIndices(roomTotals: PropertyRoomTotal[]): CostIndices {
  const byImageId = new Map<string, PropertyRoomTotal>();
  const byRoute = new Map<Route, PropertyRoomTotal>();
  const byRoomName = new Map<string, PropertyRoomTotal>();

  for (const total of roomTotals) {
    // Index by image_id if present
    if (total.image_id) {
      byImageId.set(total.image_id, total);
    }

    // Index by route (via name normalizer)
    const route = normaliseRouteFromName(total.room_name);
    if (route && !byRoute.has(route)) {
      byRoute.set(route, total);
    }

    // Index by normalized room name
    const normalizedName = normalize(total.room_name);
    if (normalizedName && !byRoomName.has(normalizedName)) {
      byRoomName.set(normalizedName, total);
    }
  }

  return { byImageId, byRoute, byRoomName };
}

// Find the best cost match for a room
function findCost(
  indices: CostIndices,
  primaryImageId?: string | null,
  route?: Route | null,
  roomName?: string | null
): { costWithVat?: number | null; costWithoutVat?: number | null } {
  // Priority 1: Match by image_id (most precise)
  if (primaryImageId) {
    const match = indices.byImageId.get(primaryImageId);
    if (match) {
      return {
        costWithVat: match.total_with_vat,
        costWithoutVat: match.total_without_vat,
      };
    }
  }

  // Priority 2: Match by route (handles synonyms)
  if (route) {
    const match = indices.byRoute.get(route);
    if (match) {
      return {
        costWithVat: match.total_with_vat,
        costWithoutVat: match.total_without_vat,
      };
    }
  }

  // Priority 3: Match by normalized room name (fallback)
  if (roomName) {
    const match = indices.byRoomName.get(normalize(roomName));
    if (match) {
      return {
        costWithVat: match.total_with_vat,
        costWithoutVat: match.total_without_vat,
      };
    }
  }

  return { costWithVat: null, costWithoutVat: null };
}

// Find area from floorplan_min with priority matching
function findArea(
  floorplanMin: PropertyFloorplanMin[],
  route: Route,
  floor?: string | null,
  roomName?: string | null
): {
  areaSqm?: number | null;
  areaSqft?: number | null;
  inFloorplan: boolean;
  roomType?: string | null;
  windowCount?: number | null;
} {
  // Priority 1: Match by room_type (route) + floor
  if (floor) {
    const match = floorplanMin.find(
      (fp) =>
        normalize(fp.room_type) === normalize(route.replace('_', ' ')) &&
        normalize(fp.floor) === normalize(floor)
    );
    if (match) {
      return {
        areaSqm: match.area_sqm,
        areaSqft: match.area_sq_ft,
        inFloorplan: true,
        roomType: match.room_type,
        windowCount: match.window_count,
      };
    }
  }

  // Priority 2: Match by room_type (route) only
  const routeMatch = floorplanMin.find(
    (fp) => normalize(fp.room_type) === normalize(route.replace('_', ' '))
  );
  if (routeMatch) {
    return {
      areaSqm: routeMatch.area_sqm,
      areaSqft: routeMatch.area_sq_ft,
      inFloorplan: true,
      roomType: routeMatch.room_type,
      windowCount: routeMatch.window_count,
    };
  }

  // Priority 3: Match by case-insensitive room_name
  if (roomName) {
    const nameMatch = floorplanMin.find(
      (fp) => normalize(fp.room_name) === normalize(roomName)
    );
    if (nameMatch) {
      return {
        areaSqm: nameMatch.area_sqm,
        areaSqft: nameMatch.area_sq_ft,
        inFloorplan: true,
        roomType: nameMatch.room_type,
        windowCount: nameMatch.window_count,
      };
    }
  }

  return { inFloorplan: false };
}

/**
 * Builds UI-ready room data from the property row.
 * Prioritizes room_groups as the primary source, then augments with
 * floorplan_min for areas and room_totals for costs using robust joins.
 */
export function buildUiRooms(property: PropertyRow): UiRoom[] {
  const roomGroups = property.room_groups || [];
  const floorplanMin = property.floorplan_min || [];
  const roomTotals = property.room_totals || [];
  const notInFloorplan = property.not_in_floorplan || [];

  const costIndices = buildCostIndices(roomTotals);
  const rooms: UiRoom[] = [];
  const processedFloorplanIds = new Set<string>();

  // Step 1: Process room_groups (primary source)
  for (const group of roomGroups) {
    const route = (group.route || normaliseRouteFromName(group.room_name) || 'other') as Route;
    const displayName = group.room_name || route.replace('_', ' ');
    const primaryImageUrl = group.primary_image_url || (group.image_urls && group.image_urls[0]) || null;
    const imageUrls = group.image_urls || [];
    const primaryImageId = group.primary_image_id || null;

    // Find area from floorplan
    const areaData = findArea(floorplanMin, route, group.floor, group.room_name);

    // Mark matching floorplan entries as processed
    for (const fp of floorplanMin) {
      if (
        (normalize(fp.room_type) === normalize(route.replace('_', ' '))) ||
        (normalize(fp.room_name) === normalize(group.room_name))
      ) {
        processedFloorplanIds.add(normalize(fp.room_name));
      }
    }

    // Find cost
    const costs = findCost(costIndices, primaryImageId, route, group.room_name);

    const uiRoom: UiRoom = {
      route,
      displayName,
      floor: group.floor || areaData.roomType || null,
      areaSqm: areaData.areaSqm,
      areaSqft: areaData.areaSqft,
      primaryImageUrl,
      imageUrls,
      primaryImageId,
      inFloorplan: areaData.inFloorplan,
      costWithVat: costs.costWithVat,
      costWithoutVat: costs.costWithoutVat,
      source: 'group',
      // Legacy fields for backwards compatibility
      room_name: displayName,
      display_name: displayName,
      area_sqm: areaData.areaSqm,
      area_sq_ft: areaData.areaSqft,
      primary_image: primaryImageUrl,
      image_urls: imageUrls,
      total_with_vat: costs.costWithVat || 0,
      total_without_vat: costs.costWithoutVat,
      is_exterior: false,
      room_type: areaData.roomType,
      window_count: areaData.windowCount,
    };

    rooms.push(uiRoom);
  }

  // Step 2: Add floorplan-only rooms (not in room_groups)
  for (const fp of floorplanMin) {
    if (processedFloorplanIds.has(normalize(fp.room_name))) continue;

    const route = normaliseRouteFromName(fp.room_name || fp.room_type || '') || 'other';
    const displayName = fp.room_name || fp.room_type || 'Unknown Room';
    const costs = findCost(costIndices, null, route, fp.room_name);

    const uiRoom: UiRoom = {
      route,
      displayName,
      floor: fp.floor,
      areaSqm: fp.area_sqm,
      areaSqft: fp.area_sq_ft,
      primaryImageUrl: null,
      imageUrls: [],
      primaryImageId: null,
      inFloorplan: true,
      costWithVat: costs.costWithVat,
      costWithoutVat: costs.costWithoutVat,
      source: 'floorplan-only',
      // Legacy fields
      room_name: displayName,
      display_name: displayName,
      area_sqm: fp.area_sqm,
      area_sq_ft: fp.area_sq_ft,
      primary_image: null,
      image_urls: [],
      total_with_vat: costs.costWithVat || 0,
      total_without_vat: costs.costWithoutVat,
      is_exterior: false,
      room_type: fp.room_type,
      window_count: fp.window_count,
    };

    rooms.push(uiRoom);
    processedFloorplanIds.add(normalize(fp.room_name));
  }

  // Step 3: Add exterior/not-in-floorplan rooms
  for (const ext of notInFloorplan) {
    const route = normaliseRouteFromName(ext.room_name) || 'other';
    const displayName = ext.room_name || 'Exterior';
    const imageUrls = ext.image_urls || [];
    const primaryImageUrl = imageUrls[0] || null;
    const costs = findCost(costIndices, null, route, ext.room_name);

    const uiRoom: UiRoom = {
      route,
      displayName,
      floor: null,
      areaSqm: null,
      areaSqft: null,
      primaryImageUrl,
      imageUrls,
      primaryImageId: null,
      inFloorplan: false,
      costWithVat: costs.costWithVat,
      costWithoutVat: costs.costWithoutVat,
      source: 'group',
      // Legacy fields
      room_name: displayName,
      display_name: displayName,
      area_sqm: null,
      area_sq_ft: null,
      primary_image: primaryImageUrl,
      image_urls: imageUrls,
      total_with_vat: costs.costWithVat || 0,
      total_without_vat: costs.costWithoutVat,
      is_exterior: true,
      room_type: null,
      window_count: null,
    };

    rooms.push(uiRoom);
  }

  return rooms;
}
