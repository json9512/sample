// ChatGPT Clone Database Schema Types
// Generated from Supabase migrations
// Author: Database Architect
// Date: 2025-09-03

/**
 * Complete database schema interface following 3NF principles
 */
export interface DatabaseSchema {
  tables: TableDefinition[];
  relationships: Relationship[];
  indexes: Index[];
  rlsPolicies: RLSPolicy[];
}

/**
 * Base table structure that all tables must inherit
 */
export interface BaseTable {
  id: string; // UUID PRIMARY KEY
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
}

/**
 * Message role enumeration
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Chat session table structure
 * Normalized to 3NF - contains session metadata only
 */
export interface ChatSession extends BaseTable {
  user_id: string; // UUID, foreign key to auth.users(id)
  title: string; // VARCHAR(500), session title
  is_archived: boolean; // BOOLEAN, soft delete flag
  message_count: number; // INTEGER, denormalized count for performance
}

/**
 * Message table structure
 * Normalized to 3NF - contains message data with proper relationships
 */
export interface Message extends BaseTable {
  session_id: string; // UUID, foreign key to chat_sessions(id)
  user_id: string; // UUID, foreign key to auth.users(id)
  role: MessageRole; // ENUM: 'user' | 'assistant'
  content: string; // TEXT, message content
  timestamp: string; // Generated column alias for created_at
  token_count?: number; // INTEGER, nullable token count for billing/limits
  metadata: Record<string, any>; // JSONB, extensible metadata
}

/**
 * Supabase auth.users reference (built-in table)
 */
export interface AuthUser {
  id: string; // UUID PRIMARY KEY
  email?: string;
  raw_user_meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * User session summary view
 */
export interface UserSessionSummary {
  user_id: string;
  email?: string;
  name?: string;
  total_sessions: number;
  active_sessions: number;
  total_messages: number;
  last_activity?: string;
}

// Database Schema Implementation
export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  constraints: ConstraintDefinition[];
  triggers: TriggerDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  generated?: boolean;
}

export interface ConstraintDefinition {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  definition: string;
  references?: {
    table: string;
    column: string;
    onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL';
    onUpdate: 'CASCADE' | 'RESTRICT' | 'SET NULL';
  };
}

export interface TriggerDefinition {
  name: string;
  event: 'BEFORE' | 'AFTER';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  function: string;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  cascadeDelete: boolean;
}

export interface Index {
  name: string;
  table: string;
  columns: string[];
  type: 'BTREE' | 'HASH' | 'GIN' | 'GIST';
  unique: boolean;
  partial?: string; // WHERE clause for partial indexes
}

export interface RLSPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  using?: string; // USING clause
  withCheck?: string; // WITH CHECK clause
  description: string;
}

/**
 * Complete database schema definition
 */
