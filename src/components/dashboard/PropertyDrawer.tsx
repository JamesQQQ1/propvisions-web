'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatGBP, formatDateTime, truncate } from '@/utils/format';
import { ExternalLink } from 'lucide-react';
import type { PropertyRow } from '@/types/dashboard';

interface PropertyDrawerProps {
  property: PropertyRow;
  open: boolean;
  onClose: () => void;
}

export default function PropertyDrawer({ property, open, onClose }: PropertyDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Property Details</DialogTitle>
          <div className="text-sm text-slate-600 font-mono">{property.property_id}</div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Basic Information</h3>
            <div className="space-y-2 text-sm">
              {property.property_title && (
                <div>
                  <span className="text-slate-600 font-medium">Title:</span>{' '}
                  <span className="text-slate-900">{property.property_title}</span>
                </div>
              )}
              {property.address && (
                <div>
                  <span className="text-slate-600 font-medium">Address:</span>{' '}
                  <span className="text-slate-900">{property.address}</span>
                </div>
              )}
              {property.postcode && (
                <div>
                  <span className="text-slate-600 font-medium">Postcode:</span>{' '}
                  <Badge variant="outline">{property.postcode}</Badge>
                </div>
              )}
              {property.run_id && (
                <div>
                  <span className="text-slate-600 font-medium">Latest Run:</span>{' '}
                  <span className="text-slate-900 font-mono text-xs">{property.run_id}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Financial Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.guide_price_gbp !== null && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-700 mb-1">Guide Price</div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatGBP(property.guide_price_gbp)}
                  </div>
                </div>
              )}
              {property.monthly_rent_gbp !== null && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-700 mb-1">Monthly Rent</div>
                  <div className="text-lg font-bold text-green-900">
                    {formatGBP(property.monthly_rent_gbp)}/mo
                  </div>
                </div>
              )}
              {property.property_total_with_vat !== null && (
                <div className="bg-amber-50 p-3 rounded-lg col-span-2">
                  <div className="text-xs text-amber-700 mb-1">Total with VAT</div>
                  <div className="text-lg font-bold text-amber-900">
                    {formatGBP(property.property_total_with_vat)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {property.property_pdf && (
                <a
                  href={property.property_pdf}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View PDF
                </a>
              )}
              {property.run_id && (
                <a
                  href={`?run_id=${property.run_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700 transition-colors"
                >
                  View Latest Run
                </a>
              )}
              {property.postcode && (
                <a
                  href={`?q=${encodeURIComponent(property.postcode)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300 transition-colors"
                >
                  Filter by Postcode
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
