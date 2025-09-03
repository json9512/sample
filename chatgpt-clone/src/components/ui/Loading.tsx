import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  centered?: boolean
  color?: string
  className?: string
}

const Loading = ({ 
  size = 'md', 
  text, 
  centered = false, 
  color = 'blue',
  className 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  const colorClass = `text-${color}-600`
  
  const spinnerElement = (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-current',
        sizeClasses[size],
        colorClass,
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
  
  if (centered) {
    return (
      <div className="flex justify-center items-center">
        {spinnerElement}
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    )
  }
  
  return (
    <div className={cn('inline-flex items-center', className)}>
      {spinnerElement}
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  )
}

export default Loading