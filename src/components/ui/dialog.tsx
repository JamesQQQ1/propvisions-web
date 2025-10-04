'use client';
import * as React from 'react';

const Ctx = React.createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function Dialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}
export function DialogTrigger({ asChild, children, ...props }: any) {
  const ctx = React.useContext(Ctx)!;
  const trigger = (
    <button onClick={() => ctx.setOpen(true)} {...props}>
      {children}
    </button>
  );
  return asChild ? React.cloneElement(children, { onClick: () => ctx.setOpen(true) }) : trigger;
}
export function DialogContent({ className = '', children }: any) {
  const ctx = React.useContext(Ctx)!;
  if (!ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={() => ctx.setOpen(false)} />
      <div className={`relative z-10 w-[90vw] max-w-xl rounded-xl border bg-white p-4 shadow-xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
export function DialogHeader({ className = '', ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-2 ${className}`} {...p} />;
}
export function DialogTitle({ className = '', ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-base font-semibold ${className}`} {...p} />;
}
export default { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };
