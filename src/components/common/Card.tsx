import React from 'react'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`rounded-lg bg-white shadow ${className}`}>
      {title && (
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

export default Card
