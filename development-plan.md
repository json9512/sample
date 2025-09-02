# ChatGPT 클론 개발 계획서

## 📋 프로젝트 개요

**목표**: Claude API를 활용한 실시간 채팅 애플리케이션 개발

### 핵심 기능 요구사항
- 사용자는 채팅 UI를 통해서 질문을 하고 Claude로부터 답변을 받을 수 있음
- 질문/응답은 스트리밍 처리 (실시간 타이핑 효과)
- 채팅 세션 목록 관리 (생성/조회/삭제)
- Google OAuth 로그인을 통한 사용자 인증

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **React 18 + TypeScript**
- **Tailwind CSS** (스타일링)
- **Zustand** (클라이언트 상태 관리)

### Backend & Database
- **Supabase** 
  - PostgreSQL 데이터베이스
  - 실시간 기능
  - Google OAuth 인증
- **Next.js API Routes** (서버 로직 처리)

### AI Integration
- **Anthropic Claude API** (Claude 3.5 Sonnet)
- **Server-Sent Events** (스트리밍 응답 처리)

## 🗄️ 데이터베이스 스키마

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 채팅 세션 테이블
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📐 TypeScript 인터페이스 정의

```typescript
// 기본 타입 정의
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// API 인터페이스
interface ChatAPI {
  // Claude API 스트리밍 응답
  streamChat(sessionId: string, message: string): AsyncGenerator<string>;
  
  // 세션 관리
  createSession(title?: string): Promise<ChatSession>;
  getSessions(): Promise<ChatSession[]>;
  deleteSession(sessionId: string): Promise<void>;
  updateSessionTitle(sessionId: string, title: string): Promise<void>;
  
  // 메시지 관리
  getMessages(sessionId: string): Promise<Message[]>;
  saveMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message>;
}

// 컴포넌트 Props
interface ChatInterfaceProps {
  sessionId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
}

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
}

// 스토어 인터페이스
interface ChatStore {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  messages: Message[];
  isStreaming: boolean;
  
  // Actions
  setCurrentSession: (session: ChatSession) => void;
  addMessage: (message: Message) => void;
  setStreaming: (streaming: boolean) => void;
  loadSessions: () => Promise<void>;
  createNewSession: (title?: string) => Promise<void>;
}
```

