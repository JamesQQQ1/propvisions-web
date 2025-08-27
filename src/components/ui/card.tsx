import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white text-slate-900 shadow-sm",
        className
      )}
      {...props}   // ✅ spread inside the tag
    />
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={cn("p-4", className)} {...props} />
  );
}

export { Card, CardContent };
