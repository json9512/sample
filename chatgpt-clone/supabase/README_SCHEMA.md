# ChatGPT Clone Database Schema

이 문서는 ChatGPT 클론 애플리케이션을 위한 Supabase PostgreSQL 데이터베이스 스키마에 대한 종합적인 설명입니다.

## 스키마 개요

### DatabaseSchema Interface
```typescript
interface DatabaseSchema {
  tables: TableDefinition[];
  relationships: Relationship[];
  indexes: Index[];
  rlsPolicies: RLSPolicy[];
}
```

## 테이블 구조

### 1. auth.users (사용자 - Supabase 내장)
Supabase의 내장 인증 시스템을 사용합니다. (별도 users 테이블 대신)

```sql
-- Supabase auth.users 테이블을 직접 참조
-- 사용자 정의 테이블 대신 Supabase 내장 인증 시스템 활용
auth.users (
    id UUID PRIMARY KEY,
    email VARCHAR,
    raw_user_meta_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**주요 특징:**
- Supabase 자동 관리 인증 테이블
- Google OAuth 내장 지원
- JWT 토큰 자동 관리
- 사용자 메타데이터 지원

### 2. chat_sessions (채팅 세션)
사용자별 채팅 세션을 관리하는 테이블입니다.

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    message_count INTEGER DEFAULT 0 NOT NULL
);
```

**주요 특징:**
- auth.users 테이블과 외래키 관계
- 자동 메시지 카운트 관리
- 아카이브 기능 지원
- CASCADE 삭제 정책

### 3. messages (메시지)
사용자와 Claude 간의 대화 메시지를 저장하는 테이블입니다.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    role message_role NOT NULL,  -- 'user' | 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (created_at) STORED,
    token_count INTEGER,
    metadata JSONB DEFAULT '{}' NOT NULL
);
```

**주요 특징:**
- 커스텀 ENUM 타입 (message_role)
- 이중 외래키 (session_id, user_id)로 보안 강화
- timestamp 필드 (created_at의 별명)
- JSONB 메타데이터 지원
- 토큰 카운트 추적

## 관계도 (Relationships)

```
auth.users (1) ──────< chat_sessions (1) ──────< messages (*)
    │                       │                        │
    └─ id                  └─ user_id               ├─ session_id
                            └─ id                   └─ user_id (이중 참조)
```

## 인덱스 전략 (Indexing Strategy)

### 성능 최적화된 인덱스 설계

#### auth.users 테이블
```sql
-- Supabase에서 자동으로 관리되는 인덱스 사용
-- 별도 인덱스 생성 불필요
```

#### chat_sessions 테이블
```sql
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);  -- 사용자별 세션
CREATE INDEX idx_chat_sessions_user_updated ON chat_sessions(user_id, updated_at DESC); -- 최근 세션
CREATE INDEX idx_chat_sessions_user_active ON chat_sessions(user_id, is_archived) WHERE is_archived = false; -- 활성 세션
```

#### messages 테이블
```sql
CREATE INDEX idx_messages_session_id ON messages(session_id);     -- 세션별 메시지
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at ASC); -- 시간순 메시지
CREATE INDEX idx_messages_user_id ON messages(user_id);          -- 사용자별 메시지
CREATE INDEX idx_messages_user_session ON messages(user_id, session_id); -- 복합 인덱스
CREATE INDEX idx_messages_user_timestamp ON messages(user_id, created_at DESC); -- 사용자별 최신 메시지
CREATE INDEX idx_messages_role ON messages(role);                -- 역할별 검색
```

## Row Level Security (RLS) 정책

### 보안 원칙
- 사용자는 자신의 데이터에만 접근 가능
- Supabase auth.uid()를 기반으로 한 인증
- 테이블별 세밀한 권한 제어

### auth.users 테이블 RLS
```sql
-- Supabase에서 자동으로 관리되는 RLS 정책 사용
-- 사용자는 기본적으로 자신의 정보만 접근 가능
```

### chat_sessions 테이블 RLS
```sql
-- 사용자는 자신의 채팅 세션만 관리 가능
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);
```

### messages 테이블 RLS
```sql
-- 이중 보안: user_id 직접 확인 + 세션 소유권 확인
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );
```

## 트리거 및 함수

### 1. 자동 timestamp 업데이트
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 2. 메시지 카운트 자동 관리
```sql
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_sessions 
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_sessions 
        SET message_count = GREATEST(0, message_count - 1),
            updated_at = NOW()
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 마이그레이션 관리

### 파일 구조
```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_align_with_supabase_auth.sql
│   └── rollback/
│       ├── 001_rollback_initial_schema.sql
│       └── 002_rollback_align_with_supabase_auth.sql
├── types/
│   └── database-schema.ts
└── tests/
    ├── schema-validation.sql
    ├── rls-security-tests.sql
    └── performance-analysis.sql
```

### 마이그레이션 실행
```bash
# 스키마 적용
supabase db push

# 롤백 (필요시)
psql -f supabase/migrations/rollback/001_rollback_initial_schema.sql
```

## 테스트 스위트

### 1. 스키마 검증 테스트
- 테이블 존재 및 구조 검증
- 외래키 제약조건 검증
- 인덱스 존재 확인
- 트리거 및 함수 검증

### 2. RLS 정책 테스트
- 사용자별 데이터 격리 확인
- 권한 기반 접근 제어 테스트
- 익명 사용자 접근 차단 확인

### 3. 성능 테스트
- 쿼리 실행 계획 분석
- 인덱스 효율성 측정
- 대용량 데이터 성능 검증

## 성능 최적화 권장사항

### 쿼리 최적화
1. **사용자별 데이터 조회**: user_id를 항상 WHERE 절에 포함
2. **세션 목록 조회**: updated_at DESC 정렬로 최신 세션 우선
3. **메시지 조회**: session_id + created_at ASC로 시간순 정렬
4. **페이지네이션**: LIMIT/OFFSET 대신 cursor 기반 페이지네이션 권장

### 인덱스 활용
- 복합 인덱스를 우선적으로 활용
- WHERE 절의 조건 순서를 인덱스 컬럼 순서와 일치
- 부분 인덱스 활용으로 저장공간 최적화

## 보안 고려사항

### 데이터 보호
- RLS 정책으로 사용자별 데이터 격리
- JWT 토큰 기반 인증 시스템
- 민감한 정보의 암호화 저장

### 접근 제어
- 세밀한 권한 관리 (SELECT, INSERT, UPDATE, DELETE)
- 익명 사용자 접근 차단
- API 레벨에서의 추가 검증

이 스키마는 확장성, 보안성, 성능을 모두 고려하여 설계되었으며, ChatGPT 클론 애플리케이션의 모든 요구사항을 충족합니다.