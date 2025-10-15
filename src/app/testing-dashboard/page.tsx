// src/app/testing-dashboard/page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filters } from '@/components/dashboard/Filters';
import { KpiCards } from '@/components/dashboard/KpiCards';
import {
  RunsSparkline,
  SuccessStackedBar,
  StageDurationBar,
  ErrorDistributionBar,
} from '@/components/dashboard/Charts';
import { RunsTable } from '@/components/dashboard/RunsTable';
import { StagesTable } from '@/components/dashboard/StagesTable';
import { ErrorsTable } from '@/components/dashboard/ErrorsTable';
import { IngestTable } from '@/components/dashboard/IngestTable';
import { PropertiesTable } from '@/components/dashboard/PropertiesTable';
import type {
  OverviewResponse,
  RunsResult,
  StagesResult,
  ErrorsResult,
  IngestResult,
  PropertiesResult,
} from '@/types/dashboard';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TestingDashboardPage() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [activeTab, setActiveTab] = useState('runs');

  // Fetch overview data
  const { data: overviewData, error: overviewError } = useSWR<OverviewResponse>(
    `/api/dashboard/overview?${queryString}`,
    fetcher
  );

  // Fetch data based on active tab
  const { data: runsData, error: runsError } = useSWR<RunsResult>(
    activeTab === 'runs' ? `/api/dashboard/runs?${queryString}` : null,
    fetcher
  );

  const { data: stagesData, error: stagesError } = useSWR<StagesResult>(
    activeTab === 'stages' ? `/api/dashboard/stages?${queryString}` : null,
    fetcher
  );

  const { data: errorsData, error: errorsError } = useSWR<ErrorsResult>(
    activeTab === 'errors' ? `/api/dashboard/errors?${queryString}` : null,
    fetcher
  );

  const { data: ingestData, error: ingestError } = useSWR<IngestResult>(
    activeTab === 'ingest' ? `/api/dashboard/ingest?${queryString}` : null,
    fetcher
  );

  const { data: propertiesData, error: propertiesError } = useSWR<PropertiesResult>(
    activeTab === 'properties' ? `/api/dashboard/properties?${queryString}` : null,
    fetcher
  );

  const handlePageChange = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', String(offset));
    window.location.search = params.toString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Testing Dashboard</h1>

      {/* Filter Panel */}
      <div className="mb-6">
        <Filters />
      </div>

      {/* KPI Cards */}
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

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Runs Over Time</h3>
              <RunsSparkline data={overviewData.timeseries} />
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Success vs Failed</h3>
              <SuccessStackedBar data={overviewData.timeseries} />
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Stage Duration</h3>
              <StageDurationBar data={overviewData.stage_durations} />
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Top Errors</h3>
              <ErrorDistributionBar data={overviewData.top_errors} />
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="ingest">Ingest</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        {/* Runs Tab */}
        <TabsContent value="runs" className="mt-4">
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
        <TabsContent value="stages" className="mt-4">
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
        <TabsContent value="errors" className="mt-4">
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
        <TabsContent value="ingest" className="mt-4">
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
        <TabsContent value="properties" className="mt-4">
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
  );
}
