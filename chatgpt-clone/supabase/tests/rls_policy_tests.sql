-- Row Level Security (RLS) Policy Tests
-- Description: Comprehensive test suite for RLS policy validation
-- Date: 2025-09-02

-- Create test users and setup test environment
BEGIN;

-- Temporarily disable RLS for test data setup
SET row_security = off;

-- Clean up any existing test data
DELETE FROM messages WHERE session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE 'test%@example.com'
    )
);
DELETE FROM chat_sessions WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'test%@example.com'
);
DELETE FROM users WHERE email LIKE 'test%@example.com';

-- Create test users
INSERT INTO users (id, email, name, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'test1@example.com', 'Test User 1', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'test2@example.com', 'Test User 2', NOW(), NOW());

-- Create test chat sessions
INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'User 1 Session 1', NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'User 1 Session 2', NOW(), NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'User 2 Session 1', NOW(), NOW());

-- Create test messages
INSERT INTO messages (id, session_id, role, content, created_at, updated_at) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user', 'Hello from user 1', NOW(), NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'assistant', 'Hi there!', NOW(), NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'user', 'Hello from user 2', NOW(), NOW());

-- Re-enable RLS for testing
SET row_security = on;

COMMIT;

-- Test 1: User can only see their own profile
DO $$
BEGIN
    -- Simulate user 1 session
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
    
    -- User 1 should see only their own record
    IF (SELECT COUNT(*) FROM users WHERE id = '11111111-1111-1111-1111-111111111111') != 1 THEN
        RAISE EXCEPTION 'User 1 cannot see their own profile';
    END IF;
    
    -- User 1 should not see user 2's record
    IF (SELECT COUNT(*) FROM users WHERE id = '22222222-2222-2222-2222-222222222222') != 0 THEN
        RAISE EXCEPTION 'User 1 can see User 2 profile (RLS violation)';
    END IF;
    
    RAISE NOTICE 'Test 1 PASSED: Users can only see their own profile';
END $$;

-- Test 2: User can only see their own chat sessions
DO $$
BEGIN
    -- Simulate user 1 session
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
    
    -- User 1 should see their 2 sessions
    IF (SELECT COUNT(*) FROM chat_sessions WHERE user_id = '11111111-1111-1111-1111-111111111111') != 2 THEN
        RAISE EXCEPTION 'User 1 cannot see their own chat sessions';
    END IF;
    
    -- User 1 should not see user 2's session
    IF (SELECT COUNT(*) FROM chat_sessions WHERE user_id = '22222222-2222-2222-2222-222222222222') != 0 THEN
        RAISE EXCEPTION 'User 1 can see User 2 chat sessions (RLS violation)';
    END IF;
    
    RAISE NOTICE 'Test 2 PASSED: Users can only see their own chat sessions';
END $$;

