import dayjs from "dayjs";

export function calculateFirstResponseMinutes(firstResponseAt: Date | null, createdAt: Date): number | null {
  if (!firstResponseAt) return null;
  return Math.max(0, dayjs(firstResponseAt).diff(dayjs(createdAt), 'minute'));
}

export function calculateResolveMinutes(resolvedAt: Date | null, createdAt: Date): number | null {
  if (!resolvedAt) return null;
  return Math.max(0, dayjs(resolvedAt).diff(dayjs(createdAt), 'minute'));
}


