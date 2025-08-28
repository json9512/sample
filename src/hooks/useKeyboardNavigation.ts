import { useEffect } from 'react'

interface KeyboardNavigationOptions {
  onNewConversation?: () => void
  onFocusInput?: () => void
  onToggleSidebar?: () => void
  disabled?: boolean
}

export function useKeyboardNavigation({
  onNewConversation,
  onFocusInput,
  onToggleSidebar,
  disabled = false
}: KeyboardNavigationOptions) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        onNewConversation?.()
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        onFocusInput?.()
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        onToggleSidebar?.()
      }
      
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        activeElement?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onNewConversation, onFocusInput, onToggleSidebar, disabled])
}