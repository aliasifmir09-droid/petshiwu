/**
 * Privacy utilities for handling sensitive customer data
 * Provides functions to mask or format customer information appropriately
 */

/**
 * Masks customer name for privacy - shows first name and last initial
 * Example: "John Doe" -> "John D."
 */
export const maskCustomerName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) {
    return 'Guest';
  }
  
  if (firstName && lastName) {
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  }
  
  if (firstName) {
    return firstName;
  }
  
  if (lastName) {
    return `${lastName.charAt(0).toUpperCase()}.`;
  }
  
  return 'Guest';
};

/**
 * Gets customer initials for display
 * Example: "John Doe" -> "JD"
 */
export const getCustomerInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) {
    return 'G';
  }
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}` || 'G';
};

/**
 * Checks if user has permission to view full customer data
 * In a real implementation, this would check user roles/permissions
 */
export const canViewFullCustomerData = (userRole?: string, permissions?: any): boolean => {
  // Admins can always view full data
  if (userRole === 'admin') {
    return true;
  }
  
  // Check for specific permission
  if (permissions?.canViewCustomerData) {
    return true;
  }
  
  // Default to masked data for privacy
  return false;
};

