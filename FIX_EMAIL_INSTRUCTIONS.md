# Fix Email Address Script

This script allows you to update a user's email address in the database, useful for restoring dots in Gmail addresses that were removed by email normalization.

## Usage

### Run the script:

```bash
cd backend
npm run fix-email <oldEmail> <newEmail>
```

### Example:

To fix your email from `mirmurtazacoc@gmail.com` to `mirmurtaza.coc@gmail.com`:

```bash
cd backend
npm run fix-email mirmurtazacoc@gmail.com mirmurtaza.coc@gmail.com
```

## What the script does:

1. ✅ Validates email format
2. ✅ Connects to MongoDB
3. ✅ Finds the user with the old email
4. ✅ Checks if the new email is already in use
5. ✅ Updates the email address
6. ✅ Displays confirmation

## Safety Features:

- ✅ Validates email format before processing
- ✅ Checks if new email already exists (prevents duplicates)
- ✅ Only updates if user is found
- ✅ Provides clear error messages

## Notes:

- The script will automatically convert emails to lowercase
- Gmail treats `mirmurtaza.coc@gmail.com` and `mirmurtazacoc@gmail.com` as the same email, but the script preserves the format you specify
- After running the script, you'll need to log in with the new email format

## Troubleshooting:

**Error: "User with email not found"**
- Make sure you're using the exact email as stored in the database (check the dashboard)

**Error: "Email already in use"**
- The new email is already associated with another account
- Use a different email or check if you're updating the correct account

**Error: "Invalid email format"**
- Make sure both email addresses are valid
- Check for typos

