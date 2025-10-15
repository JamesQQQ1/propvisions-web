// src/utils/filters.ts
// Single shared filter parser for all dashboard endpoints

import type { DashboardFilters } from '@/types/dashboard';

/**
 * Parse query params into DashboardFilters with sane defaults
 */
export function parseFilters(query: Record<string, string | string[] | undefined>): DashboardFilters {
  const toStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';
  const toArr = (v: string | string[] | undefined): string[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v) return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  // Default date range: last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const from = toStr(query.from) || sevenDaysAgo.toISOString().split('T')[0];
  const to = toStr(query.to) || now.toISOString().split('T')[0];

  // Parse limit and offset with bounds
  const limit = Math.max(1, Math.min(1000, Number(toStr(query.limit)) || 25));
  const offset = Math.max(0, Number(toStr(query.offset)) || 0);

  // Handle multi-select stage
  const stageParam = query.stage;
  const stage = stageParam ? toArr(stageParam) : undefined;

  return {
    from,
    to,
    batch_label: toStr(query.batch_label) || undefined,
    status: toStr(query.status) || undefined,
    stage: stage && stage.length > 0 ? stage : undefined,
    error_code: toStr(query.error_code) || undefined,
    prop_no: toStr(query.prop_no) || undefined,
    run_id: toStr(query.run_id) || undefined,
    property_id: toStr(query.property_id) || undefined,
    q: toStr(query.q) || undefined,
    limit,
    offset,
    raw: toStr(query.raw) || undefined,
  };
}

/**
 * Stringify filters back to query params for URL
 */
export function stringifyFilters(filters: DashboardFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.batch_label) params.batch_label = filters.batch_label;
  if (filters.status) params.status = filters.status;
  if (filters.stage) {
    params.stage = Array.isArray(filters.stage) ? filters.stage.join(',') : filters.stage;
  }
  if (filters.error_code) params.error_code = filters.error_code;
  if (filters.prop_no) params.prop_no = filters.prop_no;
  if (filters.run_id) params.run_id = filters.run_id;
  if (filters.property_id) params.property_id = filters.property_id;
  if (filters.q) params.q = filters.q;
  if (filters.limit !== undefined) params.limit = String(filters.limit);
  if (filters.offset !== undefined && filters.offset > 0) params.offset = String(filters.offset);
  if (filters.raw) params.raw = filters.raw;

  return params;
}

/**
 * Merge default date range presets
 */
export function getDatePreset(preset: 'last24h' | 'last7d' | 'last30d' | 'custom'): { from: string; to: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (preset) {
    case 'last24h': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { from: yesterday.toISOString().split('T')[0], to: today };
    }
    case 'last7d': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return { from: sevenDaysAgo.toISOString().split('T')[0], to: today };
    }
    case 'last30d': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return { from: thirtyDaysAgo.toISOString().split('T')[0], to: today };
    }
    case 'custom':
    default:
      return { from: '', to: '' };
  }
}
