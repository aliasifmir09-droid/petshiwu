# Password Expiry Policy - Dashboard Users

## Overview

This system implements a **30-day password expiry policy** for all dashboard users (Admin and Staff) to enhance security. Regular customers are exempt from this policy.

## Security Policy

- ✅ **Dashboard users** (Admin & Staff) must change their password every **30 days**
- ✅ **Customers** are **exempt** from password expiry
- ✅ Users receive warnings when their password is approaching expiration
- ✅ Users are forced to change password when it expires
- ✅ Password change automatically extends the expiry by another 30 days

## How It Works

### 1. Automatic Tracking

When a dashboard user changes their password, the system automatically:
- Sets `passwordChangedAt` to the current date
- Sets `passwordExpiresAt` to 30 days from now
- Resets the expiry timer

### 2. User Notifications

Users see different warnings based on how close they are to expiry:

| Days Until Expiry | Warning Level | Behavior |
|-------------------|---------------|----------|
| 8+ days | No warning | Normal operation |
| 4-7 days | Amber warning | Dismissible banner |
| 1-3 days | Red warning | Dismissible banner |
| 0 days (Expired) | Critical | Forced modal, cannot dismiss |

### 3. Warning Messages

- **7 days before**: "Your password will expire in X days. Please change it soon."
- **1 day before**: "Your password expires tomorrow! Please change it soon."
- **Expired**: "Your password has expired! You must change it now to continue using the system."

## User Experience

### Dashboard Banner
When password is expiring soon, users see a banner at the top of all pages:
- Shows days remaining
- "Change Password Now" button (takes user directly to settings)
- "Remind Me Later" button (dismissible for non-expired passwords)

### Force Change Modal
When password has expired:
- Full-screen modal that cannot be dismissed
- User must click "Change Password Now"
- Redirected to Settings > Change Password tab

## Implementation Details

### Database Schema

```typescript
{
  passwordChangedAt: Date,      // When password was last changed
  passwordExpiresAt: Date        // When password will expire (30 days after change)
}
```

### API Response

The `/api/auth/me` endpoint returns additional fields for dashboard users:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "admin@example.com",
    "role": "admin",
    "passwordExpired": false,
    "daysUntilPasswordExpires": 15
  }
}
```

## Setup Instructions

### For New Installations

The password expiry feature is automatically enabled. When users create or change their password, the expiry dates are set automatically.

### For Existing Installations

Run the migration script to set initial expiry dates for existing users:

```bash
# Navigate to backend directory
cd backend

# Run the migration
npm run update-password-expiry
```

This will:
- Find all admin and staff users without expiry dates
- Set `passwordChangedAt` to now
- Set `passwordExpiresAt` to 30 days from now
- Display confirmation of updated users

**Important**: After running this script, all existing dashboard users will have 30 days to change their password.

## Password Requirements

When changing password, the new password must meet these security requirements:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)

Example valid passwords:
- `MySecure123`
- `AdminPass123`
- `StaffPwd2024`

## Technical Components

### Backend

1. **User Model** (`backend/src/models/User.ts`)
   - Added `passwordChangedAt` and `passwordExpiresAt` fields
   - Methods: `isPasswordExpired()`, `getDaysUntilPasswordExpires()`
   - Pre-save hook updates dates on password change

2. **Auth Controller** (`backend/src/controllers/authController.ts`)
   - Returns expiry info in `/api/auth/me` response

3. **Migration Script** (`backend/src/utils/updatePasswordExpiry.ts`)
   - One-time script to update existing users

### Frontend

1. **PasswordExpiryWarning Component** (`admin/src/components/PasswordExpiryWarning.tsx`)
   - Shows warnings/modals based on password age
   - Handles user interactions

2. **Settings Page** (`admin/src/pages/Settings.tsx`)
   - Supports `?tab=password` URL parameter
   - Dedicated password change interface

3. **App Integration** (`admin/src/App.tsx`)
   - PasswordExpiryWarning displayed on all authenticated pages

## Security Benefits

1. **Regular Password Rotation**: Reduces risk of compromised credentials
2. **Forced Compliance**: Expired passwords cannot be bypassed
3. **Progressive Warnings**: Users get advance notice to change passwords
4. **Customer Exemption**: Policy only applies to sensitive dashboard accounts
5. **Audit Trail**: Track when passwords were last changed

## Support & Troubleshooting

### User Reports "Cannot Login"

If a user cannot login and sees password expiry warnings:
1. Confirm their password has indeed expired
2. Have them use the "Change Password Now" button
3. Ensure new password meets all requirements
4. Verify `passwordExpiresAt` is updated in database

### Resetting Expiry for a User

As an admin, you can manually update a user's password expiry in Staff Management:
1. Go to Settings > Staff Management
2. Edit the user
3. Change their password (optional but will reset expiry)
4. Or manually update in database if needed

### Disabling for Specific Users

The policy automatically applies to all `admin` and `staff` roles. To exempt a specific user, you would need to:
1. Change their role (not recommended)
2. Or modify the code to add an exemption flag (requires development)

## Future Enhancements

Potential improvements for this feature:
- Configurable expiry period (e.g., 60 days, 90 days)
- Email notifications for upcoming expiry
- Password history to prevent reuse
- More granular role-based policies
- Admin dashboard to view all users' password ages

## Compliance

This feature helps meet common security compliance requirements:
- NIST 800-63B password guidelines
- SOC 2 access control requirements
- PCI DSS password management policies
- General data protection best practices

---

**Last Updated**: October 29, 2025
**Version**: 1.0
**Maintained By**: Development Team

