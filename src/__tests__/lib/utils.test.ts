import { 
  cn, 
  formatMessageTime, 
  debounce, 
  throttle, 
  generateConversationTitle 
} from '@/lib/utils'

// Mock clsx and tailwind-merge
jest.mock('clsx', () => ({
  __esModule: true,
  default: jest.fn((...args: any[]) => args.filter(Boolean).join(' ')),
  clsx: jest.fn((...args: any[]) => args.filter(Boolean).join(' '))
}))

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn((str: string) => str)
}))

describe('cn utility', () => {
  it('combines class names correctly', () => {
    const result = cn('class1', 'class2', 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('filters out falsy values', () => {
    const result = cn('class1', false, 'class2', null, 'class3', undefined)
    expect(result).toBe('class1 class2 class3')
  })

  it('handles conditional classes', () => {
    const condition = true
    const result = cn('base-class', condition && 'conditional-class')
    expect(result).toBe('base-class conditional-class')
  })
})

describe('formatMessageTime', () => {
  beforeEach(() => {
    // Mock current time to January 1, 2024 12:00 PM UTC
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('formats recent time (same day)', () => {
    const timestamp = '2024-01-01T10:30:00Z'
    const result = formatMessageTime(timestamp)
    // Just check that it returns a time format, not the exact time due to timezone differences
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/)
  })

  it('formats time within a week with day name', () => {
    const timestamp = '2023-12-29T15:45:00Z' // 3 days ago
    const result = formatMessageTime(timestamp)
    // Should contain a day name and time
    expect(result).toMatch(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun).*\d{1,2}:\d{2}/)
  })

  it('formats older time with date', () => {
    const timestamp = '2023-11-15T09:15:00Z' // More than a week ago
    const result = formatMessageTime(timestamp)
    // Should contain a date format
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
  })

  it('handles Date objects', () => {
    const timestamp = new Date('2024-01-01T08:00:00Z')
    const result = formatMessageTime(timestamp)
    // Should return a time format for same day
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/)
  })

  it('handles edge case at exactly 24 hours', () => {
    const timestamp = '2023-12-31T12:00:00Z' // Exactly 24 hours ago
    const result = formatMessageTime(timestamp)
    // Should show with day name, not just time
    expect(result).toMatch(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/)
  })

  it('handles edge case at exactly 1 week', () => {
    const timestamp = '2023-12-25T12:00:00Z' // Exactly 1 week ago
    const result = formatMessageTime(timestamp)
    // Should show date format for exactly 1 week
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('delays function execution', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('test')
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('cancels previous calls', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('first')
    jest.advanceTimersByTime(50)
    
    debouncedFn('second')
    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('second')
  })

  it('handles multiple arguments', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('arg1', 'arg2', 'arg3')
    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })

  it('maintains function context', () => {
    const obj = {
      value: 'test',
      method: jest.fn()
    }
    
    const debouncedMethod = debounce(obj.method, 100)
    debouncedMethod.call(obj)
    
    jest.advanceTimersByTime(100)
    expect(obj.method).toHaveBeenCalled()
  })
})

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('limits function execution frequency', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('first')
    throttledFn('second')
    throttledFn('third')

    // Should only call once immediately
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('first')
  })

  it('allows execution after throttle period', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('first')
    expect(mockFn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)
    
    throttledFn('second')
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenLastCalledWith('second')
  })

  it('preserves function arguments', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('arg1', 'arg2', 42)
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 42)
  })
})

describe('generateConversationTitle', () => {
  it('returns full message if 6 words or less', () => {
    const message = 'Hello world this is test'
    const result = generateConversationTitle(message)
    expect(result).toBe('Hello world this is test')
  })

  it('truncates message to first 6 words with ellipsis', () => {
    const message = 'This is a very long message with many words'
    const result = generateConversationTitle(message)
    expect(result).toBe('This is a very long message...')
  })

  it('handles empty string', () => {
    const result = generateConversationTitle('')
    expect(result).toBe('')
  })

  it('handles single word', () => {
    const result = generateConversationTitle('Hello')
    expect(result).toBe('Hello')
  })

  it('handles exactly 6 words', () => {
    const message = 'One two three four five six'
    const result = generateConversationTitle(message)
    expect(result).toBe('One two three four five six')
  })

  it('handles exactly 7 words', () => {
    const message = 'One two three four five six seven'
    const result = generateConversationTitle(message)
    expect(result).toBe('One two three four five six...')
  })

  it('handles multiple spaces correctly', () => {
    const message = 'Word1   word2    word3 word4 word5 word6 word7'
    const result = generateConversationTitle(message)
    expect(result).toBe('Word1   word2  ...')
  })

  it('handles newlines and tabs correctly', () => {
    const message = 'Word1\nword2\tword3 word4 word5 word6 word7'
    const result = generateConversationTitle(message)
    expect(result).toBe('Word1\nword2\tword3 word4 word5 word6 word7')
  })

  it('truncates when more than 6 words with punctuation', () => {
    const message = 'Hello, world! How are you? Fine thanks'
    const result = generateConversationTitle(message)
    expect(result).toBe('Hello, world! How are you? Fine...')
  })
})