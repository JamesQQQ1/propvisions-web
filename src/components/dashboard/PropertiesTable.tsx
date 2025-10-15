'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatGBP, truncate } from '@/utils/format';
import type { PropertyRow } from '@/types/dashboard';

interface PropertiesTableProps {
  properties: PropertyRow[];
  total?: number;
  onPageChange?: (offset: number) => void;
}

const LIMIT = 25;

export default function PropertiesTable({ properties, total = 0, onPageChange }: PropertiesTableProps) {
  const [currentOffset, setCurrentOffset] = useState(0);

  const handleNextPage = () => {
    const newOffset = currentOffset + LIMIT;
    setCurrentOffset(newOffset);
    onPageChange?.(newOffset);
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, currentOffset - LIMIT);
    setCurrentOffset(newOffset);
    onPageChange?.(newOffset);
  };

  if (properties.length === 0) {
    return <div className="text-center py-8 text-slate-600">No data found</div>;
  }

  const currentPage = Math.floor(currentOffset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Property ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Last Run ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Title</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Address</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Postcode</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Guide Price</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Monthly Rent</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Total with VAT</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">PDF</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property, idx) => (
              <tr
                key={property.property_id}
                className={`border-b border-slate-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3 text-sm">
                  <span title={property.property_id} className="font-mono text-slate-900">
                    {property.property_id.substring(0, 8)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {property.run_id ? (
                    <span title={property.run_id} className="font-mono text-slate-700">
                      {property.run_id.substring(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {truncate(property.property_title, 40)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {truncate(property.address, 40)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {property.postcode || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                  {formatGBP(property.guide_price_gbp)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                  {formatGBP(property.monthly_rent_gbp)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-slate-900 font-medium">
                  {formatGBP(property.property_total_with_vat)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {property.property_pdf ? (
                    <a
                      href={property.property_pdf}
                      target="_blank"
                      rel="noopener"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-slate-600">
          Showing {currentOffset + 1} to {Math.min(currentOffset + LIMIT, total)} of {total} properties
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentOffset === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={currentOffset + LIMIT >= total}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
