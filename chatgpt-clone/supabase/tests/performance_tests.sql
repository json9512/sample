-- Performance Tests and Query Optimization Analysis
-- Description: Tests for index effectiveness and query performance
-- Date: 2025-09-02

-- Enable query execution time display
\timing on

-- Test data setup for performance testing
BEGIN;

-- Create test data set
DO $$
DECLARE
    user_count INTEGER := 1000;
    sessions_per_user INTEGER := 10;
    messages_per_session INTEGER := 50;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    current_user_id UUID;
    current_session_id UUID;
BEGIN
    -- Clear existing test data
    DELETE FROM messages WHERE session_id IN (
        SELECT id FROM chat_sessions WHERE title LIKE 'PERF_TEST_%'
    );
    DELETE FROM chat_sessions WHERE title LIKE 'PERF_TEST_%';
    DELETE FROM users WHERE email LIKE 'perftest%@example.com';
    
    RAISE NOTICE 'Creating % users with % sessions each, % messages per session', 
        user_count, sessions_per_user, messages_per_session;
    
    -- Create test users
    FOR i IN 1..user_count LOOP
        current_user_id := uuid_generate_v4();
        
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES (
            current_user_id,
            'perftest' || i || '@example.com',
            'Performance Test User ' || i,
            NOW() - (random() * INTERVAL '365 days'),
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Create chat sessions for each user
        FOR j IN 1..sessions_per_user LOOP
            current_session_id := uuid_generate_v4();
            
            INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
            VALUES (
                current_session_id,
                current_user_id,
                'PERF_TEST_Session_' || i || '_' || j,
                NOW() - (random() * INTERVAL '180 days'),
                NOW() - (random() * INTERVAL '7 days')
            );
            
            -- Create messages for each session
            FOR k IN 1..messages_per_session LOOP
                INSERT INTO messages (session_id, role, content, created_at, updated_at)
                VALUES (
                    current_session_id,
                    CASE WHEN k % 2 = 1 THEN 'user' ELSE 'assistant' END,
                    'Performance test message content for session ' || j || ' message ' || k,
                    NOW() - (random() * INTERVAL '7 days'),
                    NOW() - (random() * INTERVAL '1 day')
                );
            END LOOP;
        END LOOP;
        
        -- Progress indicator
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Created % users so far...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Test data creation completed';
END $$;

COMMIT;

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE chat_sessions;
ANALYZE messages;

-- Performance Test 1: User lookup by email (simulating login)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, email, name, avatar_url, created_at
FROM users 
WHERE email = 'perftest500@example.com';

-- Performance Test 2: Get user's chat sessions ordered by recent activity
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT cs.id, cs.title, cs.created_at, cs.updated_at, cs.message_count
FROM chat_sessions cs
WHERE cs.user_id = (
    SELECT id FROM users WHERE email = 'perftest500@example.com' LIMIT 1
)
AND cs.is_archived = false
ORDER BY cs.updated_at DESC
LIMIT 20;

-- Performance Test 3: Get messages for a specific session
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT m.id, m.role, m.content, m.created_at
FROM messages m
WHERE m.session_id = (
    SELECT id FROM chat_sessions 
    WHERE title LIKE 'PERF_TEST_Session_500_%' 
    LIMIT 1
)
ORDER BY m.created_at ASC;

-- Performance Test 4: Complex join query - get user sessions with message counts
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    u.name,
    cs.title,
    cs.message_count,
    cs.updated_at
FROM users u
JOIN chat_sessions cs ON u.id = cs.user_id
WHERE u.email LIKE 'perftest5%@example.com'
AND cs.is_archived = false
ORDER BY cs.updated_at DESC;

-- Performance Test 5: Aggregate query - user activity summary
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT m.id) as total_messages,
    MAX(m.created_at) as last_message_time
FROM chat_sessions cs
LEFT JOIN messages m ON cs.id = m.session_id
WHERE cs.user_id = (
    SELECT id FROM users WHERE email = 'perftest500@example.com' LIMIT 1
);

-- Performance Test 6: Recent messages across all user sessions
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    m.content,
    m.role,
    m.created_at,
    cs.title as session_title
FROM messages m
JOIN chat_sessions cs ON m.session_id = cs.id
WHERE cs.user_id = (
    SELECT id FROM users WHERE email = 'perftest500@example.com' LIMIT 1
)
ORDER BY m.created_at DESC
LIMIT 100;

-- Index Usage Analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE tablename IN ('users', 'chat_sessions', 'messages')
ORDER BY tablename, indexname;

-- Table Statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('users', 'chat_sessions', 'messages')
ORDER BY tablename;

-- Index Effectiveness Test
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTERVAL;
BEGIN
    -- Test 1: Query with proper index usage
    start_time := clock_timestamp();
    
    PERFORM COUNT(*)
    FROM chat_sessions cs
    WHERE cs.user_id = (
        SELECT id FROM users WHERE email = 'perftest500@example.com' LIMIT 1
    )
    AND cs.is_archived = false;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    RAISE NOTICE 'Indexed query execution time: %', execution_time;
    
    -- Test 2: Query without index (simulated by using function that prevents index usage)
    start_time := clock_timestamp();
    
    PERFORM COUNT(*)
    FROM chat_sessions cs
    WHERE cs.user_id::text = (
        SELECT id::text FROM users WHERE email = 'perftest500@example.com' LIMIT 1
    )
    AND cs.is_archived = false;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    RAISE NOTICE 'Non-indexed query execution time: %', execution_time;
END $$;

-- Cleanup performance test data
DO $$
BEGIN
    RAISE NOTICE 'Cleaning up performance test data...';
    
    DELETE FROM messages WHERE session_id IN (
        SELECT id FROM chat_sessions WHERE title LIKE 'PERF_TEST_%'
    );
    DELETE FROM chat_sessions WHERE title LIKE 'PERF_TEST_%';
    DELETE FROM users WHERE email LIKE 'perftest%@example.com';
    
    RAISE NOTICE 'Performance test data cleanup completed';
END $$;

-- Query Optimization Recommendations
SELECT 'Performance test completed. Review query plans above for optimization opportunities.' AS recommendation;