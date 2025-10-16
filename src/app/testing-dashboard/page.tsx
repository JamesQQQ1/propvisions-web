// src/app/testing-dashboard/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Maximize2 } from 'lucide-react';
import Filters from '@/components/dashboard/Filters';
import KpiCards from '@/components/dashboard/KpiCards';
import {
  RunsSparkline,
  SuccessStackedBar,
  StageDurationBar,
  ErrorDistributionBar,
} from '@/components/dashboard/Charts';
import RunsTable from '@/components/dashboard/RunsTable';
import StagesTable from '@/components/dashboard/StagesTable';
import ErrorsTable from '@/components/dashboard/ErrorsTable';
import IngestTable from '@/components/dashboard/IngestTable';
import PropertiesTable from '@/components/dashboard/PropertiesTable';
import { ALL_STAGES, getStageColor } from '@/utils/format';
import type {
  OverviewResponse,
  RunsResult,
  StagesResult,
  ErrorsResult,
  IngestResult,
  PropertiesResult,
} from '@/types/dashboard';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function DashboardContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);

  // Fetch overview data
  const { data: overviewData, error: overviewError, mutate: mutateOverview } = useSWR<OverviewResponse>(
    `/api/dashboard/overview?${queryString}`,
    fetcher,
    { refreshInterval: autoRefreshInterval || 0 }
  );

  // Fetch data based on active tab
  const { data: runsData, error: runsError, mutate: mutateRuns } = useSWR<RunsResult>(
    activeTab === 'runs' ? `/api/dashboard/runs?${queryString}` : null,
    fetcher,
    { refreshInterval: autoRefreshInterval || 0 }
  );

  const { data: stagesData, error: stagesError, mutate: mutateStages } = useSWR<StagesResult>(
    activeTab === 'stages' ? `/api/dashboard/stages?${queryString}` : null,
    fetcher,
    { refreshInterval: autoRefreshInterval || 0 }
  );

  const { data: errorsData, error: errorsError, mutate: mutateErrors } = useSWR<ErrorsResult>(
    activeTab === 'errors' ? `/api/dashboard/errors?${queryString}` : null,
    fetcher,
    { refreshInterval: autoRefreshInterval || 0 }
  );

  const { data: ingestData, error: ingestError, mutate: mutateIngest } = useSWR<IngestResult>(
    activeTab === 'ingest' ? `/api/dashboard/ingest?${queryString}` : null,
    fetcher,
    { refreshInterval: autoRefreshInterval || 0 }
  );

  const { data: propertiesData, error: propertiesError, mutate: mutateProperties } = useSWR<PropertiesResult>(
    activeTab === 'properties' ? `/api/dashboard/properties?${queryString}` : null,
    fetcher,
    { refreshInterval: autoRefreshInterval || 0 }
  );

  const handlePageChange = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', String(offset));
    window.location.search = params.toString();
  };

  const handleRefreshToggle = (interval: number | null) => {
    setAutoRefreshInterval(interval);
  };

  const handleManualRefresh = () => {
    mutateOverview();
    if (activeTab === 'runs') mutateRuns();
    if (activeTab === 'stages') mutateStages();
    if (activeTab === 'errors') mutateErrors();
    if (activeTab === 'ingest') mutateIngest();
    if (activeTab === 'properties') mutateProperties();
  };

  const handleExportCSV = () => {
    // Placeholder for CSV export functionality
    alert('CSV export for current tab (to be implemented)');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Testing Dashboard</h1>
          <div className="flex items-center gap-2">
            {/* Auto-Refresh Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={autoRefreshInterval === null ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => handleRefreshToggle(null)}
              >
                Off
              </Button>
              <Button
                variant={autoRefreshInterval === 15000 ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleRefreshToggle(15000)}
              >
                15s
              </Button>
              <Button
                variant={autoRefreshInterval === 60000 ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleRefreshToggle(60000)}
              >
                60s
              </Button>
            </div>
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4">
        {/* Filter Panel */}
        <Filters />

        {/* KPI Cards & Overview Tab */}
        {overviewError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            Failed to load overview: {overviewError.message}
          </div>
        )}
        {!overviewData && !overviewError && (
          <div className="text-slate-500 mb-6">Loading overview...</div>
        )}
        {overviewData && (
          <>
            <KpiCards totals={overviewData.totals} />

            {/* Stage Color Legend */}
            <div className="mb-6 p-4 bg-white border rounded-lg">
              <h3 className="text-sm font-semibold mb-3">Pipeline Stages</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_STAGES.map((stage) => {
                  const colors = getStageColor(stage);
                  return (
                    <Badge key={stage} className={`${colors.bg} ${colors.text} border-0`}>
                      {stage}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold mb-3">Runs Over Time</h3>
                <RunsSparkline data={overviewData.timeseries} />
              </div>
              <div className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold mb-3">Success vs Failed</h3>
                <SuccessStackedBar data={overviewData.timeseries} />
              </div>
              <div className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold mb-3">Stage Duration (Avg)</h3>
                <StageDurationBar data={overviewData.stage_durations} />
              </div>
              <div className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold mb-3">Top Errors</h3>
                <ErrorDistributionBar data={overviewData.top_errors} />
              </div>
            </div>
          </>
        )}

        {/* Section Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="ingest">Ingest</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-slate-600">
                View KPI cards and charts above. Switch to other tabs for detailed data.
              </p>
            </div>
          </TabsContent>

          {/* Runs Tab */}
          <TabsContent value="runs" className="mt-0">
            {runsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Failed to load runs: {runsError.message}
              </div>
            )}
            {!runsData && !runsError && (
              <div className="text-slate-500">Loading runs...</div>
            )}
            {runsData && (
              <RunsTable
                runs={runsData.runs}
                total={runsData.total}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          {/* Stages Tab */}
          <TabsContent value="stages" className="mt-0">
            {stagesError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Failed to load stages: {stagesError.message}
              </div>
            )}
            {!stagesData && !stagesError && (
              <div className="text-slate-500">Loading stages...</div>
            )}
            {stagesData && <StagesTable stats={stagesData.stats} />}
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="mt-0">
            {errorsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Failed to load errors: {errorsError.message}
              </div>
            )}
            {!errorsData && !errorsError && (
              <div className="text-slate-500">Loading errors...</div>
            )}
            {errorsData && (
              <ErrorsTable
                errors={errorsData.errors}
                total={errorsData.total}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          {/* Ingest Tab */}
          <TabsContent value="ingest" className="mt-0">
            {ingestError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Failed to load ingest: {ingestError.message}
              </div>
            )}
            {!ingestData && !ingestError && (
              <div className="text-slate-500">Loading ingest jobs...</div>
            )}
            {ingestData && (
              <IngestTable
                jobs={ingestData.jobs}
                total={ingestData.total}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-0">
            {propertiesError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Failed to load properties: {propertiesError.message}
              </div>
            )}
            {!propertiesData && !propertiesError && (
              <div className="text-slate-500">Loading properties...</div>
            )}
            {propertiesData && (
              <PropertiesTable
                properties={propertiesData.properties}
                total={propertiesData.total}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TestingDashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4"><div className="text-slate-500">Loading dashboard...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
