// 데이터베이스 테이블 타입
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// API 응답 타입
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: PaginationInfo
    timestamp: string
  }
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 스트리밍 관련 타입
export interface StreamingResponse {
  type: 'chunk' | 'error' | 'done'
  data: string
  metadata?: Record<string, any>
}

export interface StreamConnection {
  eventSource: EventSource
  reconnectAttempts: number
  maxReconnects: number
  reconnectDelay: number
}

export interface StreamState {
  status: 'connecting' | 'connected' | 'streaming' | 'error' | 'closed'
  buffer: string
  error?: Error
}

// 컴포넌트 Props 타입
export interface ChatInterfaceProps {
  sessionId: string
  messages: Message[]
  onSendMessage: (content: string) => void
  isStreaming: boolean
}

export interface SessionListProps {
  sessions: ChatSession[]
  currentSessionId?: string
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onNewSession: () => void
}

// 스토어 상태 타입
export interface ChatStore {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  messages: Message[]
  isStreaming: boolean
  
  // Actions
  setCurrentSession: (session: ChatSession) => void
  addMessage: (message: Message) => void
  setStreaming: (streaming: boolean) => void
  loadSessions: () => Promise<void>
  createNewSession: (title?: string) => Promise<void>
}

// API 인터페이스
export interface ChatAPI {
  // Claude API 스트리밍 응답
  streamChat(sessionId: string, message: string): AsyncGenerator<string>
  
  // 세션 관리
  createSession(title?: string): Promise<ChatSession>
  getSessions(): Promise<ChatSession[]>
  deleteSession(sessionId: string): Promise<void>
  updateSessionTitle(sessionId: string, title: string): Promise<void>
  
  // 메시지 관리
  getMessages(sessionId: string): Promise<Message[]>
  saveMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message>
}