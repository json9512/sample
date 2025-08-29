import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

// Test component that uses the hook
const TestComponent = ({ options }: { options: Parameters<typeof useKeyboardNavigation>[0] }) => {
  useKeyboardNavigation(options)
  return <div data-testid="test-component">Test</div>
}

describe('useKeyboardNavigation', () => {
  const mockOptions = {
    onNewConversation: jest.fn(),
    onFocusInput: jest.fn(),
    onToggleSidebar: jest.fn(),
    disabled: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', jest.fn())
  })

  it('calls onNewConversation on Cmd+N', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'n',
      metaKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onNewConversation).toHaveBeenCalled()
  })

  it('calls onNewConversation on Ctrl+N', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'n',
      ctrlKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onNewConversation).toHaveBeenCalled()
  })

  it('calls onFocusInput on Cmd+L', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'l',
      metaKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onFocusInput).toHaveBeenCalled()
  })

  it('calls onFocusInput on Ctrl+L', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'l',
      ctrlKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onFocusInput).toHaveBeenCalled()
  })

  it('calls onToggleSidebar on Cmd+B', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'b',
      metaKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onToggleSidebar).toHaveBeenCalled()
  })

  it('calls onToggleSidebar on Ctrl+B', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'b',
      ctrlKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onToggleSidebar).toHaveBeenCalled()
  })

  it('blurs active element on Escape', () => {
    // Create a mock element with blur method
    const mockElement = {
      blur: jest.fn()
    }
    
    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      value: mockElement,
      configurable: true
    })
    
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'Escape'
    })
    
    expect(mockElement.blur).toHaveBeenCalled()
  })

  it('prevents default behavior for handled shortcuts', () => {
    const preventDefault = jest.fn()
    render(<TestComponent options={mockOptions} />)
    
    // Create a proper KeyboardEvent with preventDefault
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      bubbles: true,
      cancelable: true
    })
    
    // Spy on preventDefault
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    document.dispatchEvent(event)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(mockOptions.onNewConversation).toHaveBeenCalled()
  })

  it('does not call handlers when disabled', () => {
    const disabledOptions = { ...mockOptions, disabled: true }
    render(<TestComponent options={disabledOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'n',
      metaKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onNewConversation).not.toHaveBeenCalled()
  })

  it('ignores shortcuts without modifier keys', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'n'
    })
    
    expect(mockOptions.onNewConversation).not.toHaveBeenCalled()
  })

  it('ignores unhandled key combinations', () => {
    render(<TestComponent options={mockOptions} />)
    
    fireEvent.keyDown(document, {
      key: 'z',
      metaKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onNewConversation).not.toHaveBeenCalled()
    expect(mockOptions.onFocusInput).not.toHaveBeenCalled()
    expect(mockOptions.onToggleSidebar).not.toHaveBeenCalled()
  })

  it('handles missing callback functions gracefully', () => {
    const partialOptions = {
      onNewConversation: mockOptions.onNewConversation,
      // Missing other callbacks
    }
    
    expect(() => {
      render(<TestComponent options={partialOptions} />)
      
      fireEvent.keyDown(document, {
        key: 'l',
        metaKey: true,
        preventDefault: jest.fn()
      })
    }).not.toThrow()
  })

  it('works with both Mac (metaKey) and PC (ctrlKey) modifiers', () => {
    render(<TestComponent options={mockOptions} />)
    
    // Test Mac-style (Cmd)
    fireEvent.keyDown(document, {
      key: 'n',
      metaKey: true,
      ctrlKey: false,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onNewConversation).toHaveBeenCalledTimes(1)
    
    // Test PC-style (Ctrl)
    fireEvent.keyDown(document, {
      key: 'n',
      metaKey: false,
      ctrlKey: true,
      preventDefault: jest.fn()
    })
    
    expect(mockOptions.onNewConversation).toHaveBeenCalledTimes(2)
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    
    const { unmount } = render(<TestComponent options={mockOptions} />)
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    
    removeEventListenerSpy.mockRestore()
  })

  it('updates handlers when options change', () => {
    const newOnNewConversation = jest.fn()
    const { rerender } = render(<TestComponent options={mockOptions} />)
    
    // Update with new handler
    rerender(<TestComponent options={{ 
      ...mockOptions, 
      onNewConversation: newOnNewConversation 
    }} />)
    
    fireEvent.keyDown(document, {
      key: 'n',
      metaKey: true,
      preventDefault: jest.fn()
    })
    
    expect(newOnNewConversation).toHaveBeenCalled()
    expect(mockOptions.onNewConversation).not.toHaveBeenCalled()
  })
})