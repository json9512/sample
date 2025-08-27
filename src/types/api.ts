// API related types

export interface ApiResponse<T = any> {
  data?: T
  error?: {
    code: string
    message: string
    statusCode: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  hasMore: boolean
}

// Error types
export interface ApiError {
  code: string
  message: string
  statusCode?: number
  details?: any
}

// Request/Response wrappers
export type ApiResult<T> = Promise<ApiResponse<T>>
export type PaginatedResult<T> = Promise<ApiResponse<PaginatedResponse<T>>>