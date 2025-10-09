/**
 * Date and Time Utility Functions
 * All dates/times are in Asia/Ho_Chi_Minh timezone (UTC+7)
 * Using Day.js for date handling
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.locale('vi');

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date/time in Vietnam timezone for datetime-local input
 * Returns format: "YYYY-MM-DDTHH:mm" (compatible with datetime-local input)
 */
export const getCurrentVietnamDateTime = (): string => {
  return dayjs().tz(VIETNAM_TIMEZONE).format('YYYY-MM-DDTHH:mm');
};

/**
 * Get current date in Vietnam timezone for date input
 * Returns format: "YYYY-MM-DD" (compatible with date input)
 */
export const getCurrentVietnamDate = (): string => {
  return dayjs().tz(VIETNAM_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Format date/time string to Vietnamese locale
 * Input: ISO string or Date object
 * Output: "DD/MM/YYYY HH:mm"
 */
export const formatVietnamDateTime = (dateString: string | Date): string => {
  try {
    return dayjs(dateString).tz(VIETNAM_TIMEZONE).format('DD/MM/YYYY HH:mm');
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
    return dayjs(dateString).tz(VIETNAM_TIMEZONE).format('DD/MM/YYYY');
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
    // Parse the string as Vietnam time and convert to UTC
    return dayjs.tz(localDateTimeString, VIETNAM_TIMEZONE).toISOString();
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
    return dayjs(isoString).tz(VIETNAM_TIMEZONE).format('YYYY-MM-DDTHH:mm');
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
    const date = dayjs(dateString).tz(VIETNAM_TIMEZONE);
    const now = dayjs().tz(VIETNAM_TIMEZONE);
    return date.isBefore(now);
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
    const date = dayjs(dateString);
    const now = dayjs();
    const diffMins = now.diff(date, 'minute');
    const diffHours = now.diff(date, 'hour');
    const diffDays = now.diff(date, 'day');

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    
    return formatVietnamDate(date.toDate());
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
  return dayjs().tz(VIETNAM_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Get current timestamp as Date object (not ISO string)
 * Since server runs in Asia/Ho_Chi_Minh timezone, no conversion needed
 */
export const getCurrentTimestamp = (): Date => {
  return dayjs().tz(VIETNAM_TIMEZONE).toDate();
};

// Ensure timezone is set correctly for the application
export const ensureTimezone = (): void => {
  // Set timezone to Asia/Ho_Chi_Minh if not already set
  if (!process.env.TZ) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
  }
};

/**
 * Convert local datetime input to proper timezone for database storage
 * This function ensures consistent timezone handling across the application
 * 
 * IMPORTANT: Prisma stores DateTime fields in UTC, so we need to convert
 * the local time to UTC before saving to database
 */
export const convertToVietnamTime = (dateTimeString: string): string => {
  try {
    // Parse the datetime string as if it's in Vietnam timezone and convert to UTC
    return dayjs.tz(dateTimeString, VIETNAM_TIMEZONE).toISOString();
  } catch (error) {
    console.error('Error converting to Vietnam time:', error);
    return dayjs().toISOString();
  }
};

/**
 * Get current timestamp in Vietnam timezone for database storage
 */
export const getCurrentVietnamTimestamp = (): string => {
  return dayjs().tz(VIETNAM_TIMEZONE).toISOString();
};
