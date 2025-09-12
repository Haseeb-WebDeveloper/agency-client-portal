# Row Level Security (RLS) Setup for Realtime Messaging

This document explains how to set up Row Level Security (RLS) policies required for Supabase Realtime to work properly with the messaging system.

## Why RLS is Required

Supabase Realtime requires RLS policies to be enabled on tables that you want to subscribe to. Without proper RLS policies, the Realtime channel will fail with a CHANNEL_ERROR, which is what you're seeing in the console.

## Setup Instructions

### 1. Run the RLS Policies Script

Execute the SQL script located at `src/lib/rls-policies.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `src/lib/rls-policies.sql`
4. Paste and run the SQL script

### 2. Verify RLS is Enabled

You can verify that RLS is enabled by running this query in your Supabase SQL Editor:

```sql
SELECT tablename, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND tablename IN ('messages', 'rooms', 'room_participants');
```

All tables should show `t` (true) for `relrowsecurity`.

### 3. Test the Realtime Connection

After applying the RLS policies:

1. Restart your development server
2. Navigate to a chat room
3. The Realtime subscription should now work without errors

## Troubleshooting

### If You Still See CHANNEL_ERROR

1. **Check User Permissions**: Ensure the authenticated user has proper access to the room
2. **Verify Room Participation**: Make sure the user is an active participant in the room
3. **Check for Soft Deletes**: Ensure no records are soft-deleted (check `deletedAt` columns)
4. **Review Policies**: Verify the RLS policies are correctly applied

### Debugging Queries

You can test your policies with these queries:

```sql
-- Test if current user can see messages in a specific room
SELECT * FROM messages
WHERE "roomId" = 'YOUR_ROOM_ID'
LIMIT 5;

-- Test if current user is a participant in a room
SELECT * FROM room_participants
WHERE "roomId" = 'YOUR_ROOM_ID'
AND "userId" = auth.uid()
AND "isActive" = true;
```

## Security Notes

The provided RLS policies ensure that:

- Users can only see messages in rooms they are active participants of
- Users can only send messages to rooms they are active participants of
- Users can only edit/delete their own messages
- Users can only see rooms they are part of
- Users can only see other participants in rooms they are part of

These policies maintain data isolation while allowing the Realtime functionality to work properly.

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guidelines-and-limitations/realtime)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
