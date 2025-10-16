// src/utils/format.ts
// Formatting utilities for Testing Dashboard

/**
 * Format GBP currency
 */
export function formatGBP(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date/time
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Format date only (no time)
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Format duration in seconds to human-readable string
 */
export function msToHuman(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Extract domain from URL
 */
export function domainFromUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.length > 30 ? url.substring(0, 27) + '...' : url;
  }
}

/**
 * Format percentage
 */
export function percent(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return '';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(Math.round(value));
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string | null | undefined, maxLength = 50): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function relativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(isoString);
  } catch {
    return '';
  }
}

/**
 * Stage color mapping (stable colors for all stage chips and charts)
 */
export const STAGE_COLORS: Record<string, { bg: string; text: string; chart: string }> = {
  HTML: { bg: 'bg-blue-100', text: 'text-blue-800', chart: '#6b8afd' },
  EPC: { bg: 'bg-lime-100', text: 'text-lime-800', chart: '#7ed957' },
  Rent: { bg: 'bg-cyan-100', text: 'text-cyan-800', chart: '#4dd0e1' },
  Valuation: { bg: 'bg-amber-100', text: 'text-amber-800', chart: '#f59e0b' },
  ROI: { bg: 'bg-emerald-100', text: 'text-emerald-800', chart: '#10b981' },
  Rooms: { bg: 'bg-purple-100', text: 'text-purple-800', chart: '#a78bfa' },
  'Refurb Engine': { bg: 'bg-pink-100', text: 'text-pink-800', chart: '#fb7185' },
  PDF: { bg: 'bg-slate-100', text: 'text-slate-800', chart: '#94a3b8' },
};

export function getStageColor(stage: string | null | undefined): { bg: string; text: string; chart: string } {
  if (!stage) return { bg: 'bg-gray-100', text: 'text-gray-800', chart: '#9ca3af' };
  return STAGE_COLORS[stage] || { bg: 'bg-gray-100', text: 'text-gray-800', chart: '#9ca3af' };
}

/**
 * Status badge colors
 */
export function getStatusColor(status: string | null | undefined): { bg: string; text: string } {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'completed' || normalized === 'success') {
    return { bg: 'bg-green-100', text: 'text-green-800' };
  }
  if (normalized === 'failed' || normalized === 'hard_fail') {
    return { bg: 'bg-red-100', text: 'text-red-800' };
  }
  if (normalized === 'processing') {
    return { bg: 'bg-blue-100', text: 'text-blue-800' };
  }
  if (normalized === 'queued') {
    return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-800' };
}

/**
 * Copy text to clipboard (browser only)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all stage names (authoritative list)
 */
export const ALL_STAGES = ['HTML', 'EPC', 'Rent', 'Valuation', 'ROI', 'Rooms', 'Refurb Engine', 'PDF'] as const;
export type StageName = typeof ALL_STAGES[number];
