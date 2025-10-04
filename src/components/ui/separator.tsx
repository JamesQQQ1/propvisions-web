import * as React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' };
export function Separator({ className = '', orientation = 'horizontal', ...props }: Props) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={`${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'} bg-slate-200 ${className}`}
      {...props}
    />
  );
}
export default Separator;
