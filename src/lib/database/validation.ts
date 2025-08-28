// Validation utilities for database operations
// Provides input validation and sanitization

import type { CreateConversationData, UpdateConversationData } from './conversations'
import type { CreateMessageData, UpdateMessageData } from './messages'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Conversation validation
export class ConversationValidator {
  
  static validateCreateData(data: CreateConversationData): ValidationResult {
    const errors: string[] = []

    // Title validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required and must be a string')
    } else {
      if (data.title.trim().length === 0) {
        errors.push('Title cannot be empty')
      }
      if (data.title.length > 200) {
        errors.push('Title must be 200 characters or less')
      }
    }

    // User ID validation (optional for client-side)
    if (data.user_id !== undefined) {
      if (typeof data.user_id !== 'string' || data.user_id.trim().length === 0) {
        errors.push('User ID must be a valid string')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateUpdateData(data: UpdateConversationData): ValidationResult {
    const errors: string[] = []

    // Title validation (optional for updates)
    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push('Title must be a string')
      } else {
        if (data.title.trim().length === 0) {
          errors.push('Title cannot be empty')
        }
        if (data.title.length > 200) {
          errors.push('Title must be 200 characters or less')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static sanitizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ')
  }
}

// Message validation
export class MessageValidator {
  
  static validateCreateData(data: CreateMessageData): ValidationResult {
    const errors: string[] = []

    // Conversation ID validation
    if (!data.conversation_id || typeof data.conversation_id !== 'string') {
      errors.push('Conversation ID is required and must be a string')
    } else if (data.conversation_id.trim().length === 0) {
      errors.push('Conversation ID cannot be empty')
    }

    // Role validation
    if (!data.role) {
      errors.push('Role is required')
    } else if (!['user', 'assistant'].includes(data.role)) {
      errors.push('Role must be either "user" or "assistant"')
    }

    // Content validation
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Content is required and must be a string')
    } else {
      if (data.content.trim().length === 0) {
        errors.push('Content cannot be empty')
      }
      if (data.content.length > 10000) {
        errors.push('Content must be 10,000 characters or less')
      }
    }

    // Metadata validation (optional)
    if (data.metadata !== undefined) {
      if (typeof data.metadata !== 'object' || data.metadata === null || Array.isArray(data.metadata)) {
        errors.push('Metadata must be a valid object')
      } else {
        try {
          JSON.stringify(data.metadata)
        } catch {
          errors.push('Metadata must be JSON serializable')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateUpdateData(data: UpdateMessageData): ValidationResult {
    const errors: string[] = []

    // Content validation (optional for updates)
    if (data.content !== undefined) {
      if (typeof data.content !== 'string') {
        errors.push('Content must be a string')
      } else {
        if (data.content.trim().length === 0) {
          errors.push('Content cannot be empty')
        }
        if (data.content.length > 10000) {
          errors.push('Content must be 10,000 characters or less')
        }
      }
    }

    // Metadata validation (optional)
    if (data.metadata !== undefined) {
      if (typeof data.metadata !== 'object' || data.metadata === null || Array.isArray(data.metadata)) {
        errors.push('Metadata must be a valid object')
      } else {
        try {
          JSON.stringify(data.metadata)
        } catch {
          errors.push('Metadata must be JSON serializable')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static sanitizeContent(content: string): string {
    // Remove null bytes and normalize whitespace
    return content
      .replace(/\0/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim()
  }
}

// UUID validation
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// General ID validation
export function validateId(id: string, fieldName: string = 'ID'): ValidationResult {
  const errors: string[] = []

  if (!id || typeof id !== 'string') {
    errors.push(`${fieldName} is required and must be a string`)
  } else if (!isValidUUID(id)) {
    errors.push(`${fieldName} must be a valid UUID`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Pagination validation
export interface PaginationOptions {
  limit?: number
  offset?: number
}

export function validatePagination(options: PaginationOptions): ValidationResult {
  const errors: string[] = []

  if (options.limit !== undefined) {
    if (typeof options.limit !== 'number' || options.limit < 1 || options.limit > 1000) {
      errors.push('Limit must be a number between 1 and 1000')
    }
  }

  if (options.offset !== undefined) {
    if (typeof options.offset !== 'number' || options.offset < 0) {
      errors.push('Offset must be a non-negative number')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}