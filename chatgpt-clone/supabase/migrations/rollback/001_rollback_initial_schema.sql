-- Rollback script for 001_initial_schema.sql
-- Description: Safely removes all objects created in initial schema migration
-- Date: 2025-09-02

BEGIN;

-- Drop views first
DROP VIEW IF EXISTS user_session_summary;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_empty_sessions();
DROP FUNCTION IF EXISTS update_session_message_count();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop triggers (will be automatically dropped with functions, but explicit for clarity)
DROP TRIGGER IF EXISTS update_session_message_count_trigger ON messages;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_role;
DROP INDEX IF EXISTS idx_messages_session_created;
DROP INDEX IF EXISTS idx_messages_session_id;

DROP INDEX IF EXISTS idx_chat_sessions_updated_at;
DROP INDEX IF EXISTS idx_chat_sessions_user_active;
DROP INDEX IF EXISTS idx_chat_sessions_user_updated;
DROP INDEX IF EXISTS idx_chat_sessions_user_id;

DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_provider_id;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS users;

-- Drop custom types
DROP TYPE IF EXISTS message_role;

-- Note: We don't drop extensions as they might be used by other schemas
-- Extensions uuid-ossp and pgcrypto will remain

COMMIT;