-- ChatGPT Clone Database Performance Analysis
-- Version: 002
-- Description: Query execution plan analysis and performance optimization tests
-- Author: Database Architect
-- Date: 2025-09-03

-- Performance Test Suite: Analyze query patterns and index effectiveness
-- Execute after schema creation to validate performance optimizations

BEGIN;

-- Test environment setup with sample data
DO $$
DECLARE
    user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
    session_ids uuid[];
    session_id uuid;
    i integer;
    j integer;
BEGIN
    -- Ensure test user exists
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (user_id, 'perf-test@example.com', '{"full_name": "Performance Test User"}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Create 10 test sessions
    FOR i IN 1..10 LOOP
        session_id := uuid_generate_v4();
        session_ids := array_append(session_ids, session_id);
        
        INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) 
        VALUES (
            session_id, 
            user_id, 
            'Performance Test Session ' || i,
            NOW() - (i || ' hours')::interval,
            NOW() - (i || ' hours')::interval
        );
        
        -- Add 20 messages per session (200 total messages)
        FOR j IN 1..20 LOOP
            INSERT INTO messages (session_id, user_id, role, content, created_at) 
            VALUES (
                session_id,
                user_id,
                CASE WHEN j % 2 = 1 THEN 'user'::message_role ELSE 'assistant'::message_role END,
                'Test message content ' || j || ' for session ' || i || '. This is a longer message to simulate realistic content length that might be found in a chat application.',
                NOW() - (i || ' hours')::interval + (j || ' minutes')::interval
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % sessions with % total messages', array_length(session_ids, 1), 10 * 20;
END $$;

-- Performance Test 1: User Sessions Query (Most Common Pattern)
SELECT 'Performance Test 1: User Sessions Query' as test_name;

-- Analyze execution plan for user sessions retrieval
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT cs.id, cs.title, cs.updated_at, cs.message_count, cs.is_archived
FROM chat_sessions cs 
WHERE cs.user_id = '00000000-0000-0000-0000-000000000001'::uuid 
ORDER BY cs.updated_at DESC 
LIMIT 20;

-- Performance Test 2: Session Messages Query (Second Most Common)
SELECT 'Performance Test 2: Session Messages Query' as test_name;

DO $$
DECLARE
    test_session_id uuid;
BEGIN
    -- Get a session ID for testing
    SELECT id INTO test_session_id 
    FROM chat_sessions 
    WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid 
    LIMIT 1;
    
    -- Analyze execution plan for message retrieval within a session
    EXECUTE format('EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
        SELECT m.id, m.role, m.content, m.created_at, m.timestamp
        FROM messages m 
        WHERE m.session_id = %L 
        ORDER BY m.created_at ASC', test_session_id);
END $$;

-- Performance Test 3: User Message History Query
SELECT 'Performance Test 3: User Message History Query' as test_name;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT m.id, m.content, m.role, m.created_at, cs.title
FROM messages m
JOIN chat_sessions cs ON m.session_id = cs.id
WHERE m.user_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY m.created_at DESC
LIMIT 50;

-- Performance Test 4: Recent Activity Query (Dashboard)
SELECT 'Performance Test 4: Recent Activity Query' as test_name;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    cs.id,
    cs.title,
    cs.updated_at,
    cs.message_count,
    (SELECT content FROM messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
FROM chat_sessions cs
WHERE cs.user_id = '00000000-0000-0000-0000-000000000001'::uuid
AND cs.is_archived = false
ORDER BY cs.updated_at DESC
LIMIT 10;

-- Performance Test 5: Session Summary View Performance
SELECT 'Performance Test 5: Session Summary View Performance' as test_name;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM user_session_summary 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Performance Test 6: Complex Search Query
SELECT 'Performance Test 6: Complex Search Query' as test_name;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT DISTINCT cs.id, cs.title, cs.updated_at
FROM chat_sessions cs
JOIN messages m ON cs.id = m.session_id
WHERE cs.user_id = '00000000-0000-0000-0000-000000000001'::uuid
AND m.content ILIKE '%test%'
ORDER BY cs.updated_at DESC;

-- Performance Test 7: Index Usage Analysis
SELECT 'Performance Test 7: Index Usage Analysis' as test_name;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 THEN (idx_tup_fetch::float / idx_tup_read::float * 100)::numeric(5,2)
        ELSE 0 
    END as selectivity_percentage
FROM pg_stat_user_indexes 
WHERE tablename IN ('chat_sessions', 'messages')
ORDER BY tablename, idx_tup_read DESC;

-- Performance Test 8: Table Statistics
SELECT 'Performance Test 8: Table Statistics' as test_name;

-- Analyze table sizes and statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('chat_sessions', 'messages')
ORDER BY tablename;

-- Performance Test 9: Query Performance Benchmarks
SELECT 'Performance Test 9: Query Performance Benchmarks' as test_name;

-- Benchmark common queries with timing
\timing on

-- Benchmark 1: User sessions (typical dashboard load)
SELECT COUNT(*) as session_count
FROM (
    SELECT cs.id
    FROM chat_sessions cs 
    WHERE cs.user_id = '00000000-0000-0000-0000-000000000001'::uuid 
    ORDER BY cs.updated_at DESC 
    LIMIT 20
) subquery;

-- Benchmark 2: Message count per session (aggregation performance)
SELECT cs.id, COUNT(m.id) as actual_message_count, cs.message_count as denormalized_count
FROM chat_sessions cs
LEFT JOIN messages m ON cs.id = m.session_id
WHERE cs.user_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY cs.id, cs.message_count
ORDER BY cs.updated_at DESC;

-- Benchmark 3: Full-text search simulation (without full-text indexes)
SELECT COUNT(DISTINCT cs.id) as matching_sessions
FROM chat_sessions cs
JOIN messages m ON cs.id = m.session_id
WHERE cs.user_id = '00000000-0000-0000-0000-000000000001'::uuid
AND m.content ILIKE '%test%';

\timing off

-- Performance Test 10: Optimization Recommendations
SELECT 'Performance Test 10: Optimization Recommendations' as test_name;

DO $$
BEGIN
    RAISE NOTICE '=== PERFORMANCE OPTIMIZATION RECOMMENDATIONS ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. INDEX OPTIMIZATION:';
    RAISE NOTICE '   - idx_chat_sessions_user_updated: Optimizes user session lists with ordering';
    RAISE NOTICE '   - idx_messages_session_created: Essential for chronological message retrieval';
    RAISE NOTICE '   - idx_messages_user_id: Enables efficient user-based message queries';
    RAISE NOTICE '';
    RAISE NOTICE '2. QUERY PATTERN OPTIMIZATION:';
    RAISE NOTICE '   - Use LIMIT clauses for session lists to prevent large result sets';
    RAISE NOTICE '   - Leverage message_count denormalization to avoid COUNT() queries';
    RAISE NOTICE '   - Consider pagination for message history (offset/cursor-based)';
    RAISE NOTICE '';
    RAISE NOTICE '3. POTENTIAL IMPROVEMENTS:';
    RAISE NOTICE '   - Add GIN index on messages.content for full-text search: CREATE INDEX idx_messages_content_gin ON messages USING gin(to_tsvector(''english'', content));';
    RAISE NOTICE '   - Consider partitioning messages by created_at for very large datasets';
    RAISE NOTICE '   - Add partial indexes for frequently filtered data: WHERE is_archived = false';
    RAISE NOTICE '';
    RAISE NOTICE '4. MONITORING RECOMMENDATIONS:';
    RAISE NOTICE '   - Monitor pg_stat_user_indexes for unused indexes';
    RAISE NOTICE '   - Track slow queries with pg_stat_statements extension';
    RAISE NOTICE '   - Set up alerts for table bloat and vacuum frequency';
END $$;

-- Performance Test 11: Connection and Query Limits Analysis
SELECT 'Performance Test 11: Connection and Query Limits Analysis' as test_name;

-- Check current database configuration
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings 
WHERE name IN (
    'max_connections',
    'shared_buffers',
    'effective_cache_size',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target'
)
ORDER BY name;

-- Cleanup performance test data
DELETE FROM messages WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM chat_sessions WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

SELECT 'All performance analysis tests completed successfully!' as result;
SELECT 'Review EXPLAIN plans above to ensure indexes are being used effectively.' as note;

COMMIT;