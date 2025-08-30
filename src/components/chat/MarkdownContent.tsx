import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
}

export const MarkdownContent = memo(function MarkdownContent({ 
  content, 
  className 
}: MarkdownContentProps) {
  return (
    <div className={cn('prose prose-sm prose-neutral dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize code block styling
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            
            if (isInline) {
              return (
                <code 
                  className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-sm font-mono" 
                  {...props}
                >
                  {children}
                </code>
              )
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          // Customize pre block styling
          pre: ({ children }) => (
            <pre className="bg-gray-900 dark:bg-gray-800 text-gray-100 rounded-lg p-4 overflow-x-auto">
              {children}
            </pre>
          ),
          // Customize paragraph spacing
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          // Customize list styling
          ul: ({ children }) => (
            <ul className="mb-3 pl-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 pl-4 space-y-1">{children}</ol>
          ),
          // Customize blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})