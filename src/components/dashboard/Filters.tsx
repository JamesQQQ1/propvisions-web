'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getDatePreset, stringifyFilters } from '@/utils/filters';
import type { DashboardFilters } from '@/types/dashboard';

const COMMON_STAGES = ['ingest', 'parse', 'analyse', 'generate', 'complete'];

export default function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL
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

  // Load from URL on mount
  useEffect(() => {
    setFrom(searchParams.get('from') || '');
    setTo(searchParams.get('to') || '');
    setBatchLabel(searchParams.get('batch_label') || '');
    setStatus(searchParams.get('status') || '');

    const stageParam = searchParams.get('stage');
    if (stageParam) {
      setSelectedStages(stageParam.split(',').map(s => s.trim()).filter(Boolean));
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

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Date Range Preset */}
        <div>
          <Label htmlFor="date-preset">Date Range</Label>
          <select
            id="date-preset"
            value={datePreset}
            onChange={(e) => handlePresetChange(e.target.value as any)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="last24h">Last 24 hours</option>
            <option value="last7d">Last 7 days</option>
            <option value="last30d">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Custom Date From */}
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

        {/* Batch Label */}
        <div>
          <Label htmlFor="batch-label">Batch Label</Label>
          <Input
            id="batch-label"
            type="text"
            placeholder="e.g., batch-001"
            value={batchLabel}
            onChange={(e) => setBatchLabel(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
          </select>
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

        {/* Free-text Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Stage Multi-Select */}
      <div className="mt-4">
        <Label>Stages</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {COMMON_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => toggleStage(stage)}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                selectedStages.includes(stage)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
              }`}
            >
              {stage}
            </button>
          ))}
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
  );
}