## 📁 프로젝트 구조

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx                # Google OAuth 로그인 페이지
├── (dashboard)/
│   ├── layout.tsx                  # 인증된 사용자 레이아웃 (사이드바 포함)
│   ├── page.tsx                    # 메인 채팅 페이지
│   └── chat/
│       └── [sessionId]/
│           └── page.tsx            # 특정 세션 채팅 페이지
├── api/
│   ├── auth/
│   │   └── callback/route.ts       # Supabase Auth 콜백
│   ├── chat/
│   │   ├── stream/route.ts         # Claude API 스트리밍 엔드포인트
│   │   └── sessions/
│   │       ├── route.ts            # 세션 CRUD
│   │       └── [sessionId]/
│   │           ├── route.ts        # 특정 세션 관리
│   │           └── messages/
│   │               └── route.ts    # 메시지 관리
├── components/
│   ├── auth/
│   │   ├── LoginButton.tsx
│   │   └── AuthProvider.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx       # 메인 채팅 인터페이스
│   │   ├── MessageList.tsx         # 메시지 목록 컴포넌트
│   │   ├── MessageInput.tsx        # 메시지 입력 컴포넌트
│   │   └── StreamingMessage.tsx    # 스트리밍 메시지 컴포넌트
│   ├── sessions/
│   │   ├── SessionList.tsx         # 세션 목록 사이드바
│   │   └── SessionItem.tsx         # 개별 세션 항목
│   └── ui/                         # 공통 UI 컴포넌트
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase 클라이언트
│   │   └── server.ts               # 서버사이드 Supabase
│   ├── claude/
│   │   └── client.ts               # Claude API 클라이언트
│   ├── stores/
│   │   ├── chat.ts                 # 채팅 상태 관리 (Zustand)
│   │   └── auth.ts                 # 인증 상태 관리
│   └── utils/
│       ├── db.ts                   # 데이터베이스 유틸리티
│       └── validation.ts           # 입력 검증
├── types/
│   └── index.ts                    # 전역 타입 정의
├── middleware.ts                   # 인증 미들웨어
└── next.config.js                  # Next.js 설정
```

## 🚀 개발 단계별 계획 (총 8-10일)

### **Phase 1: 프로젝트 기반 설정 (1-2일)**
1. Next.js 14 프로젝트 초기화 + TypeScript 설정
2. Tailwind CSS 설정 및 기본 UI 컴포넌트 구성
3. Supabase 프로젝트 생성 및 데이터베이스 스키마 구축
4. 환경변수 설정 (Claude API, Supabase 키)

**완료 기준**: 기본 프로젝트 구조와 개발환경 구성 완료

### **Phase 2: 인증 시스템 구현 (1-2일)**
1. Supabase Auth 설정 (Google OAuth)
2. 로그인/로그아웃 페이지 구현
3. 인증 상태 관리 및 보호된 라우팅 설정
4. 사용자 정보 저장 및 관리

**완료 기준**: Google 로그인으로 인증하여 대시보드 접근 가능

### **Phase 3: 기본 채팅 UI 구현 (2일)**
1. 채팅 인터페이스 레이아웃 구성
2. 메시지 입력 컴포넌트 개발
3. 메시지 목록 표시 컴포넌트 개발
4. 채팅 세션 생성/조회 기능

**완료 기준**: 기본적인 채팅 UI 완성, 메시지 저장/조회 가능

### **Phase 4: Claude API 연동 및 스트리밍 (2-3일)**
1. Claude API 클라이언트 구성
2. Next.js API Route에서 Claude API 호출
3. Server-Sent Events를 통한 스트리밍 응답 구현
4. 프론트엔드 스트리밍 UI 개발 (타이핑 애니메이션)

**완료 기준**: Claude와 실시간 대화 가능, 스트리밍 응답 정상 작동

### **Phase 5: 세션 관리 기능 (1-2일)**
1. 채팅 세션 목록 사이드바 구현
2. 새로운 세션 생성 기능
3. 세션 간 전환 기능
4. 세션 삭제 및 제목 수정 기능
5. 세션 제목 자동 생성 (첫 번째 메시지 기반)

**완료 기준**: 다중 채팅 세션 관리 가능

### **Phase 6: 최적화 및 마무리 (1-2일)**
1. 성능 최적화 (React.memo, useMemo 적용)
2. 에러 핸들링 및 사용자 피드백 개선
3. 로딩 상태 및 스켈레톤 UI 추가
4. 모바일 반응형 디자인 최적화
5. 코드 리팩토링 및 테스트

**완료 기준**: 안정적이고 사용자 친화적인 완성된 애플리케이션

## 🔧 주요 구현 고려사항

### 스트리밍 구현
- Claude API의 스트리밍 응답을 Server-Sent Events로 처리
- 프론트엔드에서 실시간 메시지 업데이트 관리
- 스트리밍 중단 및 재시작 처리

### 상태 관리
- Zustand를 활용한 경량 상태 관리
- 서버 상태와 클라이언트 상태 분리
- 실시간 업데이트를 위한 Supabase 구독 활용

### 보안 및 인증
- Next.js 미들웨어를 통한 라우트 보호
- Claude API 키 서버사이드 관리
- 사용자별 데이터 격리 보장

### 성능 최적화
- 메시지 목록 가상화 (긴 대화 처리)
- 이미지 및 자산 최적화
- 적절한 캐싱 전략 적용

## 🚀 배포 계획

- **Vercel** 플랫폼 활용 (Next.js 최적화)
- **환경변수** 안전한 관리
- **도메인** 연결 및 SSL 인증서 설정
- **모니터링** 및 에러 추적 설정

이 계획서를 기반으로 체계적이고 안정적인 ChatGPT 클론 애플리케이션을 개발할 수 있습니다.