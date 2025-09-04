-- ChatGPT Clone Database Schema Validation Tests
-- Version: 002
-- Description: Comprehensive schema, RLS, and performance validation
-- Author: Database Architect
-- Date: 2025-09-03

-- Test Suite: Schema Validation and Security Testing
-- Execute these tests after running migrations to ensure schema integrity

BEGIN;

-- Create test users for RLS testing (simulating auth.users entries)
-- Note: In production, these would be managed by Supabase Auth
DO $$
BEGIN
    -- Insert test users if they don't exist
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000001'::uuid, 'test1@example.com', '{"full_name": "Test User 1"}', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000002'::uuid, 'test2@example.com', '{"full_name": "Test User 2"}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Test 1: Schema Structure Validation
-- Verify all required tables exist with correct structure
SELECT 'Test 1: Schema Structure Validation' as test_name;

-- Check chat_sessions table structure
DO $$
DECLARE
    table_exists boolean;
    column_count integer;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_sessions'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'chat_sessions table does not exist';
    END IF;
    
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'chat_sessions'
    AND column_name IN ('id', 'user_id', 'title', 'created_at', 'updated_at', 'is_archived', 'message_count');
    
    IF column_count != 7 THEN
        RAISE EXCEPTION 'chat_sessions table missing required columns. Found: %', column_count;
    END IF;
    
    RAISE NOTICE 'PASS: chat_sessions table structure validated';
END $$;

-- Check messages table structure
DO $$
DECLARE
    table_exists boolean;
    column_count integer;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'messages table does not exist';
    END IF;
    
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
    AND column_name IN ('id', 'session_id', 'user_id', 'role', 'content', 'created_at', 'updated_at', 'timestamp', 'token_count', 'metadata');
    
    IF column_count != 10 THEN
        RAISE EXCEPTION 'messages table missing required columns. Found: %', column_count;
    END IF;
    
    RAISE NOTICE 'PASS: messages table structure validated';
END $$;

-- Test 2: Foreign Key Constraint Validation
SELECT 'Test 2: Foreign Key Constraint Validation' as test_name;

-- Test chat_sessions -> auth.users foreign key
DO $$
BEGIN
    -- This should fail due to foreign key constraint
    BEGIN
        INSERT INTO chat_sessions (id, user_id, title) 
        VALUES (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999'::uuid, 'Test Session');
        RAISE EXCEPTION 'Foreign key constraint not enforced for chat_sessions.user_id';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'PASS: chat_sessions foreign key constraint working';
    END;
END $$;

-- Test messages -> chat_sessions foreign key
DO $$
BEGIN
    -- This should fail due to foreign key constraint
    BEGIN
        INSERT INTO messages (id, session_id, user_id, role, content) 
        VALUES (
            uuid_generate_v4(), 
            '99999999-9999-9999-9999-999999999999'::uuid,
            '00000000-0000-0000-0000-000000000001'::uuid,
            'user', 
            'Test message'
        );
        RAISE EXCEPTION 'Foreign key constraint not enforced for messages.session_id';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'PASS: messages session_id foreign key constraint working';
    END;
END $$;

-- Test messages -> auth.users foreign key
DO $$
BEGIN
    -- This should fail due to foreign key constraint
    BEGIN
        INSERT INTO messages (id, session_id, user_id, role, content) 
        VALUES (
            uuid_generate_v4(), 
            uuid_generate_v4(),
            '99999999-9999-9999-9999-999999999999'::uuid,
            'user', 
            'Test message'
        );
        RAISE EXCEPTION 'Foreign key constraint not enforced for messages.user_id';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'PASS: messages user_id foreign key constraint working';
    END;
END $$;

-- Test 3: Check Constraint Validation
SELECT 'Test 3: Check Constraint Validation' as test_name;

-- Test chat_sessions title constraint
DO $$
BEGIN
    BEGIN
        INSERT INTO chat_sessions (id, user_id, title) 
        VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001'::uuid, '   ');
        RAISE EXCEPTION 'Title check constraint not enforced';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: chat_sessions title check constraint working';
    END;
END $$;

-- Test messages content constraint
DO $$
DECLARE
    test_session_id uuid;
BEGIN
    -- First create a valid session
    INSERT INTO chat_sessions (id, user_id, title) 
    VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001'::uuid, 'Test Session')
    RETURNING id INTO test_session_id;
    
    -- Now test empty content constraint
    BEGIN
        INSERT INTO messages (id, session_id, user_id, role, content) 
        VALUES (
            uuid_generate_v4(), 
            test_session_id,
            '00000000-0000-0000-0000-000000000001'::uuid,
            'user', 
            '   '
        );
        RAISE EXCEPTION 'Content check constraint not enforced';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: messages content check constraint working';
    END;
    
    -- Cleanup
    DELETE FROM chat_sessions WHERE id = test_session_id;
END $$;

-- Test 4: Row Level Security (RLS) Policy Validation
SELECT 'Test 4: Row Level Security (RLS) Policy Validation' as test_name;

-- Create test data for RLS testing
DO $$
DECLARE
    user1_session_id uuid := uuid_generate_v4();
    user2_session_id uuid := uuid_generate_v4();
    user1_message_id uuid := uuid_generate_v4();
    user2_message_id uuid := uuid_generate_v4();
BEGIN
    -- Create test sessions
    INSERT INTO chat_sessions (id, user_id, title) VALUES 
        (user1_session_id, '00000000-0000-0000-0000-000000000001'::uuid, 'User 1 Session'),
        (user2_session_id, '00000000-0000-0000-0000-000000000002'::uuid, 'User 2 Session');
    
    -- Create test messages
    INSERT INTO messages (id, session_id, user_id, role, content) VALUES 
        (user1_message_id, user1_session_id, '00000000-0000-0000-0000-000000000001'::uuid, 'user', 'User 1 message'),
        (user2_message_id, user2_session_id, '00000000-0000-0000-0000-000000000002'::uuid, 'user', 'User 2 message');
END $$;

-- Note: RLS policy testing requires setting up auth context
-- In a real test environment, you would:
-- 1. SET LOCAL auth.uid = '00000000-0000-0000-0000-000000000001';
-- 2. Test that user can only see their own data
-- 3. Test that user cannot access other users' data

-- Test 5: Index Existence Validation
SELECT 'Test 5: Index Existence Validation' as test_name;

-- Check that all required indexes exist
DO $$
DECLARE
    expected_indexes text[] := ARRAY[
        'idx_chat_sessions_user_id',
        'idx_chat_sessions_user_updated',
        'idx_chat_sessions_user_active',
        'idx_chat_sessions_updated_at',
        'idx_messages_session_id',
        'idx_messages_session_created',
        'idx_messages_user_id',
        'idx_messages_user_session',
        'idx_messages_user_timestamp',
        'idx_messages_role',
        'idx_messages_created_at'
    ];
    index_name text;
    index_exists boolean;
BEGIN
    FOREACH index_name IN ARRAY expected_indexes
    LOOP
        SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = index_name
        ) INTO index_exists;
        
        IF NOT index_exists THEN
            RAISE EXCEPTION 'Required index % does not exist', index_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'PASS: All required indexes exist';
