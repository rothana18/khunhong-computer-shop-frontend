import React from 'react'

interface CardProps {
  title?: string
  headerAction?: React.ReactNode
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ title, headerAction, children, className = '' }) => {
  return (
    <div className={`rounded-lg bg-white shadow ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {headerAction}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

export default Card
