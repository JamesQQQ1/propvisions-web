'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { Check, ChevronDown, Search, Calendar } from 'lucide-react';
import { formatDateTime, relativeTime } from '@/utils/format';

interface BatchSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface Batch {
  batch_label: string;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BatchSelector({ value, onChange }: BatchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data } = useSWR<{ batches: Batch[] }>('/api/dashboard/batches', fetcher);

  const filteredBatches = useMemo(() => {
    if (!data?.batches) return [];
    if (!searchQuery) return data.batches;

    const query = searchQuery.toLowerCase();
    return data.batches.filter(b =>
      b.batch_label.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const selectedBatch = data?.batches.find(b => b.batch_label === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-slate-300 rounded-md hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-500'}>
          {value || 'All batches'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 mt-1 w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto max-h-80">
              {/* All batches option */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                  !value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                }`}
              >
                <span>All batches</span>
                {!value && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <button
                    key={batch.batch_label}
                    type="button"
                    onClick={() => {
                      onChange(batch.batch_label);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-start justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors ${
                      value === batch.batch_label ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <div className={`text-sm font-medium ${
                        value === batch.batch_label ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {batch.batch_label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {relativeTime(batch.created_at)}
                      </div>
                    </div>
                    {value === batch.batch_label && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No batches found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
