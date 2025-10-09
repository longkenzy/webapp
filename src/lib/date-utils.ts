/**
 * Date and Time Utility Functions
 * All dates/times are in Asia/Ho_Chi_Minh timezone (UTC+7)
 */

import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date/time in Vietnam timezone for datetime-local input
 * Returns format: "YYYY-MM-DDTHH:mm" (compatible with datetime-local input)
 */
export const getCurrentVietnamDateTime = (): string => {
  const now = new Date();
  const vietnamTime = toZonedTime(now, VIETNAM_TIMEZONE);
  return format(vietnamTime, "yyyy-MM-dd'T'HH:mm");
};

/**
 * Get current date in Vietnam timezone for date input
 * Returns format: "YYYY-MM-DD" (compatible with date input)
 */
export const getCurrentVietnamDate = (): string => {
  const now = new Date();
  const vietnamTime = toZonedTime(now, VIETNAM_TIMEZONE);
  return format(vietnamTime, 'yyyy-MM-dd');
};

/**
 * Format date/time string to Vietnamese locale
 * Input: ISO string or Date object
 * Output: "DD/MM/YYYY HH:mm"
 */
export const formatVietnamDateTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const vietnamTime = toZonedTime(date, VIETNAM_TIMEZONE);
    return format(vietnamTime, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date only (without time) to Vietnamese locale
 * Input: ISO string or Date object
 * Output: "DD/MM/YYYY"
 */
export const formatVietnamDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const vietnamTime = toZonedTime(date, VIETNAM_TIMEZONE);
    return format(vietnamTime, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Convert datetime-local input value to ISO string for API
 * Input: "YYYY-MM-DDTHH:mm" from datetime-local input (treated as Vietnam time)
 * Output: ISO string in UTC
 */
export const convertLocalInputToISO = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  
  try {
    // Parse the string as Vietnam time (interpret the string as GMT+7)
    // The input is "YYYY-MM-DDTHH:mm" which we treat as Vietnam local time
    const [datePart, timePart] = localDateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create a date object with Vietnam timezone
    const vietnamTime = new Date(year, month - 1, day, hour, minute, 0);
    
    // Convert from Vietnam timezone to UTC
    const utcTime = fromZonedTime(vietnamTime, VIETNAM_TIMEZONE);
    return utcTime.toISOString();
  } catch (error) {
    console.error('Error converting local input to ISO:', error);
    return '';
  }
};

/**
 * Convert ISO string to datetime-local input value
 * Input: ISO string from API
 * Output: "YYYY-MM-DDTHH:mm" for datetime-local input
 */
export const convertISOToLocalInput = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = parseISO(isoString);
    const vietnamTime = toZonedTime(date, VIETNAM_TIMEZONE);
    return format(vietnamTime, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error converting ISO to local input:', error);
    return '';
  }
};

/**
 * Get timezone offset string
 * Returns: "+07:00"
 */
export const getVietnamTimezoneOffset = (): string => {
  return '+07:00';
};

/**
 * Check if a date is in the past (Vietnam time)
 */
export const isDateInPast = (dateString: string | Date): boolean => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const now = new Date();
    const vietnamNow = toZonedTime(now, VIETNAM_TIMEZONE);
    const vietnamDate = toZonedTime(date, VIETNAM_TIMEZONE);
    return vietnamDate < vietnamNow;
  } catch (error) {
    console.error('Error checking date:', error);
    return false;
  }
};

/**
 * Get relative time string (e.g., "2 giờ trước", "3 ngày trước")
 */
export const getRelativeTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    
    return formatVietnamDate(date);
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid date';
  }
};

/**
 * Get current date in YYYY-MM-DD format for file naming
 * Since server runs in Asia/Ho_Chi_Minh timezone, no conversion needed
 */
export const getCurrentDateForFilename = (): string => {
  return new Date().toLocaleDateString('sv-SE');
};

/**
 * Get current timestamp as Date object (not ISO string)
 * Since server runs in Asia/Ho_Chi_Minh timezone, no conversion needed
 */
export const getCurrentTimestamp = (): Date => {
  return new Date();
};

// Ensure timezone is set correctly for the application
export const ensureTimezone = (): void => {
  // Set timezone to Asia/Ho_Chi_Minh if not already set
  if (!process.env.TZ) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
  }
};

