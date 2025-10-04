'use client';
import * as React from 'react';

type TabsContextType = { value: string; setValue: (v: string) => void; };
const Ctx = React.createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, value, onValueChange, children }: any) {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const v = controlled ? value : internal;
  const setValue = (nv: string) => {
    if (!controlled) setInternal(nv);
    onValueChange?.(nv);
  };
  return <Ctx.Provider value={{ value: v, setValue }}>{children}</Ctx.Provider>;
}

export function TabsList({ className = '', children, ...props }: any) {
  return (
    <div className={`flex flex-wrap gap-2 rounded-lg border bg-white p-1 ${className}`} {...props}>
      {children}
    </div>
  );
}
export function TabsTrigger({ value, className = '', children, ...props }: any) {
  const ctx = React.useContext(Ctx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function TabsContent({ value, className = '', children, ...props }: any) {
  const ctx = React.useContext(Ctx)!;
  if (ctx.value !== value) return null;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export default { Tabs, TabsList, TabsTrigger, TabsContent };
