import { differenceInMinutes } from "date-fns";

export function calculateFirstResponseMinutes(firstResponseAt: Date | null, createdAt: Date): number | null {
  if (!firstResponseAt) return null;
  return Math.max(0, differenceInMinutes(firstResponseAt, createdAt));
}

export function calculateResolveMinutes(resolvedAt: Date | null, createdAt: Date): number | null {
  if (!resolvedAt) return null;
  return Math.max(0, differenceInMinutes(resolvedAt, createdAt));
}


