import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MessageSquare, Plus, Search, Trash2, X } from 'lucide-react'
import { Conversation } from '@/types/chat'

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  isLoading?: boolean
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
  isMobileMenuOpen = false,
  onCloseMobileMenu
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatUpdatedAt = (updatedAt: string) => {
    const date = new Date(updatedAt)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return 'Today'
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300"
          onClick={onCloseMobileMenu}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        // Base styles
        "h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col",
        
        // Mobile: Fixed overlay positioning
        "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw]",
        "transform transition-transform duration-300 ease-in-out",
        
        // Desktop: Static positioning
        "lg:relative lg:translate-x-0 lg:w-80 lg:max-w-none",
        
        // Mobile show/hide state
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Conversations</h2>
          <button
            onClick={onCloseMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* New conversation button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              onNewConversation()
              if (onCloseMobileMenu) onCloseMobileMenu()
            }}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors',
              // Larger touch targets on mobile
              'touch-manipulation min-h-[44px]',
              'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>
        
        {/* Search with mobile optimizations */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-9 pr-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                // Mobile optimization
                "touch-manipulation text-base",
                // CJK text optimization
                "leading-relaxed"
              )}
            />
          </div>
        </div>
        
        {/* Conversation list with mobile touch optimization */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {isLoading && conversations.length === 0 ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchTerm && (
                <p className="text-xs text-gray-400 mt-1">
                  Start a new conversation to begin chatting
                </p>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-colors',
                  // Enhanced touch targets
                  'touch-manipulation min-h-[60px]',
                  'hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700',
                  activeConversationId === conversation.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
                    : 'border-l-transparent'
                )}
                onClick={() => {
                  onSelectConversation(conversation.id)
                  if (onCloseMobileMenu) onCloseMobileMenu()
                }}
              >
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm font-medium text-gray-900 dark:text-gray-100 truncate",
                    // CJK text optimization
                    "leading-relaxed break-words"
                  )}>
                    {conversation.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatUpdatedAt(conversation.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conversation.id)
                  }}
                  className={cn(
                    "p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all",
                    // Better mobile touch target
                    "touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center",
                    // Show on mobile without hover
                    "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  )}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}