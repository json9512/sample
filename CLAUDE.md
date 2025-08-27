# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChatGPT clone with core features:
- Interactive chat UI with streaming AI responses
- Persistent chat history with multiple conversations
- Google OAuth authentication via Supabase
- Text-only, single-user conversations

## Tech Stack & Architecture

**Single Next.js full-stack application**
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase
- **AI Integration**: Anthropic Claude API with streaming

## Core Interface Specifications

```typescript
// User & Authentication
interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

// Chat Management
interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata?: Record<string, any>
}

// Streaming API
interface StreamingRequest {
  message: string
  conversation_id?: string
}

interface StreamingChunk {
  type: 'token' | 'complete' | 'error'
  content: string
  message_id?: string
}
```

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

## Implementation Plan

### Phase 1: Foundation Setup
- Initialize Next.js project with TypeScript and Tailwind
- Set up Supabase project with Google OAuth authentication
- Create database schema (users, conversations, messages)
- Configure environment variables for Claude API

### Phase 2: Authentication System
- Implement Google OAuth login/logout with Supabase
- Create protected routes and middleware
- Set up user session management
- Build basic authentication UI (login/logout buttons)

### Phase 3: Core Chat Interface
- Build responsive chat UI with message bubbles
- Implement message input field with send functionality
- Create conversation sidebar with chat history
- Add new conversation functionality

### Phase 4: Claude API Integration
- Set up Anthropic Claude API client
- Implement streaming chat API endpoint (/api/chat)
- Build real-time message rendering with streaming
- Add proper error handling for API failures

### Phase 5: Data Persistence
- Implement conversation CRUD operations
- Build message storage and retrieval system
- Add conversation title generation
- Create conversation deletion functionality

### Phase 6: Polish & UX Improvements
- Add loading states and typing indicators
- Implement error boundaries and user feedback
- Optimize performance (message pagination, caching)
- Add responsive design for mobile devices

## Environment Variables Required

```env
# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth (for additional security)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Key Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.24.3",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/auth-helpers-nextjs": "^0.8.7",
  "next": "14.1.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.4.0"
}
```

## Development Cycle (MANDATORY)

Follow this strict development cycle for all features:

1. **Interface Specification**: Always define clear TypeScript interfaces first
2. **Unit Tests**: Implement minimal working unit tests that validate the interface contract (for idempotency)
3. **Implementation**: Write function details that satisfy the interface specification
4. **Rigorous Testing**: Thoroughly test the feature before proceeding to next step

This cycle ensures:
- Interface compliance and type safety
- Idempotent operations through testing
- Quality assurance before progression
- Maintainable and reliable code

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript checking
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode

## Technical Constraints

1. **AI Provider**: Anthropic Claude API only
2. **Rate Limiting**: None (rely on Claude API vendor limits)
3. **Message Limits**: Follow Claude API constraints
4. **File Attachments**: Not supported (text-only conversations)
5. **Collaboration**: Single-user conversations only


## Agent Coordination Strategy

Information Flow:
1. Each agent provides research deliverables before implementation begins
2. Research informs interface design and test strategy
3. Implementation follows the mandatory development cycle using agent findings
4. Agents can be re-deployed for deeper research if edge cases emerge