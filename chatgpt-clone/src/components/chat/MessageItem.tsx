import type { MessageItemProps } from '@/types/chat'

export function MessageItem({ message, isLast }: MessageItemProps) {
  const isUser = message.role === 'user'
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div 
      data-testid="message-container"
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          isUser ? 'bg-blue-600' : 'bg-gray-700'
        }`}>
          {isUser ? 'Y' : 'C'}
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">
              {isUser ? 'You' : 'Claude'}
            </span>
            <span className="text-xs text-gray-500">
              {timestamp}
            </span>
          </div>
          
          <div className={`px-4 py-2 rounded-2xl max-w-full ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}>
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}