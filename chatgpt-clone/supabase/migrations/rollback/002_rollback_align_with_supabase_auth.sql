-- ChatGPT Clone Database Schema Rollback
-- Version: 002 Rollback
-- Description: Rollback alignment with Supabase auth.users
-- Author: Database Architect
-- Date: 2025-09-03

BEGIN;

-- Drop the data integrity trigger and function
DROP TRIGGER IF EXISTS sync_message_user_id_trigger ON messages;
DROP FUNCTION IF EXISTS sync_message_user_id();

-- Drop the updated view
DROP VIEW IF EXISTS user_session_summary;

-- Recreate the custom users table with original structure
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'google' NOT NULL,
    provider_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_check CHECK (LENGTH(TRIM(name)) > 0)
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_id ON users(provider, provider_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Recreate users table trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate users table RLS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT 
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid()::text = id::text);

-- Drop foreign key constraints that reference auth.users
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS fk_chat_sessions_user_id;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_user_id;

-- Recreate original foreign key constraint for chat_sessions
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove user_id column from messages and timestamp column
ALTER TABLE messages DROP COLUMN IF EXISTS user_id;
ALTER TABLE messages DROP COLUMN IF EXISTS timestamp;

-- Drop new indexes on messages
DROP INDEX IF EXISTS idx_messages_user_id;
DROP INDEX IF EXISTS idx_messages_user_session;
DROP INDEX IF EXISTS idx_messages_user_timestamp;

-- Restore original RLS policies for chat_sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE 
    USING (auth.uid()::text = user_id::text);

-- Restore original RLS policies for messages
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id::text = auth.uid()::text
        )
    );

-- Recreate original view
CREATE VIEW user_session_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(cs.id) as total_sessions,
    COUNT(cs.id) FILTER (WHERE cs.is_archived = false) as active_sessions,
    COALESCE(SUM(cs.message_count), 0) as total_messages,
    MAX(cs.updated_at) as last_activity
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
GROUP BY u.id, u.name, u.email;

COMMIT;