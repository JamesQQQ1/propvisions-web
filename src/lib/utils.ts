// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility to merge Tailwind class names conditionally.
 * - clsx handles conditional arrays/objects
 * - twMerge ensures conflicting Tailwind classes are de-duped
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
