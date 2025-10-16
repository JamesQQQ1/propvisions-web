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

/**
 * Deep linking helpers - create filter URLs from interactions
 */
export function createFilterLink(baseFilters: DashboardFilters, additionalFilters: Partial<DashboardFilters>): string {
  const merged = { ...baseFilters, ...additionalFilters };
  const params = stringifyFilters(merged);
  return `?${new URLSearchParams(params).toString()}`;
}

export function addFilter(currentUrl: string, key: keyof DashboardFilters, value: string): string {
  const params = new URLSearchParams(currentUrl);
  params.set(key, value);
  return `?${params.toString()}`;
}

export function removeFilter(currentUrl: string, key: keyof DashboardFilters): string {
  const params = new URLSearchParams(currentUrl);
  params.delete(key);
  return `?${params.toString()}`;
}

/**
 * Saved views (localStorage)
 */
export interface SavedView {
  name: string;
  filters: DashboardFilters;
  createdAt: string;
}

const SAVED_VIEWS_KEY = 'dashboard_saved_views';

export function getSavedViews(): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SAVED_VIEWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveView(name: string, filters: DashboardFilters): void {
  if (typeof window === 'undefined') return;
  const views = getSavedViews();
  const newView: SavedView = {
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  // Replace if exists, otherwise append
  const index = views.findIndex(v => v.name === name);
  if (index >= 0) {
    views[index] = newView;
  } else {
    views.push(newView);
  }
  localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
}

export function deleteSavedView(name: string): void {
  if (typeof window === 'undefined') return;
  const views = getSavedViews().filter(v => v.name !== name);
  localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
}

/**
 * Get active filters as a human-readable list (for chips)
 */
export function getActiveFilterChips(filters: DashboardFilters): Array<{ key: keyof DashboardFilters; label: string; value: string }> {
  const chips: Array<{ key: keyof DashboardFilters; label: string; value: string }> = [];

  if (filters.batch_label) chips.push({ key: 'batch_label', label: 'Batch', value: filters.batch_label });
  if (filters.status) chips.push({ key: 'status', label: 'Status', value: filters.status });
  if (filters.stage) {
    const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
    stages.forEach(s => chips.push({ key: 'stage', label: 'Stage', value: s }));
  }
  if (filters.error_code) chips.push({ key: 'error_code', label: 'Error', value: filters.error_code });
  if (filters.prop_no) chips.push({ key: 'prop_no', label: 'Prop No', value: filters.prop_no });
  if (filters.run_id) chips.push({ key: 'run_id', label: 'Run ID', value: filters.run_id.substring(0, 8) + '...' });
  if (filters.property_id) chips.push({ key: 'property_id', label: 'Property', value: filters.property_id.substring(0, 8) + '...' });
  if (filters.q) chips.push({ key: 'q', label: 'Search', value: filters.q });

  return chips;
}
