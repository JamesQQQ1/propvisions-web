export interface PropertyFloorplanMin {
  room_name: string;
  floor: string | null;
  room_type: string | null;
  area_sqm: number | null;
  area_sq_ft: number | null;
  window_count: number | null;
}

export interface PropertyRoomTotal {
  room_name: string;
  total_with_vat: number | null;
  total_without_vat: number | null;
  labour_total_gbp: number | null;
  materials_total_gbp: number | null;
  image_id?: string | null; // Optional: used for precise cost-to-image joins
}

export interface PropertyRoomGroup {
  route: string; // e.g., 'living_room', 'bedroom', etc.
  room_name: string;
  floor?: string | null;
  image_urls?: string[];
  primary_image_id?: string | null;
  primary_image_url?: string | null;
}

export interface PropertyNotInFloorplan {
  room_name: string;
  image_urls: string[];
}

export interface PropertyData {
  floorplan_min?: PropertyFloorplanMin[];
  room_totals?: PropertyRoomTotal[];
  room_groups?: PropertyRoomGroup[];
  not_in_floorplan?: PropertyNotInFloorplan[];
  primary_image_url_by_room?: Record<string, string>;
  image_urls_by_room?: Record<string, string[]>;
  property_pdf?: string | null;
}