export const CHAT_SYSTEM_SCHEMA: DatabaseSchema = {
  tables: [
    {
      name: 'chat_sessions',
      columns: [
        { name: 'id', type: 'UUID', nullable: false, default: 'uuid_generate_v4()' },
        { name: 'user_id', type: 'UUID', nullable: false },
        { name: 'title', type: 'VARCHAR(500)', nullable: false, default: "'New Chat'" },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, default: 'NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, default: 'NOW()' },
        { name: 'is_archived', type: 'BOOLEAN', nullable: false, default: 'false' },
        { name: 'message_count', type: 'INTEGER', nullable: false, default: '0' }
      ],
      constraints: [
        { name: 'chat_sessions_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
        {
          name: 'fk_chat_sessions_user_id',
          type: 'FOREIGN KEY',
          definition: 'FOREIGN KEY (user_id) REFERENCES auth.users(id)',
          references: { table: 'auth.users', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }
        },
        { name: 'chat_sessions_title_check', type: 'CHECK', definition: 'CHECK (LENGTH(TRIM(title)) > 0)' },
        { name: 'chat_sessions_message_count_check', type: 'CHECK', definition: 'CHECK (message_count >= 0)' }
      ],
      triggers: [
        { name: 'update_chat_sessions_updated_at', event: 'BEFORE', operation: 'UPDATE', function: 'update_updated_at_column()' }
      ]
    },
    {
      name: 'messages',
      columns: [
        { name: 'id', type: 'UUID', nullable: false, default: 'uuid_generate_v4()' },
        { name: 'session_id', type: 'UUID', nullable: false },
        { name: 'user_id', type: 'UUID', nullable: false },
        { name: 'role', type: 'message_role', nullable: false },
        { name: 'content', type: 'TEXT', nullable: false },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, default: 'NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, default: 'NOW()' },
        { name: 'timestamp', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, generated: true },
        { name: 'token_count', type: 'INTEGER', nullable: true },
        { name: 'metadata', type: 'JSONB', nullable: false, default: "'{}'::jsonb" }
      ],
      constraints: [
        { name: 'messages_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
        {
          name: 'fk_messages_session_id',
          type: 'FOREIGN KEY',
          definition: 'FOREIGN KEY (session_id) REFERENCES chat_sessions(id)',
          references: { table: 'chat_sessions', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }
        },
        {
          name: 'fk_messages_user_id',
          type: 'FOREIGN KEY',
          definition: 'FOREIGN KEY (user_id) REFERENCES auth.users(id)',
          references: { table: 'auth.users', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }
        },
        { name: 'messages_content_check', type: 'CHECK', definition: 'CHECK (LENGTH(TRIM(content)) > 0)' },
        { name: 'messages_token_count_check', type: 'CHECK', definition: 'CHECK (token_count IS NULL OR token_count > 0)' }
      ],
      triggers: [
        { name: 'update_messages_updated_at', event: 'BEFORE', operation: 'UPDATE', function: 'update_updated_at_column()' },
        { name: 'update_session_message_count_trigger', event: 'AFTER', operation: 'INSERT', function: 'update_session_message_count()' },
        { name: 'sync_message_user_id_trigger', event: 'BEFORE', operation: 'INSERT', function: 'sync_message_user_id()' }
      ]
    }
  ],
  relationships: [
    {
      fromTable: 'chat_sessions',
      fromColumn: 'user_id',
      toTable: 'auth.users',
      toColumn: 'id',
      relationshipType: 'MANY_TO_MANY', // One user can have many sessions
      cascadeDelete: true
    },
    {
      fromTable: 'messages',
      fromColumn: 'session_id',
      toTable: 'chat_sessions',
      toColumn: 'id',
      relationshipType: 'MANY_TO_MANY', // One session can have many messages
      cascadeDelete: true
    },
    {
      fromTable: 'messages',
      fromColumn: 'user_id',
      toTable: 'auth.users',
      toColumn: 'id',
      relationshipType: 'MANY_TO_MANY', // One user can have many messages
      cascadeDelete: true
    }
  ],
  indexes: [
    // Chat sessions indexes - optimized for user-based queries
    { name: 'idx_chat_sessions_user_id', table: 'chat_sessions', columns: ['user_id'], type: 'BTREE', unique: false },
    { name: 'idx_chat_sessions_user_updated', table: 'chat_sessions', columns: ['user_id', 'updated_at'], type: 'BTREE', unique: false },
    { name: 'idx_chat_sessions_user_active', table: 'chat_sessions', columns: ['user_id', 'is_archived'], type: 'BTREE', unique: false, partial: 'is_archived = false' },
    { name: 'idx_chat_sessions_updated_at', table: 'chat_sessions', columns: ['updated_at'], type: 'BTREE', unique: false },
    
    // Messages indexes - optimized for session and user-based queries
    { name: 'idx_messages_session_id', table: 'messages', columns: ['session_id'], type: 'BTREE', unique: false },
    { name: 'idx_messages_session_created', table: 'messages', columns: ['session_id', 'created_at'], type: 'BTREE', unique: false },
    { name: 'idx_messages_user_id', table: 'messages', columns: ['user_id'], type: 'BTREE', unique: false },
    { name: 'idx_messages_user_session', table: 'messages', columns: ['user_id', 'session_id'], type: 'BTREE', unique: false },
    { name: 'idx_messages_user_timestamp', table: 'messages', columns: ['user_id', 'created_at'], type: 'BTREE', unique: false },
    { name: 'idx_messages_role', table: 'messages', columns: ['role'], type: 'BTREE', unique: false },
    { name: 'idx_messages_created_at', table: 'messages', columns: ['created_at'], type: 'BTREE', unique: false }
  ],
  rlsPolicies: [
    // Chat sessions RLS policies
    {
      name: 'Users can view own chat sessions',
      table: 'chat_sessions',
      operation: 'SELECT',
      using: 'auth.uid() = user_id',
      description: 'Users can only view their own chat sessions'
    },
    {
      name: 'Users can insert own chat sessions',
      table: 'chat_sessions',
      operation: 'INSERT',
      withCheck: 'auth.uid() = user_id',
      description: 'Users can only create chat sessions for themselves'
    },
    {
      name: 'Users can update own chat sessions',
      table: 'chat_sessions',
      operation: 'UPDATE',
      using: 'auth.uid() = user_id',
      description: 'Users can only update their own chat sessions'
    },
    {
      name: 'Users can delete own chat sessions',
      table: 'chat_sessions',
      operation: 'DELETE',
      using: 'auth.uid() = user_id',
      description: 'Users can only delete their own chat sessions'
    },
    
    // Messages RLS policies - dual protection via user_id and session ownership
    {
      name: 'Users can view own messages',
      table: 'messages',
      operation: 'SELECT',
      using: 'auth.uid() = user_id OR EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = messages.session_id AND chat_sessions.user_id = auth.uid())',
      description: 'Users can view messages they own directly or through session ownership'
    },
    {
      name: 'Users can insert own messages',
      table: 'messages',
      operation: 'INSERT',
      withCheck: 'auth.uid() = user_id AND EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = messages.session_id AND chat_sessions.user_id = auth.uid())',
      description: 'Users can only insert messages they own in their own sessions'
    },
    {
      name: 'Users can update own messages',
      table: 'messages',
      operation: 'UPDATE',
      using: 'auth.uid() = user_id AND EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = messages.session_id AND chat_sessions.user_id = auth.uid())',
      description: 'Users can only update their own messages in their own sessions'
    },
    {
      name: 'Users can delete own messages',
      table: 'messages',
      operation: 'DELETE',
      using: 'auth.uid() = user_id AND EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = messages.session_id AND chat_sessions.user_id = auth.uid())',
      description: 'Users can only delete their own messages in their own sessions'
    }
  ]
};

/**
 * Database query patterns and optimization notes
 */
export const QUERY_PATTERNS = {
  // Most common query patterns for index optimization
  getUserSessions: 'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
  getSessionMessages: 'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
  getUserRecentActivity: 'SELECT * FROM user_session_summary WHERE user_id = $1',
  
  // Performance considerations
  indexUsage: {
    'idx_chat_sessions_user_updated': 'Optimizes user session list with ordering',
    'idx_messages_session_created': 'Optimizes message retrieval within sessions',
    'idx_messages_user_timestamp': 'Optimizes user message history queries'
  }
} as const;