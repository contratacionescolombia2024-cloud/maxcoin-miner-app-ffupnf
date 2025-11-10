
# Admin Setup Instructions

## Admin User Details

**Email**: contratacionescolombia2024@gmail.com  
**Username**: admin  
**User ID**: 30ad2b26-252f-4d4a-a35a-bc01684cc557  
**Referral Code**: ADMINb5145c (auto-generated)  
**Unique ID**: MXI-ADMINdfc8567430 (auto-generated)

## Setting Up Admin Password

Since the admin user was created directly in the database, you need to set up authentication through Supabase:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Invite User"** or **"Add User"**
4. Enter email: `contratacionescolombia2024@gmail.com`
5. Set a secure password (minimum 6 characters)
6. Confirm the user creation
7. The user will be linked to the existing database profile

### Option 2: Via Password Reset

1. Go to the login screen in the app
2. Click "Forgot Password" (if available)
3. Enter: `contratacionescolombia2024@gmail.com`
4. Check email for reset link
5. Set new password
6. Login with new credentials

### Option 3: Via SQL (Advanced)

If you need to manually link the Supabase Auth user to the database profile:

```sql
-- First, create the auth user via Supabase Dashboard
-- Then update the database profile to match the auth user ID

UPDATE users 
SET id = 'YOUR_AUTH_USER_ID_HERE'
WHERE email = 'contratacionescolombia2024@gmail.com';
```

## Admin Privileges

The admin user has the following privileges:

### ✅ Full Access Features
- Access to Admin Panel (`/admin`)
- Access to User Management (`/admin-users`)
- View all user data
- Modify system configuration
- Manage mining rates
- Configure lottery settings
- View all transactions
- Block/unblock users
- Transfer balances

### ✅ Pre-configured Settings
- Email verified: ✅ Yes
- Mining access: ✅ Enabled
- First purchase: ✅ Completed
- Account status: ✅ Active (not blocked)

## Admin Panel Access

### Navigation
1. Login with admin credentials
2. Go to Profile tab
3. Scroll down to find "Admin Panel" button
4. Access admin features

### Admin Panel Features

#### Configuration Tab
- Mining rate per minute
- Power increase threshold
- Power increase percentage
- Minimum purchase amount
- Maximum purchase amount
- Commission rates (Level 1, 2, 3)

#### Lottery Configuration
- Ticket price
- Max tickets per user
- Draw frequency
- Prize pool percentage
- Winner count

#### User Management
- View all registered users
- Search users by username/email
- View user balances and metrics
- Block/unblock users
- Transfer balances between users
- View referral networks

## Security Recommendations

### Password Requirements
- Minimum 12 characters
- Include uppercase and lowercase letters
- Include numbers
- Include special characters
- Don't share with anyone
- Change regularly

### Access Control
- Only use admin account for administrative tasks
- Create separate account for personal use
- Log out after admin sessions
- Monitor admin activity logs
- Review user actions regularly

### Two-Factor Authentication (Future)
Consider enabling 2FA for the admin account when available:
- Adds extra security layer
- Protects against unauthorized access
- Recommended for production environments

## Testing Admin Access

### Step-by-Step Test
1. **Login Test**
   ```
   Email: contratacionescolombia2024@gmail.com
   Password: [Your set password]
   ```

2. **Profile Verification**
   - Check balance shows correctly
   - Verify mining access is enabled
   - Confirm admin status

3. **Admin Panel Access**
   - Navigate to Profile → Admin Panel
   - Verify configuration options load
   - Test saving configuration changes

4. **User Management**
   - Navigate to Admin Panel → User Management
   - View user list
   - Test user search functionality
   - Verify user metrics display

## Troubleshooting

### Cannot Login
**Problem**: Admin email/password not working  
**Solution**: 
- Verify email is exactly: `contratacionescolombia2024@gmail.com`
- Check password was set correctly
- Try password reset flow
- Check Supabase Auth dashboard for user status

### Admin Panel Not Showing
**Problem**: Admin panel button not visible  
**Solution**:
- Verify logged in with admin email
- Check `app/(tabs)/profile.tsx` for ADMIN_EMAIL constant
- Ensure it matches: `contratacionescolombia2024@gmail.com`
- Restart app if needed

### Database Connection Issues
**Problem**: Cannot load user data  
**Solution**:
- Check Supabase project is active
- Verify RLS policies are enabled
- Check network connection
- Review Supabase logs for errors

### Permission Denied Errors
**Problem**: Cannot access certain features  
**Solution**:
- Verify user ID matches in auth and database
- Check RLS policies allow admin access
- Ensure email_verified is true
- Confirm is_blocked is false

## Admin Responsibilities

### Daily Tasks
- Monitor new user registrations
- Review transaction activity
- Check for suspicious activity
- Respond to user issues

### Weekly Tasks
- Review system metrics
- Analyze mining statistics
- Check referral program performance
- Update configuration if needed

### Monthly Tasks
- Review security logs
- Analyze user growth
- Optimize system performance
- Plan feature updates

## Support Contacts

### Technical Issues
- Check Supabase dashboard logs
- Review application console logs
- Check database query performance
- Monitor API response times

### Database Issues
- Project ID: lgorebanzkwinlnswmrj
- Check table structures
- Verify RLS policies
- Review migration history

## Important Notes

⚠️ **Security Warnings**
- Never share admin credentials
- Don't use admin account for testing
- Always log out after admin sessions
- Monitor for unauthorized access attempts

✅ **Best Practices**
- Regular password changes
- Monitor user activity
- Keep documentation updated
- Backup important data
- Test changes in development first

📝 **Documentation**
- Keep this file secure
- Update when making changes
- Share only with authorized personnel
- Document all admin actions

## Quick Reference

### Admin Email
```
contratacionescolombia2024@gmail.com
```

### Admin Panel URL
```
/admin
```

### User Management URL
```
/admin-users
```

### Database Table
```sql
SELECT * FROM users WHERE email = 'contratacionescolombia2024@gmail.com';
```

### Check Admin Status
```sql
SELECT 
  username,
  email,
  email_verified,
  has_mining_access,
  has_first_purchase,
  is_blocked
FROM users 
WHERE email = 'contratacionescolombia2024@gmail.com';
```

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready ✅
