import React from 'react'
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  type: AlertType
  message: string | null
  onClose?: () => void
}

const configs: Record<AlertType, { bg: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-50 border-green-300',
    text: 'text-green-800',
    icon: <FiCheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />,
  },
  error: {
    bg: 'bg-red-50 border-red-300',
    text: 'text-red-800',
    icon: <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />,
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-300',
    text: 'text-yellow-800',
    icon: <FiAlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />,
  },
  info: {
    bg: 'bg-blue-50 border-blue-300',
    text: 'text-blue-800',
    icon: <FiInfo className="h-5 w-5 text-blue-400" aria-hidden="true" />,
  },
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  if (!message) return null

  const { bg, text, icon } = configs[type]

  return (
    <div role="alert" className={`flex items-start gap-3 rounded-md border p-4 ${bg}`}>
      <span className="shrink-0 pt-0.5">{icon}</span>
      <p className={`flex-1 text-sm ${text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className={`shrink-0 rounded ${text} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1`}
        >
          <FiX className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default Alert
