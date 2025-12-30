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

