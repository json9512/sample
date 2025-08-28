// Unit tests for validation utilities
// Tests input validation and sanitization

import { isValidUUID, validateId, validatePagination } from '@/lib/database/validation'

describe('Validation Utilities', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '550e8400-e29b-41d4-a716-446655440000'
      ]

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true)
      })
    })

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        '', // empty string
        '123e4567e89b12d3a456426614174000' // no hyphens
      ]

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false)
      })
    })
  })

  describe('validateId', () => {
    it('should validate correct IDs', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000'
      const result = validateId(validId)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid IDs', () => {
      const invalidId = 'not-a-uuid'
      const result = validateId(invalidId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ID must be a valid UUID')
    })

    it('should reject empty IDs', () => {
      const result = validateId('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ID is required and must be a string')
    })

    it('should use custom field name in error messages', () => {
      const result = validateId('invalid', 'Conversation ID')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Conversation ID must be a valid UUID')
    })
  })

  describe('validatePagination', () => {
    it('should validate correct pagination options', () => {
      const options = { limit: 50, offset: 10 }
      const result = validatePagination(options)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept undefined options', () => {
      const options = {}
      const result = validatePagination(options)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid limit', () => {
      const options = { limit: 0 }
      const result = validatePagination(options)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Limit must be a number between 1 and 1000')
    })

    it('should reject limit too high', () => {
      const options = { limit: 1001 }
      const result = validatePagination(options)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Limit must be a number between 1 and 1000')
    })

    it('should reject negative offset', () => {
      const options = { offset: -1 }
      const result = validatePagination(options)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Offset must be a non-negative number')
    })

    it('should accept zero offset', () => {
      const options = { offset: 0 }
      const result = validatePagination(options)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})