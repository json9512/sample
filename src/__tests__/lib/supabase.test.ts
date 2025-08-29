import { createResult, isDatabaseError, DatabaseError, createErrorResult, createSuccessResult } from '@/lib/supabase'

describe('supabase utilities', () => {
  describe('createResult', () => {
    it('creates success result with data', () => {
      const data = { id: '123', name: 'test' }
      const result = createResult(data, null)
      
      expect(result).toEqual({
        data,
        error: null
      })
    })

    it('creates error result with database error', () => {
      const error = { message: 'Test error', code: 'TEST_ERROR' }
      const result = createResult(null, error)
      
      expect(result).toEqual({
        data: null,
        error
      })
    })

    it('filters out non-database errors', () => {
      const regularError = new Error('Regular error')
      const result = createResult(null, regularError)
      
      expect(result).toEqual({
        data: null,
        error: null
      })
    })

    it('handles null data with null error', () => {
      const result = createResult(null, null)
      
      expect(result).toEqual({
        data: null,
        error: null
      })
    })
  })

  describe('isDatabaseError', () => {
    it('identifies database errors correctly', () => {
      const dbError: DatabaseError = {
        message: 'Database error',
        code: 'PGRST116'
      }
      
      expect(isDatabaseError(dbError)).toBe(true)
    })

    it('rejects non-database errors', () => {
      const regularError = new Error('Regular error')
      expect(isDatabaseError(regularError)).toBe(false)
      
      const objectWithoutCode = { message: 'No code' }
      expect(isDatabaseError(objectWithoutCode)).toBe(false)
      
      const nullValue = null
      expect(isDatabaseError(nullValue)).toBeFalsy()
      
      const undefinedValue = undefined
      expect(isDatabaseError(undefinedValue)).toBeFalsy()
    })

    it('handles edge cases', () => {
      const emptyObject = {}
      expect(isDatabaseError(emptyObject)).toBe(false)
      
      const stringValue = 'error string'
      expect(isDatabaseError(stringValue)).toBe(false)
      
      const numberValue = 404
      expect(isDatabaseError(numberValue)).toBe(false)
    })
  })

  describe('helper functions', () => {
    it('createSuccessResult works correctly', () => {
      const data = { id: '123', value: 'test' }
      const result = createSuccessResult(data)
      
      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })

    it('createErrorResult works correctly', () => {
      const error: DatabaseError = {
        message: 'Test error',
        code: 'TEST_CODE'
      }
      const result = createErrorResult<any>(error)
      
      expect(result.data).toBeNull()
      expect(result.error).toEqual(error)
    })
  })

  describe('integration scenarios', () => {
    it('works with typical database operation results', () => {
      // Success scenario
      const successData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
      const successResult = createResult(successData, null)
      
      expect(successResult.data).toEqual(successData)
      expect(successResult.error).toBeNull()
      expect(isDatabaseError(successResult.error)).toBeFalsy()
      
      // Error scenario
      const dbError: DatabaseError = {
        message: 'Foreign key constraint violation',
        code: 'PGRST301'
      }
      const errorResult = createResult(null, dbError)
      
      expect(errorResult.data).toBeNull()
      expect(errorResult.error).toEqual(dbError)
      expect(isDatabaseError(errorResult.error)).toBe(true)
    })

    it('handles network error scenarios', () => {
      const networkError = {
        message: 'Network request failed',
        code: 'FETCH_ERROR'
      }
      
      const result = createResult(null, networkError)
      
      expect(result.data).toBeNull()
      expect(result.error).toEqual(networkError)
      expect(isDatabaseError(result.error)).toBe(true) // Has code property
    })
  })
})