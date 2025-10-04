'use client';
import * as React from 'react';

type SliderProps = {
  value: number[];
  onValueChange: (v: number[]) => void;
  min?: number; max?: number; step?: number;
  className?: string;
};

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }: SliderProps) {
  return (
    <input
      type="range"
      min={min} max={max} step={step}
      value={value[0] ?? 0}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={`w-full cursor-pointer ${className}`}
    />
  );
}
export default Slider;
