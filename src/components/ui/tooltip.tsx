'use client';
import * as React from 'react';

type TProps = { content: React.ReactNode; children: React.ReactNode };
export function TooltipProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Tooltip({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function TooltipTrigger({ children }: { children: React.ReactNode }) { return <span className="inline-flex">{children}</span>; }
export function TooltipContent({ content }: TProps) {
  return (
    <span className="ml-2 inline-flex items-center rounded bg-slate-900 px-2 py-0.5 text-xs text-white">
      {content}
    </span>
  );
}
export default { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
