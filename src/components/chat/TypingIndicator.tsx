interface TypingIndicatorProps {
  name?: string
}

export function TypingIndicator({ name = "Assistant" }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
        A
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {name} is typing
        </span>
        <div className="flex gap-1">
          <div 
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }} 
          />
          <div 
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }} 
          />
          <div 
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }} 
          />
        </div>
      </div>
    </div>
  )
}