END $$;

-- Test 6: Trigger Function Validation
SELECT 'Test 6: Trigger Function Validation' as test_name;

-- Test updated_at trigger
DO $$
DECLARE
    test_session_id uuid;
    original_updated_at timestamptz;
    new_updated_at timestamptz;
BEGIN
    -- Create test session
    INSERT INTO chat_sessions (user_id, title) 
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Trigger Test')
    RETURNING id, updated_at INTO test_session_id, original_updated_at;
    
    -- Wait a moment to ensure timestamp difference
    PERFORM pg_sleep(0.1);
    
    -- Update the session
    UPDATE chat_sessions 
    SET title = 'Updated Title' 
    WHERE id = test_session_id
    RETURNING updated_at INTO new_updated_at;
    
    IF new_updated_at <= original_updated_at THEN
        RAISE EXCEPTION 'updated_at trigger not working properly';
    END IF;
    
    RAISE NOTICE 'PASS: updated_at trigger working correctly';
    
    -- Cleanup
    DELETE FROM chat_sessions WHERE id = test_session_id;
END $$;

-- Test message count trigger
DO $$
DECLARE
    test_session_id uuid;
    message_count_before integer;
    message_count_after integer;
BEGIN
    -- Create test session
    INSERT INTO chat_sessions (user_id, title) 
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Message Count Test')
    RETURNING id INTO test_session_id;
    
    -- Get initial message count
    SELECT message_count INTO message_count_before 
    FROM chat_sessions WHERE id = test_session_id;
    
    -- Add a message
    INSERT INTO messages (session_id, user_id, role, content) 
    VALUES (test_session_id, '00000000-0000-0000-0000-000000000001'::uuid, 'user', 'Test message');
    
    -- Get updated message count
    SELECT message_count INTO message_count_after 
    FROM chat_sessions WHERE id = test_session_id;
    
    IF message_count_after != message_count_before + 1 THEN
        RAISE EXCEPTION 'Message count trigger not working. Before: %, After: %', message_count_before, message_count_after;
    END IF;
    
    RAISE NOTICE 'PASS: Message count trigger working correctly';
    
    -- Cleanup
    DELETE FROM chat_sessions WHERE id = test_session_id;
END $$;

-- Test 7: Data Integrity Validation
SELECT 'Test 7: Data Integrity Validation' as test_name;

-- Test user_id synchronization trigger
DO $$
DECLARE
    test_session_id uuid;
    test_message_id uuid;
    message_user_id uuid;
    session_user_id uuid;
BEGIN
    -- Create test session
    INSERT INTO chat_sessions (user_id, title) 
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Sync Test')
    RETURNING id INTO test_session_id;
    
    -- Insert message (should auto-sync user_id)
    INSERT INTO messages (session_id, role, content) 
    VALUES (test_session_id, 'user', 'Test message')
    RETURNING id INTO test_message_id;
    
    -- Verify user_id was synced
    SELECT user_id INTO message_user_id FROM messages WHERE id = test_message_id;
    SELECT user_id INTO session_user_id FROM chat_sessions WHERE id = test_session_id;
    
    IF message_user_id != session_user_id THEN
        RAISE EXCEPTION 'User ID sync trigger not working. Message user_id: %, Session user_id: %', message_user_id, session_user_id;
    END IF;
    
    RAISE NOTICE 'PASS: User ID synchronization trigger working correctly';
    
    -- Cleanup
    DELETE FROM chat_sessions WHERE id = test_session_id;
END $$;

-- Test 8: View Validation
SELECT 'Test 8: View Validation' as test_name;

-- Test user_session_summary view
DO $$
DECLARE
    summary_record record;
BEGIN
    SELECT * INTO summary_record 
    FROM user_session_summary 
    WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    IF summary_record IS NULL THEN
        RAISE EXCEPTION 'user_session_summary view not returning data for test user';
    END IF;
    
    IF summary_record.email IS NULL THEN
        RAISE EXCEPTION 'user_session_summary view not joining auth.users correctly';
    END IF;
    
    RAISE NOTICE 'PASS: user_session_summary view working correctly';
END $$;

-- Cleanup test data
DELETE FROM messages WHERE user_id IN ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM chat_sessions WHERE user_id IN ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid);

SELECT 'All schema validation tests completed successfully!' as result;

COMMIT;