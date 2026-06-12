import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'warning' | 'success'
  isLoading?: boolean
  loadingLabel?: string
  fullWidth?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500 disabled:bg-accent-300',
  outline:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 disabled:bg-amber-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  loadingLabel,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin"
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
      )}
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  )
}

export default Button
