import React, { useEffect, useId, useRef } from 'react'
import { FiX } from 'react-icons/fi'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: ModalSize
  children: React.ReactNode
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-lg',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, size = 'md', children }) => {
  const titleId = useId()
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) firstFocusableRef.current?.focus()
  }, [isOpen])

  // Prevent the page from scrolling behind the overlay while the modal is open.
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()

      if (e.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return
        const focusable = modal.querySelectorAll<HTMLElement>(
          'a,button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault()
          ;(e.shiftKey ? last : first).focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 w-full ${sizeClasses[size]} flex max-h-[90dvh] flex-col rounded-lg bg-white shadow-xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal
