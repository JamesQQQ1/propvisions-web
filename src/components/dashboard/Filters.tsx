'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  getDatePreset,
  stringifyFilters,
  parseFilters,
  getActiveFilterChips,
  getSavedViews,
  saveView,
  deleteSavedView,
  removeFilter,
} from '@/utils/filters';
import { ALL_STAGES, getStageColor } from '@/utils/format';
import type { DashboardFilters } from '@/types/dashboard';
import { X, Save, Trash2, ChevronDown } from 'lucide-react';
import BatchSelector from './BatchSelector';

export default function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for form inputs
  const [datePreset, setDatePreset] = useState<'last24h' | 'last7d' | 'last30d' | 'custom'>('last7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [batchLabel, setBatchLabel] = useState('');
  const [status, setStatus] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [errorCode, setErrorCode] = useState('');
  const [propNo, setPropNo] = useState('');
  const [runId, setRunId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Saved views
  const [savedViews, setSavedViews] = useState(getSavedViews());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');

  // Parse current filters from URL
  const currentFilters = useMemo(() => {
    return parseFilters(Object.fromEntries(searchParams));
  }, [searchParams]);

  // Active filter chips
  const activeChips = useMemo(() => getActiveFilterChips(currentFilters), [currentFilters]);

  // Load from URL on mount
  useEffect(() => {
    setFrom(searchParams.get('from') || '');
    setTo(searchParams.get('to') || '');
    setBatchLabel(searchParams.get('batch_label') || '');
    setStatus(searchParams.get('status') || '');

    const stageParam = searchParams.get('stage');
    if (stageParam) {
      setSelectedStages(stageParam.split(',').map(s => s.trim()).filter(Boolean));
    } else {
      setSelectedStages([]);
    }

    setErrorCode(searchParams.get('error_code') || '');
    setPropNo(searchParams.get('prop_no') || '');
    setRunId(searchParams.get('run_id') || '');
    setPropertyId(searchParams.get('property_id') || '');
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handlePresetChange = (preset: 'last24h' | 'last7d' | 'last30d' | 'custom') => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { from: newFrom, to: newTo } = getDatePreset(preset);
      setFrom(newFrom);
      setTo(newTo);
    }
  };

  const toggleStage = (stage: string) => {
    setSelectedStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const handleApply = () => {
    const filters: DashboardFilters = {
      from: from || undefined,
      to: to || undefined,
      batch_label: batchLabel || undefined,
      status: status || undefined,
      stage: selectedStages.length > 0 ? selectedStages : undefined,
      error_code: errorCode || undefined,
      prop_no: propNo || undefined,
      run_id: runId || undefined,
      property_id: propertyId || undefined,
      q: searchQuery || undefined,
    };

    const params = stringifyFilters(filters);
    const queryString = new URLSearchParams(params).toString();
    router.push(`?${queryString}`);
  };

  const handleClear = () => {
    const { from: newFrom, to: newTo } = getDatePreset('last7d');
    setDatePreset('last7d');
    setFrom(newFrom);
    setTo(newTo);
    setBatchLabel('');
    setStatus('');
    setSelectedStages([]);
    setErrorCode('');
    setPropNo('');
    setRunId('');
    setPropertyId('');
    setSearchQuery('');
    router.push('?');
  };

  const handleRemoveChip = (key: keyof DashboardFilters, value?: string) => {
    const currentUrl = `?${searchParams.toString()}`;
    if (key === 'stage' && value) {
      // Remove specific stage
      const stages = currentFilters.stage
        ? Array.isArray(currentFilters.stage)
          ? currentFilters.stage.filter(s => s !== value)
          : currentFilters.stage !== value
          ? [currentFilters.stage]
          : []
        : [];
      const params = new URLSearchParams(currentUrl);
      if (stages.length > 0) {
        params.set('stage', stages.join(','));
      } else {
        params.delete('stage');
      }
      router.push(`?${params.toString()}`);
    } else {
      router.push(removeFilter(currentUrl, key));
    }
  };

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    saveView(viewName, currentFilters);
    setSavedViews(getSavedViews());
    setShowSaveDialog(false);
    setViewName('');
  };

  const handleLoadView = (filters: DashboardFilters) => {
    const params = stringifyFilters(filters);
    const queryString = new URLSearchParams(params).toString();
    router.push(`?${queryString}`);
  };

  const handleDeleteView = (name: string) => {
    deleteSavedView(name);
    setSavedViews(getSavedViews());
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mb-6">
      {/* Collapsible Filter Panel */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <div className="flex gap-2">
            <Button onClick={() => setShowSaveDialog(!showSaveDialog)} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save View
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
            {activeChips.map((chip, idx) => (
              <Badge
                key={`${chip.key}-${chip.value}-${idx}`}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <span className="text-xs font-medium">{chip.label}:</span>
                <span className="text-xs">{chip.value}</span>
                <button
                  onClick={() => handleRemoveChip(chip.key, chip.value)}
                  className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <Button onClick={handleClear} variant="ghost" size="sm" className="h-6 text-xs">
              Clear All
            </Button>
          </div>
        )}

        {/* Save View Dialog */}
        {showSaveDialog && (
          <div className="mb-4 p-4 border rounded-lg bg-slate-50">
            <Label htmlFor="view-name">Save Current View</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="view-name"
                type="text"
                placeholder="View name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
              />
              <Button onClick={handleSaveView} size="sm">Save</Button>
              <Button onClick={() => setShowSaveDialog(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </div>
        )}

        {/* Saved Views */}
        {savedViews.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm text-slate-600 mb-2 block">Saved Views</Label>
            <div className="flex flex-wrap gap-2">
              {savedViews.map((view) => (
                <div
                  key={view.name}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded-md bg-white hover:bg-slate-50 transition-colors"
                >
                  <button
                    onClick={() => handleLoadView(view.filters)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {view.name}
                  </button>
                  <button
                    onClick={() => handleDeleteView(view.name)}
                    className="ml-1 hover:bg-red-100 rounded-full p-1"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Date Range Preset */}
          <div>
            <Label htmlFor="date-preset">Date Range</Label>
            <select
              id="date-preset"
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last24h">Last 24 hours</option>
              <option value="last7d">Last 7 days</option>
              <option value="last30d">Last 30 days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Custom Date From/To */}
          {datePreset === 'custom' && (
            <>
              <div>
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="queued">Queued</option>
            </select>
          </div>

          {/* Batch Label */}
          <div>
            <Label htmlFor="batch-label">Batch Label</Label>
            <BatchSelector
              value={batchLabel}
              onChange={setBatchLabel}
            />
          </div>

          {/* Free-text Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="URL or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Error Code */}
          <div>
            <Label htmlFor="error-code">Error Code</Label>
            <Input
              id="error-code"
              type="text"
              placeholder="e.g., PARSE_ERROR"
              value={errorCode}
              onChange={(e) => setErrorCode(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Prop No */}
          <div>
            <Label htmlFor="prop-no">Property Number</Label>
            <Input
              id="prop-no"
              type="text"
              placeholder="e.g., PROP-123"
              value={propNo}
              onChange={(e) => setPropNo(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Run ID */}
          <div>
            <Label htmlFor="run-id">Run ID</Label>
            <Input
              id="run-id"
              type="text"
              placeholder="UUID"
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Property ID */}
          <div>
            <Label htmlFor="property-id">Property ID</Label>
            <Input
              id="property-id"
              type="text"
              placeholder="UUID"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Stage Multi-Select */}
        <div className="mt-4">
          <Label>Stages</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_STAGES.map((stage) => {
              const colors = getStageColor(stage);
              const isSelected = selectedStages.includes(stage);
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleStage(stage)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.text} border-transparent font-medium`
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {stage}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <Button onClick={handleApply}>Apply Filters</Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
