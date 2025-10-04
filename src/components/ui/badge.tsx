import * as React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
};

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-600 text-white',
  secondary: 'bg-slate-200 text-slate-900',
  success: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-amber-100 text-amber-900 border border-amber-200',
  destructive: 'bg-red-100 text-red-800 border border-red-200',
  outline: 'border border-slate-300 text-slate-800',
};

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${variants[variant]} ${className}`} {...props} />
  );
}
export default Badge;
