cat > probe-status.cjs <<'EOF'
#!/usr/bin/env node
/**
 * Probe Supabase for a given property_id and build the same payload as /api/status.
 * Usage:
 *   node probe-status.cjs <property_id> [--debug]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfbenobdonhgfnmxgfns.supabase.co';
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmVub2Jkb25oZ2ZubXhnZm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcwMzQ3MywiZXhwIjoyMDY5Mjc5NDczfQ.mXcoAkfKx35El0cIYZ3Z4UcKVpyhj7sI3tZgxiKvPw0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const property_id = process.argv[2];
const debug = process.argv.includes('--debug');

if (!property_id) {
  console.error('Usage: node probe-status.cjs <property_id> [--debug]');
  process.exit(1);
}

const num = (x) => (Number.isFinite(+x) ? +x : 0);

function normaliseProperty(p) {
  if (!p) return null;
  const listing_images = Array.isArray(p.listing_images) ? p.listing_images : [];
  const image_url = listing_images.length ? listing_images[0] : null;

  const display_price_gbp =
    p.purchase_price_gbp ?? p.guide_price_gbp ?? p.asking_price_gbp ?? p.price_gbp ?? null;

  const price_label =
    p.purchase_price_gbp != null ? 'purchase_price_gbp'
    : p.guide_price_gbp  != null ? 'guide_price_gbp'
    : p.asking_price_gbp != null ? 'asking_price_gbp'
    : p.price_gbp       != null ? 'price_gbp'
    : 'unknown';

  return {
    property_id: p.id,
    property_title: p.property_title ?? '',
    address: p.address ?? '',
    postcode: p.postcode ?? '',
    property_type: p.property_type ?? '',
    tenure: p.tenure ?? '',
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    receptions: p.receptions ?? null,
    floor_area_sqm: p.floor_area_sqm ?? null,
    epc_rating: p.epc_rating ?? null,
    listing_url: p.listing_url ?? '',
    auction_date: p.auction_date ?? '',
    lot_number: p.lot_number ?? '',
    agent_name: p.agent_name ?? '',
    agent_phone: p.agent_phone ?? '',
    agent_email: p.agent_email ?? '',
    listing_images,
    image_url,
    purchase_price_gbp: p.purchase_price_gbp ?? null,
    guide_price_gbp: p.guide_price_gbp ?? null,
    asking_price_gbp: p.asking_price_gbp ?? null,
    price_gbp: p.price_gbp ?? null,
    display_price_gbp,
    price_label,
  };
}

function pickImageUrl(image_index, listing_images) {
  if (!listing_images || !listing_images.length) return null;
  if (image_index == null) return null;
  const candidates = [image_index, image_index - 1].filter(
    (i) => Number.isInteger(i) && i >= 0 && i < listing_images.length
  );
  for (const i of candidates) {
    const u = listing_images[i];
    if (u) return u;
  }
  return null;
}

function buildZeroRoomsFromImages(property, { maxImages = 12, defaultRoomType = 'room' } = {}) {
  const images = Array.isArray(property?.listing_images) ? property.listing_images : [];
  return images.slice(0, maxImages).map((url, idx) => ({
    id: `img-${idx}`,
    detected_room_type: defaultRoomType,
    room_type: defaultRoomType,
    image_url: url,
    image_id: null,
    image_index: idx,
    materials: [],
    labour: [],
    materials_total_gbp: 0,
    labour_total_gbp: 0,
    room_total_gbp: 0,
    room_confidence: null,
    confidence: null,
    estimated_total_gbp: 0,
    works: [],
    assumptions: { note: 'No refurbishment required detected (no price rows saved).' },
  }));
}

function buildRoomsFromPriceTables(mats, labs, property) {
  const map = new Map();
  const keyFor = (x) => {
    const ii = x?.image_index != null ? Number(x.image_index) : null;
    const rt = (x?.room_type || 'room').toString().toLowerCase().trim() || 'room';
    return { k: `${ii != null ? `img:${ii}` : 'img:-'}|${rt}`, ii, rt };
  };
  const add = (k, ii, rt) => {
    if (!map.has(k)) map.set(k, { image_index: ii, room_type: rt, materials: [], labour: [] });
    return map.get(k);
  };

  for (const m of mats || []) {
    const { k, ii, rt } = keyFor(m);
    add(k, ii, rt).materials.push(m);
  }
  for (const l of labs || []) {
    const { k, ii, rt } = keyFor(l);
    add(k, ii, rt).labour.push(l);
  }

  const images = property?.listing_images || null;

  return Array.from(map.values()).map((agg, idx) => {
    const image_url = pickImageUrl(agg.image_index, images);

    const matLines = (agg.materials || []).map((m) => {
      const qty = m.qty_with_waste ?? m.qty_raw ?? m.units_to_buy ?? null;
      const unitRate = m.unit_price_material_gbp ?? null;
      const subtotal =
        m.material_subtotal_gbp ??
        m.subtotal_gbp ??
        (unitRate != null && qty != null ? num(unitRate) * num(qty) : null);
      return {
        job_line_id: m.job_line_id ?? null,
        item_key: m.item_key || m.material || 'material',
        unit: m.unit || null,
        qty,
        unit_price_material_gbp: unitRate,
        subtotal_gbp: subtotal,
        waste_pct: null,
        units_to_buy: m.units_to_buy ?? null,
        notes: m.notes ?? null,
        assumed_area_m2: m.assumed_area_m2 ?? null,
        confidence: m.confidence ?? null,
      };
    });

    const labLines = (agg.labour || []).map((l) => {
      const hours = l.total_hours ?? null;
      const crew  = l.crew_size ?? 1;
      const rate  = l.hourly_rate_gbp ?? null;
      const cost  = l.labour_cost_gbp ?? (hours != null && rate != null ? num(hours) * num(crew) * num(rate) : null);
      return {
        job_line_id: l.job_line_id ?? null,
        trade_key: l.trade_key || 'labour',
        total_hours: hours,
        crew_size: crew,
        hourly_rate_gbp: rate,
        labour_cost_gbp: cost,
        ai_confidence: l.ai_confidence ?? null,
        notes: l.notes ?? null,
      };
    });

    const materials_total = matLines.reduce((a, m) => a + num(m.subtotal_gbp), 0);
    const labour_total    = labLines.reduce((a, l) => a + num(l.labour_cost_gbp), 0);
    const total           = materials_total + labour_total;

    return {
      id: `rx-${idx}`,
      detected_room_type: agg.room_type ?? undefined,
      room_type: agg.room_type ?? undefined,
      image_url,
      image_id: null,
      image_index: agg.image_index ?? null,
      materials: matLines,
      labour: labLines,
      materials_total_gbp: materials_total || null,
      labour_total_gbp: labour_total || null,
      room_total_gbp: total || null,
      room_confidence: null,
      confidence: null,
      estimated_total_gbp: total || null,
      works: [
        ...matLines.map((m) => ({
          category: 'materials',
          description: m.item_key || 'material',
          unit: m.unit || '',
          qty: num(m.qty) || undefined,
          unit_rate_gbp: num(m.unit_price_material_gbp) || undefined,
          subtotal_gbp: num(m.subtotal_gbp) || undefined,
        })),
        ...labLines.map((l) => ({
          category: (l.trade_key || 'labour'),
          description: l.notes || '',
          unit: 'hours',
          qty: num(l.total_hours) || undefined,
          unit_rate_gbp: num(l.hourly_rate_gbp) || undefined,
          subtotal_gbp: num(l.labour_cost_gbp) || undefined,
        })),
      ],
    };
  });
}

(async () => {
  console.log('▶ Using Supabase:', SUPABASE_URL.slice(0, 30) + '…');
  console.log('▶ Property ID   :', property_id);

  // 1) property + financials
  const [finResp, propResp] = await Promise.all([
    supabase.from('property_financials').select('*').eq('property_id', property_id).maybeSingle(),
    supabase.from('properties').select('*').eq('id', property_id).maybeSingle(),
  ]);

  if (finResp.error || propResp.error) {
    console.error('✖ Supabase error:', { financials: finResp.error, property: propResp.error });
    process.exit(2);
  }

  const property = normaliseProperty(propResp.data ?? null);

  // 2) price tables by property_id
  const [matsResp, labsResp] = await Promise.all([
    supabase.from('material_refurb_prices').select('*').eq('property_id', property_id),
    supabase.from('labour_refurb_prices').select('*').eq('property_id', property_id),
  ]);

  if (matsResp.error || labsResp.error) {
    console.error('✖ Price table errors:', { materials: matsResp.error, labour: labsResp.error });
    process.exit(3);
  }

  const mats = Array.isArray(matsResp.data) ? matsResp.data : [];
  const labs = Array.isArray(labsResp.data) ? labsResp.data : [];

  console.log('—');
  console.log('Counts:', { materials: mats.length, labour: labs.length });

  // 3) build rooms
  let refurb_estimates;
  let used;
  if (mats.length || labs.length) {
    refurb_estimates = buildRoomsFromPriceTables(mats, labs, property);
    used = 'price_tables_by_property';
  } else {
    refurb_estimates = buildZeroRoomsFromImages(property, { maxImages: 12 });
    used = 'images_only_no_refurb';
  }

  // 4) final payload (what /api/status returns)
  const payload = {
    status: 'completed',
    property_id,
    property,
    financials: finResp.data ?? null,
    refurb_estimates,
    pdf_url: null,
    refurb_debug: {
      used,
      counts: { materials: mats.length, labour: labs.length },
      samples: {
        materials: mats.slice(0, 3).map(({ id, room_type, image_index, item_key, qty_with_waste, qty_raw, units_to_buy, unit_price_material_gbp, material_subtotal_gbp }) =>
          ({ id, room_type, image_index, item_key, qty_with_waste, qty_raw, units_to_buy, unit_price_material_gbp, material_subtotal_gbp })
        ),
        labour: labs.slice(0, 3).map(({ id, room_type, image_index, trade_key, total_hours, crew_size, hourly_rate_gbp, labour_cost_gbp }) =>
          ({ id, room_type, image_index, trade_key, total_hours, crew_size, hourly_rate_gbp, labour_cost_gbp })
        ),
      },
    },
  };

  if (debug) {
    console.dir(payload, { depth: null, colors: true });
  } else {
    console.log('—');
    console.log('Summary:', {
      property_title: payload.property?.property_title,
      images: payload.property?.listing_images?.length || 0,
      financials: !!payload.financials,
      rooms: payload.refurb_estimates.length,
      mode: payload.refurb_debug.used,
    });
    console.log('—');
    console.log('First 2 rooms:');
    console.dir(payload.refurb_estimates.slice(0, 2), { depth: null, colors: true });
    console.log('—');
    console.log('To see everything, re-run with --debug');
  }
})().catch((e) => {
  console.error('✖ Unexpected error:', e);
  process.exit(9);
});
EOF

chmod +x probe-status.cjs
