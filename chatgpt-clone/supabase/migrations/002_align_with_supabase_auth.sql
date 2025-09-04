-- ChatGPT Clone Database Schema Migration
-- Version: 002
-- Description: Align schema with Supabase auth.users and add user_id to messages
-- Author: Database Architect
-- Date: 2025-09-03

BEGIN;

-- Drop existing users table and related constraints since we'll use Supabase's auth.users
-- First, we need to handle the foreign key constraints

-- Add user_id column to messages table (referencing auth.users)
ALTER TABLE messages ADD COLUMN user_id UUID;

-- Update existing messages to have user_id from their chat_sessions
UPDATE messages 
SET user_id = cs.user_id 
FROM chat_sessions cs 
WHERE messages.session_id = cs.id;

-- Make user_id NOT NULL after populating it
ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to auth.users
ALTER TABLE messages ADD CONSTRAINT fk_messages_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update chat_sessions to reference auth.users instead of custom users table
-- First drop the existing foreign key constraint
ALTER TABLE chat_sessions DROP CONSTRAINT chat_sessions_user_id_fkey;

-- Add new foreign key constraint to auth.users
ALTER TABLE chat_sessions ADD CONSTRAINT fk_chat_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add timestamp column as alias for created_at in messages (for backward compatibility)
-- Note: We keep created_at as the primary timestamp and add timestamp as computed column
ALTER TABLE messages ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE 
    GENERATED ALWAYS AS (created_at) STORED;

-- Update indexes to include user_id for messages table
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_user_session ON messages(user_id, session_id);
CREATE INDEX idx_messages_user_timestamp ON messages(user_id, created_at DESC);

-- Drop the custom users table (this will cascade to related objects)
-- First drop the view that depends on it
DROP VIEW IF EXISTS user_session_summary;

-- Drop indexes on users table
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_provider_id;
DROP INDEX IF EXISTS idx_users_active;

-- Drop triggers on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Now drop the users table
DROP TABLE IF EXISTS users CASCADE;

-- Update RLS policies for messages to also check user_id directly
-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- Create enhanced RLS policies for messages table
-- Users can access messages they own directly OR through session ownership
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE 
    USING (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE 
    USING (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Update chat_sessions RLS policies to use auth.uid() directly
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create a new view for user session summary using auth.users
CREATE VIEW user_session_summary AS
SELECT 
    au.id as user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as name,
    COUNT(cs.id) as total_sessions,
    COUNT(cs.id) FILTER (WHERE cs.is_archived = false) as active_sessions,
    COALESCE(SUM(cs.message_count), 0) as total_messages,
    MAX(cs.updated_at) as last_activity
FROM auth.users au
LEFT JOIN chat_sessions cs ON au.id = cs.user_id
GROUP BY au.id, au.email, au.raw_user_meta_data->>'full_name';

-- Add RLS policy for the view
ALTER VIEW user_session_summary OWNER TO postgres;

-- Create function to sync message user_id with session user_id (data integrity)
CREATE OR REPLACE FUNCTION sync_message_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT, ensure user_id matches session owner
    IF TG_OP = 'INSERT' THEN
        SELECT user_id INTO NEW.user_id 
        FROM chat_sessions 
        WHERE id = NEW.session_id;
        
        IF NEW.user_id IS NULL THEN
            RAISE EXCEPTION 'Invalid session_id: session does not exist or user does not have access';
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- For UPDATE, prevent changing user_id to mismatch session owner
    IF TG_OP = 'UPDATE' THEN
        IF OLD.session_id != NEW.session_id OR OLD.user_id != NEW.user_id THEN
            DECLARE
                session_user_id UUID;
            BEGIN
                SELECT user_id INTO session_user_id 
                FROM chat_sessions 
                WHERE id = NEW.session_id;
                
                IF session_user_id != NEW.user_id THEN
                    RAISE EXCEPTION 'user_id must match the session owner';
                END IF;
            END;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain data integrity
CREATE TRIGGER sync_message_user_id_trigger
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION sync_message_user_id();

COMMIT;