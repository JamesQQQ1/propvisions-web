export type MaterialLine = {
    job_line_id: string | null;
    item_key: string;
    unit: string;
    qty: number;
    unit_price_material_gbp: number;
    subtotal_gbp: number;
    waste_pct: number;
    units_to_buy: number;
    notes: string;
    assumed_area_m2: number;
    confidence: number | null;
  };
  
  export type LabourLine = {
    job_line_id: string | null;
    trade_key: string;
    total_hours: number;
    crew_size: number;
    hourly_rate_gbp: number;
    labour_cost_gbp: number;
    ai_confidence: number | null;
    notes: string;
  };
  
  export type RefurbRoom = {
    room_type: string;
    image_id: string | null;
    image_index: number | null;
    materials: MaterialLine[];
    labour: LabourLine[];
    materials_total_gbp: number;
    labour_total_gbp: number;
    room_total_gbp: number;
    room_confidence: number | null;
  };
  
  export type RefurbSummary = {
    materials_total_gbp: number;
    labour_total_gbp: number;
    grand_total_gbp: number;
  };
  
  export type RefurbPayload = {
    // overview
    property_title?: string;
    address?: string;
    postcode?: string;
    property_type?: string;
    tenure?: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    receptions?: number | null;
  
    price_label: string;
    price_gbp: number;
  
    auction_date?: string;
    lot_number?: string;
    listing_url?: string;
  
    agent_name?: string;
    agent_phone?: string;
    agent_email?: string;
  
    monthly_rent_gbp?: number;
    annual_rent_gbp?: number;
  
    estimated_value_gbp?: number;
    explanation?: string;
  
    stamp_duty_gbp?: number;
    legal_fees_gbp?: number;
    survey_fees_gbp?: number;
    insurance_annual_gbp?: number;
    management_fees_gbp?: number;
    refurbishment_contingency_gbp?: number;
    total_investment_gbp?: number;
    annual_net_income_gbp?: number;
    roi_percent?: number;
  
    // media
    hero_image_url?: string | null;
    listing_images?: string[];
    floorplan_urls?: string[];
  
    // refurb
    refurb_estimates: RefurbRoom[];
    refurb_summary: RefurbSummary;
  
    // optional meta
    pdf_meta?: {
      generated_at_iso?: string;
      version?: string;
      currency?: 'GBP' | string;
      property_id?: string | null;
      address_line?: string | null;
    };
  
    // metrics (optional)
    metrics?: {
      purchase_price_gbp?: number | null;
      estimated_value_gbp?: number | null;
      gross_yield_on_purchase_percent?: number | null;
      gross_yield_on_value_percent?: number | null;
    };
  };

// New types for properties-only data sourcing
export interface RoomData {
  room_label?: string | null;
  floor?: string | null;
  floorplan_room_label?: string | null;
  labour_total_gbp?: number | null;
  materials_total_gbp?: number | null;
  total_gbp?: number | null;
  image_urls?: string[] | null;
  room_type?: string | null;
}

export interface AggregatedRoom {
  identity: string;
  displayName: string;
  floor?: string | null;
  room_type?: string | null;
  labour_total_gbp: number;
  materials_total_gbp: number;
  total_gbp: number;
  image_urls: string[];
  primary_image?: string | null;
}

export interface RefurbData {
  refurb_totals_by_room?: RoomData[];
  results?: { refurb_totals_by_room?: RoomData[] };
  refurb_estimates?: RoomData[];
}
  