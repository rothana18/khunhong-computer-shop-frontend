import React from 'react'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'

/** danger = irreversible (red) · warning = reversible destructive (amber) · success = positive/restorative (green) */
type ConfirmVariant = 'danger' | 'warning' | 'success'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  onConfirm: () => void
  onCancel: () => void
  isProcessing?: boolean
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          isLoading={isProcessing}
          loadingLabel="Processing..."
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmationModal
