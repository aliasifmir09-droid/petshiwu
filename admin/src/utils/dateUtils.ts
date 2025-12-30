/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Formats a date to a consistent format: MM/DD/YYYY
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | number | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Formats a date with time: MM/DD/YYYY HH:MM AM/PM
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date | number | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Normalizes month names to a consistent format
 * Handles various month name formats from backend (full names, abbreviations, etc.)
 * @param month - Month name in any format
 * @returns Normalized month abbreviation (Jan, Feb, etc.)
 */
export const normalizeMonthName = (month: string): string => {
  if (!month || typeof month !== 'string') return month;
  
  const monthMap: Record<string, string> = {
    'january': 'Jan',
    'jan': 'Jan',
    'february': 'Feb',
    'feb': 'Feb',
    'march': 'Mar',
    'mar': 'Mar',
    'april': 'Apr',
    'apr': 'Apr',
    'may': 'May',
    'june': 'Jun',
    'jun': 'Jun',
    'july': 'Jul',
    'jul': 'Jul',
    'august': 'Aug',
    'aug': 'Aug',
    'september': 'Sep',
    'sept': 'Sep',
    'october': 'Oct',
    'oct': 'Oct',
    'november': 'Nov',
    'nov': 'Nov',
    'december': 'Dec',
    'dec': 'Dec',
  };
  
  const normalized = month.toLowerCase().trim();
  return monthMap[normalized] || month; // Return original if not found
};

