import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface StreamingMessageProps {
  content: string
  onStreamComplete?: () => void
  className?: string
  delay?: number
  bufferSize?: number
}

export function StreamingMessage({ 
  content, 
  onStreamComplete, 
  className = '',
  delay = 25,
  bufferSize = 3
}: StreamingMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex >= content.length) {
      setIsComplete(true)
      onStreamComplete?.()
      return
    }

    const timer = setTimeout(() => {
      const nextIndex = Math.min(currentIndex + bufferSize, content.length)
      setDisplayedText(content.slice(0, nextIndex))
      setCurrentIndex(nextIndex)
    }, delay)

    return () => clearTimeout(timer)
  }, [content, currentIndex, delay, bufferSize, onStreamComplete])

  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [content])

  return (
    <div className={cn('relative', className)}>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {displayedText}
        {!isComplete && (
          <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
        )}
      </div>
    </div>
  )
}