-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('chat_sessions', 'messages');

-- Option 1: Create permissive policy for chat_sessions
DROP POLICY IF EXISTS "Allow all operations for service role" ON chat_sessions;
CREATE POLICY "Allow all operations for service role" 
ON chat_sessions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Option 2: Create permissive policy for authenticated and anon users
DROP POLICY IF EXISTS "Allow session creation" ON chat_sessions;
CREATE POLICY "Allow session creation" 
ON chat_sessions 
FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow session read" ON chat_sessions;
CREATE POLICY "Allow session read" 
ON chat_sessions 
FOR SELECT 
TO authenticated, anon 
USING (true);

DROP POLICY IF EXISTS "Allow session update" ON chat_sessions;
CREATE POLICY "Allow session update" 
ON chat_sessions 
FOR UPDATE 
TO authenticated, anon 
USING (true) 
WITH CHECK (true);

-- Same for messages table
DROP POLICY IF EXISTS "Allow all operations for service role on messages" ON messages;
CREATE POLICY "Allow all operations for service role on messages" 
ON messages 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow message creation" ON messages;
CREATE POLICY "Allow message creation" 
ON messages 
FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow message read" ON messages;
CREATE POLICY "Allow message read" 
ON messages 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- Alternatively, if you want to completely disable RLS for development:
-- ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;