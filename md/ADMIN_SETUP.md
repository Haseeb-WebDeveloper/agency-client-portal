# Admin Account Setup Guide

This guide explains how to create a platform admin account for the Agency Client Portal using both the Supabase dashboard and the provided scripts.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with the database schema deployed
2. **Environment Variables**: Ensure your `.env.local` file contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_url
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## Method 1: Using the Script (Recommended)

### Step 1: Run the Admin Creation Script

```bash
# Create a platform admin
bun run scripts/create-admin.ts admin@yourcompany.com "John" "Doe" "CREATIVE_DIRECTOR"
```

**Parameters:**
- `email`: Admin's email address
- `firstName`: Admin's first name
- `lastName`: Admin's last name
- `agencyFunction`: Agency function (optional, defaults to CREATIVE_DIRECTOR)

**Available Agency Functions:**
- `DESIGNER`
- `DEVELOPER`
- `SALES`
- `PROJECT_MANAGER`
- `ACCOUNT_MANAGER`
- `CREATIVE_DIRECTOR`
- `TECHNICAL_LEAD`

### Step 2: Verify Account Creation

The script will output:
- User ID in Supabase Auth
- Database user ID
- Email and name
- Role and agency function
- Next steps for login

## Method 2: Using Supabase Dashboard

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users**

### Step 2: Create User in Auth

1. Click **"Add user"**
2. Fill in the details:
   - **Email**: `admin@yourcompany.com`
   - **Password**: Generate a secure password
   - **Email Confirm**: ✅ Check this box
3. Click **"Create user"**
4. Note the **User UID** (you'll need this)

### Step 3: Create User in Database

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL query (replace the values):

```sql
-- Insert the user record
INSERT INTO users (
  id,
  "authId",
  email,
  "firstName",
  "lastName",
  role,
  "isActive",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy"
) VALUES (
  gen_random_uuid(),
  'USER_UID_FROM_STEP_2',
  'admin@yourcompany.com',
  'John',
  'Doe',
  'PLATFORM_ADMIN',
  true,
  now(),
  now(),
  'USER_UID_FROM_STEP_2',
  'USER_UID_FROM_STEP_2'
);

-- Get the user ID for the next step
SELECT id FROM users WHERE "authId" = 'USER_UID_FROM_STEP_2';
```

### Step 4: Create Agency Membership

```sql
-- Insert agency membership (replace USER_ID with the ID from previous query)
INSERT INTO agency_memberships (
  id,
  "userId",
  function,
  "isActive",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy"
) VALUES (
  gen_random_uuid(),
  'USER_ID_FROM_PREVIOUS_QUERY',
  'CREATIVE_DIRECTOR',
  true,
  now(),
  now(),
  'USER_ID_FROM_PREVIOUS_QUERY',
  'USER_ID_FROM_PREVIOUS_QUERY'
);
```

### Step 5: Create Activity Log

```sql
-- Log the admin creation activity
INSERT INTO activities (
  id,
  "actorId",
  verb,
  "targetType",
  "targetId",
  metadata,
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy"
) VALUES (
  gen_random_uuid(),
  'USER_ID_FROM_PREVIOUS_QUERY',
  'CREATED',
  'user',
  'USER_ID_FROM_PREVIOUS_QUERY',
  '{"action": "admin_account_created", "email": "admin@yourcompany.com", "role": "PLATFORM_ADMIN"}',
  now(),
  now(),
  'USER_ID_FROM_PREVIOUS_QUERY',
  'USER_ID_FROM_PREVIOUS_QUERY'
);
```

## Login Process

### For Admin Users

1. **Magic Link Login**: 
   - Go to `/login`
   - Enter the admin email
   - Click "Login"
   - Check email for magic link
   - Click the link to authenticate

2. **Direct Login** (if password was set):
   - Use the email and password in Supabase Auth

### User Management

Once logged in as admin, you can:

1. **Create New Users**: Use the admin panel to create client accounts, agency members, etc.
2. **Send Magic Links**: Send magic links to existing users
3. **Manage Permissions**: Control access to different parts of the platform

## Security Notes

1. **No Public Signup**: Users cannot sign up on their own - only admins can create accounts
2. **Magic Link Only**: Primary authentication method is magic links (no passwords for regular users)
3. **Role-Based Access**: Different user roles have different access levels
4. **Audit Trail**: All actions are logged in the activities table

## Troubleshooting

### Common Issues

1. **"User not found" error**: 
   - Ensure the user exists in both Supabase Auth and your database
   - Check that `authId` matches the Supabase user UID

2. **Permission denied**:
   - Verify the user has the correct role in the database
   - Check that `isActive` is set to `true`

3. **Magic link not working**:
   - Check your `NEXT_PUBLIC_SITE_URL` environment variable
   - Ensure the auth callback route is properly configured

### Verification Queries

```sql
-- Check if user exists and is active
SELECT u.*, am.function as agency_function
FROM users u
LEFT JOIN agency_memberships am ON u.id = am."userId"
WHERE u.email = 'admin@yourcompany.com'
AND u."deletedAt" IS NULL;

-- Check recent activities
SELECT * FROM activities 
WHERE "actorId" = (SELECT id FROM users WHERE email = 'admin@yourcompany.com')
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Next Steps

After creating the admin account:

1. **Test Login**: Verify you can login with magic link
2. **Create Test Data**: Set up some test clients and projects
3. **Configure Permissions**: Set up RLS policies in Supabase
4. **Create More Users**: Use the admin panel to create additional users as needed

For any issues, check the application logs and Supabase logs for detailed error messages.
