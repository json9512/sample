# API Documentation

This document describes the REST API endpoints for the ChatGPT Clone application.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Endpoints](#endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Data Types](#data-types)

## Overview

The ChatGPT Clone API provides endpoints for managing conversations and streaming AI responses. All endpoints return JSON data and follow REST conventions.

## Authentication

Authentication is handled through Supabase Auth with Google OAuth. The application uses session-based authentication with HTTP-only cookies.

### Authentication Flow

1. User initiates Google OAuth via `/login` page
2. Callback handled by `/auth/callback`
3. Session cookie set automatically
4. All API requests include session authentication

### Protected Endpoints

All `/api/` endpoints except `/api/health` require authentication. Unauthenticated requests will receive a `401 Unauthorized` response.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Endpoints

### Health Check

Check application health and system status.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "claude_api": true
  },
  "system": {
    "environment": "production",
    "platform": "vercel",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

**Response Codes:**
- `200 OK` - All systems healthy
- `503 Service Unavailable` - One or more systems unhealthy

---

### Chat Stream

Send a message and receive a streaming AI response.

```http
POST /api/chat
```

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000" // optional
}
```

**Parameters:**
- `message` (required, string): The user message to send
- `conversation_id` (optional, string): UUID of existing conversation. If omitted, a new conversation will be created.

**Response:**

The response is a streaming text response using Server-Sent Events (SSE). Each chunk is sent as:

```
data: {"type": "token", "content": "Hello"}

data: {"type": "token", "content": " there"}

data: {"type": "complete", "message_id": "550e8400-e29b-41d4-a716-446655440001"}
```

**Streaming Chunk Types:**
- `token` - Partial response content
- `complete` - Response finished, includes final message_id
- `error` - Error occurred during streaming

**Response Codes:**
- `200 OK` - Stream started successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Authentication required
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Usage:**

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello!',
    conversation_id: 'existing-conversation-id'
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'token') {
        // Handle streaming token
        console.log(data.content);
      } else if (data.type === 'complete') {
        // Handle completion
        console.log('Message complete:', data.message_id);
      }
    }
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Message content is required",
    "details": {
      "field": "message",
      "expected": "non-empty string"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request body or parameters are invalid |
| `UNAUTHORIZED` | Authentication required or invalid |
| `FORBIDDEN` | Authenticated but not authorized for this resource |
| `NOT_FOUND` | Requested resource not found |
| `RATE_LIMITED` | Too many requests, try again later |
| `QUOTA_EXCEEDED` | API usage quota exceeded |
| `INTERNAL_ERROR` | Server error, try again later |
| `SERVICE_UNAVAILABLE` | External service (Claude API/Database) unavailable |

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Rate Limiting

API requests are rate limited to ensure fair usage and system stability.

### Limits

- **Default:** 60 requests per minute per user
- **Burst:** Up to 10 requests in quick succession
- **Chat streaming:** 1 concurrent stream per user

### Rate Limit Headers

Response includes rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248000
X-RateLimit-Retry-After: 15
```

### Rate Limit Exceeded

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 15

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 15 seconds.",
    "retry_after": 15
  }
}
```

## Data Types

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string; // ISO 8601 timestamp
}
```

### Conversation

```typescript
interface Conversation {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### Message

```typescript
interface Message {
  id: string; // UUID
  conversation_id: string; // UUID
  role: 'user' | 'assistant';
  content: string;
  created_at: string; // ISO 8601 timestamp
  metadata?: Record<string, any>;
}
```

### Chat Request

```typescript
interface ChatRequest {
  message: string; // User message content
  conversation_id?: string; // Optional existing conversation UUID
}
```

### Streaming Response Chunks

```typescript
interface StreamingChunk {
  type: 'token' | 'complete' | 'error';
  content: string;
  message_id?: string; // Only present in 'complete' chunks
  error?: string; // Only present in 'error' chunks
}
```

## Security Considerations

### Request Security

- All requests must use HTTPS in production
- Authentication handled via secure HTTP-only cookies
- CSRF protection enabled
- Rate limiting prevents abuse

### Data Privacy

- User data is isolated using Row Level Security (RLS)
- Messages are encrypted in transit
- No sensitive data in logs
- User conversations are private

### API Key Security

- Claude API key is never exposed to client
- All AI requests proxied through backend
- API key rotation supported
- Usage monitoring enabled

## Examples

### Full Chat Flow

```javascript
// 1. Send message
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});

// 2. Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();
let aiResponse = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      switch (data.type) {
        case 'token':
          aiResponse += data.content;
          updateUI(aiResponse); // Update streaming text
          break;
          
        case 'complete':
          console.log('Response complete:', data.message_id);
          finalizeResponse(aiResponse);
          break;
          
        case 'error':
          console.error('Stream error:', data.content);
          handleError(data.content);
          break;
      }
    }
  }
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello!' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (error.error.code) {
      case 'RATE_LIMITED':
        setTimeout(() => retry(), error.retry_after * 1000);
        break;
        
      case 'UNAUTHORIZED':
        redirectToLogin();
        break;
        
      default:
        showErrorMessage(error.error.message);
    }
    return;
  }
  
  // Handle successful response...
  
} catch (error) {
  console.error('Network error:', error);
  showErrorMessage('Connection failed. Please try again.');
}
```

---

For questions or issues with the API, please check the application logs or contact support.