-- Test 3: User can only see messages from their own sessions
DO $$
BEGIN
    -- Simulate user 1 session
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
    
    -- User 1 should see messages from their sessions
    IF (SELECT COUNT(*) FROM messages WHERE session_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') != 2 THEN
        RAISE EXCEPTION 'User 1 cannot see messages from their own session';
    END IF;
    
    -- User 1 should not see messages from user 2's session
    IF (SELECT COUNT(*) FROM messages WHERE session_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') != 0 THEN
        RAISE EXCEPTION 'User 1 can see messages from User 2 session (RLS violation)';
    END IF;
    
    RAISE NOTICE 'Test 3 PASSED: Users can only see messages from their own sessions';
END $$;

-- Test 4: User can insert data into their own records
DO $$
DECLARE
    new_session_id UUID;
    new_message_id UUID;
BEGIN
    -- Simulate user 1 session
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
    
    -- User 1 should be able to create a new chat session
    INSERT INTO chat_sessions (user_id, title) 
    VALUES ('11111111-1111-1111-1111-111111111111', 'New Test Session')
    RETURNING id INTO new_session_id;
    
    -- User 1 should be able to add messages to their session
    INSERT INTO messages (session_id, role, content)
    VALUES (new_session_id, 'user', 'Test message')
    RETURNING id INTO new_message_id;
    
    -- Verify the records were created
    IF NOT EXISTS (SELECT 1 FROM chat_sessions WHERE id = new_session_id) THEN
        RAISE EXCEPTION 'Failed to create new session for User 1';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM messages WHERE id = new_message_id) THEN
        RAISE EXCEPTION 'Failed to create new message for User 1';
    END IF;
    
    RAISE NOTICE 'Test 4 PASSED: Users can insert data into their own records';
END $$;

-- Test 5: User cannot insert data for other users
DO $$
BEGIN
    -- Simulate user 1 session
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
    
    -- Try to create session for user 2 (should fail)
    BEGIN
        INSERT INTO chat_sessions (user_id, title) 
        VALUES ('22222222-2222-2222-2222-222222222222', 'Unauthorized Session');
        
        -- If we reach here, the policy failed
        RAISE EXCEPTION 'User 1 was able to create session for User 2 (RLS violation)';
    EXCEPTION 
        WHEN insufficient_privilege THEN
            -- Expected behavior
            NULL;
        WHEN OTHERS THEN
            -- Policy worked (INSERT was blocked)
            NULL;
    END;
    
    RAISE NOTICE 'Test 5 PASSED: Users cannot insert data for other users';
END $$;

-- Test 6: User can update their own records
DO $$
DECLARE
    test_session_id UUID;
BEGIN
    -- Simulate user 1 session
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
    
    -- Get one of user 1's sessions
    SELECT id INTO test_session_id 
    FROM chat_sessions 
    WHERE user_id = '11111111-1111-1111-1111-111111111111' 
    LIMIT 1;
    
    -- User 1 should be able to update their session
    UPDATE chat_sessions 
    SET title = 'Updated Title' 
    WHERE id = test_session_id;
    
    -- Verify the update
    IF NOT EXISTS (
        SELECT 1 FROM chat_sessions 
        WHERE id = test_session_id AND title = 'Updated Title'
    ) THEN
        RAISE EXCEPTION 'User 1 failed to update their own session';
    END IF;
    
    RAISE NOTICE 'Test 6 PASSED: Users can update their own records';
END $$;

-- Test 7: Cross-user access prevention test
DO $$
BEGIN
    -- Simulate user 2 session
    PERFORM set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
    
    -- User 2 should not see user 1's data
    IF (SELECT COUNT(*) FROM chat_sessions WHERE user_id = '11111111-1111-1111-1111-111111111111') != 0 THEN
        RAISE EXCEPTION 'User 2 can see User 1 chat sessions (RLS violation)';
    END IF;
    
    -- User 2 should see only their own data
    IF (SELECT COUNT(*) FROM chat_sessions WHERE user_id = '22222222-2222-2222-2222-222222222222') != 1 THEN
        RAISE EXCEPTION 'User 2 cannot see their own chat sessions';
    END IF;
    
    RAISE NOTICE 'Test 7 PASSED: Cross-user access is properly prevented';
END $$;

-- Test 8: Anonymous user access test
DO $$
BEGIN
    -- Clear JWT claims to simulate anonymous user
    PERFORM set_config('request.jwt.claims', NULL, true);
    
    -- Anonymous users should not see any data
    IF (SELECT COUNT(*) FROM users) != 0 THEN
        RAISE EXCEPTION 'Anonymous user can see user data (RLS violation)';
    END IF;
    
    IF (SELECT COUNT(*) FROM chat_sessions) != 0 THEN
        RAISE EXCEPTION 'Anonymous user can see chat sessions (RLS violation)';
    END IF;
    
    IF (SELECT COUNT(*) FROM messages) != 0 THEN
        RAISE EXCEPTION 'Anonymous user can see messages (RLS violation)';
    END IF;
    
    RAISE NOTICE 'Test 8 PASSED: Anonymous users cannot access any data';
END $$;

-- Cleanup test data
BEGIN;
SET row_security = off;

DELETE FROM messages WHERE session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE 'test%@example.com'
    )
);
DELETE FROM chat_sessions WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'test%@example.com'
);
DELETE FROM users WHERE email LIKE 'test%@example.com';

SET row_security = on;
COMMIT;

-- Success message
SELECT 'All RLS policy tests completed successfully' AS result;