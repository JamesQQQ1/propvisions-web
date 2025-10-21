'use client';

import { useMemo } from 'react';

export default function PDFViewer({ pdfUrl }: { pdfUrl: string }) {
  const embedUrl = useMemo(() => {
    // Route through proxy and add helpful viewer params
    const base = `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
    // hash params are honored by most built-in PDF viewers
    return `${base}#toolbar=1&navpanes=0&zoom=page-fit`;
  }, [pdfUrl]);

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div className="w-full" style={{ height: '72vh', minHeight: 480 }}>
        <iframe
          title="Report PDF"
          src={embedUrl}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{pdfUrl}</div>
        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm rounded-md border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Open in new tab
          </a>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-sm inline-flex items-center rounded-md bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
