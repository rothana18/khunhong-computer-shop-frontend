import React from 'react'

interface LoadingProps {
  fullPage?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
  label?: string
}

const sizeClasses = {
  small: 'h-5 w-5',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
}

const Loading: React.FC<LoadingProps> = ({
  fullPage = false,
  size = 'medium',
  className = '',
  label = 'Loading...',
}) => {
  const spinner = (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg
        className={`animate-spin text-primary-600 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )

  if (fullPage) {
    return <div className="flex h-screen items-center justify-center">{spinner}</div>
  }

  return spinner
}

export default Loading
