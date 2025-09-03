-- Schema Validation Tests for ChatGPT Clone Database
-- Description: Comprehensive test suite for database schema integrity
-- Date: 2025-09-02

-- Test 1: Table existence and structure validation
DO $$
BEGIN
    -- Check if all required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Table users does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_sessions') THEN
        RAISE EXCEPTION 'Table chat_sessions does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        RAISE EXCEPTION 'Table messages does not exist';
    END IF;
    
    RAISE NOTICE 'All required tables exist';
END $$;

-- Test 2: Foreign key constraint validation
DO $$
BEGIN
    -- Test chat_sessions -> users foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'chat_sessions' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint chat_sessions.user_id -> users.id is missing';
    END IF;
    
    -- Test messages -> chat_sessions foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'messages' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'session_id'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint messages.session_id -> chat_sessions.id is missing';
    END IF;
    
    RAISE NOTICE 'All foreign key constraints are properly defined';
END $$;

-- Test 3: Index existence validation
DO $$
DECLARE
    expected_indexes TEXT[] := ARRAY[
        'idx_users_email',
        'idx_users_provider_id', 
        'idx_users_active',
        'idx_chat_sessions_user_id',
        'idx_chat_sessions_user_updated',
        'idx_chat_sessions_user_active',
        'idx_chat_sessions_updated_at',
        'idx_messages_session_id',
        'idx_messages_session_created',
        'idx_messages_role',
        'idx_messages_created_at'
    ];
    idx TEXT;
BEGIN
    FOREACH idx IN ARRAY expected_indexes
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = idx
        ) THEN
            RAISE EXCEPTION 'Expected index % is missing', idx;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All expected indexes exist';
END $$;

-- Test 4: RLS Policy validation
DO $$
BEGIN
    -- Check if RLS is enabled on all tables
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'users' AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on users table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'chat_sessions' AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on chat_sessions table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'messages' AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on messages table';
    END IF;
    
    RAISE NOTICE 'RLS is enabled on all required tables';
END $$;

-- Test 5: Trigger validation
DO $$
BEGIN
    -- Check for update timestamp triggers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_users_updated_at'
    ) THEN
        RAISE EXCEPTION 'Missing trigger: update_users_updated_at';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_chat_sessions_updated_at'
    ) THEN
        RAISE EXCEPTION 'Missing trigger: update_chat_sessions_updated_at';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_messages_updated_at'
    ) THEN
        RAISE EXCEPTION 'Missing trigger: update_messages_updated_at';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_session_message_count_trigger'
    ) THEN
        RAISE EXCEPTION 'Missing trigger: update_session_message_count_trigger';
    END IF;
    
    RAISE NOTICE 'All required triggers exist';
END $$;

-- Test 6: Check constraint validation
DO $$
BEGIN
    -- Test users table constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'users_email_check'
    ) THEN
        RAISE EXCEPTION 'Missing constraint: users_email_check';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'users_name_check'
    ) THEN
        RAISE EXCEPTION 'Missing constraint: users_name_check';
    END IF;
    
    -- Test chat_sessions table constraints  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chat_sessions_title_check'
    ) THEN
        RAISE EXCEPTION 'Missing constraint: chat_sessions_title_check';
    END IF;
    
    -- Test messages table constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'messages_content_check'
    ) THEN
        RAISE EXCEPTION 'Missing constraint: messages_content_check';
    END IF;
    
    RAISE NOTICE 'All check constraints are properly defined';
END $$;

-- Test 7: Data type validation
DO $$
BEGIN
    -- Verify enum type exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'message_role'
    ) THEN
        RAISE EXCEPTION 'Custom type message_role does not exist';
    END IF;
    
    -- Verify UUID columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE EXCEPTION 'users.id is not UUID type';
    END IF;
    
    RAISE NOTICE 'All data types are correctly defined';
END $$;

-- Success message
SELECT 'Schema validation completed successfully' AS result;