-- Row Level Security (RLS) Policies for Realtime Messaging
-- These policies are required for Supabase Realtime to work properly

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on room_participants table
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Policy for selecting messages (users can only see messages in rooms they're part of)
CREATE POLICY "Users can view messages in their rooms" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp."roomId" = messages."roomId"
    AND rp."userId" = auth.uid()
    AND rp."isActive" = true
    AND rp."deletedAt" IS NULL
  )
);

-- Policy for inserting messages (users can only send messages to rooms they're part of)
CREATE POLICY "Users can send messages to their rooms" ON messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp."roomId" = messages."roomId"
    AND rp."userId" = auth.uid()
    AND rp."isActive" = true
    AND rp."deletedAt" IS NULL
  )
);

-- Policy for updating messages (users can only edit their own messages)
CREATE POLICY "Users can edit their own messages" ON messages
FOR UPDATE USING (
  "userId" = auth.uid()
) WITH CHECK (
  "userId" = auth.uid()
);

-- Policy for deleting messages (users can only delete their own messages)
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (
  "userId" = auth.uid()
);

-- Policy for selecting rooms (users can only see rooms they're part of)
CREATE POLICY "Users can view rooms they're part of" ON rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp."roomId" = rooms.id
    AND rp."userId" = auth.uid()
    AND rp."isActive" = true
    AND rp."deletedAt" IS NULL
  )
);

-- Policy for selecting room participants (users can see participants in rooms they're part of)
CREATE POLICY "Users can view room participants in their rooms" ON room_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp."roomId" = room_participants."roomId"
    AND rp."userId" = auth.uid()
    AND rp."isActive" = true
    AND rp."deletedAt" IS NULL
  )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE messages TO authenticated;
GRANT ALL ON TABLE rooms TO authenticated;
GRANT ALL ON TABLE room_participants TO authenticated;