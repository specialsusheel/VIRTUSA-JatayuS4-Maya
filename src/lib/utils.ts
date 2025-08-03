import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 * @param date Date object or timestamp (in milliseconds)
 * @returns Formatted date string
 */
export function formatDate(date: Date | number | string): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
    
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
