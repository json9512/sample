export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  session_id: string
  user_id: string
}

export interface ChatSession {
  id: string
  title: string
  user_id: string
  created_at: Date
  updated_at: Date
  messages?: Message[]
}

export interface ChatUIProps {
  session: ChatSession | null
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading: boolean
}

export interface MessageItemProps {
  message: Message
  isLast: boolean
}

export interface ChatInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export interface SessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}