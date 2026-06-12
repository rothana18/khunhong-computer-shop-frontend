import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { paymentsApi } from '@/api/payments'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import FormInput from '@/components/common/FormInput'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, formatDate, imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { PAYMENT_METHODS } from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'
import type { Payment } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminPaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { state } = useAuth()
  const isAdmin = state.user?.role === 'admin'
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [statusModal, setStatusModal] = useState(false)
  const [refundModal, setRefundModal] = useState(false)
  const [newStatus, setNewStatus] = useState<'pending' | 'completed' | 'failed' | 'cancelled'>(
    'completed'
  )
  const [transactionId, setTransactionId] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = () => {
    if (!id) return
    paymentsApi
      .getById(Number(id))
      .then((res) => setPayment(res.data.data))
      .catch((err) => setActionError(apiMessage(err, 'Failed to reload payment')))
  }

  useEffect(() => {
    if (!id) return
    paymentsApi
      .getById(Number(id))
      .then((res) => setPayment(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load payment')))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdateStatus = async () => {
    if (!payment) return
    setSaving(true)
    try {
      await paymentsApi.updateStatus(payment.id, {
        status: newStatus,
        transaction_id: transactionId || undefined,
        payment_date: paymentDate || undefined,
      })
      setStatusModal(false)
      setActionSuccess('Payment status updated')
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to update payment'))
    } finally {
      setSaving(false)
    }
  }

  const handleRefund = async () => {
    if (!payment) return
    setSaving(true)
    try {
      await paymentsApi.refund(payment.id, refundReason)
      setRefundModal(false)
      setActionSuccess('Payment refunded')
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to refund payment'))
    } finally {
      setSaving(false)
    }
  }

  usePageTitle('Payment')

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!payment) return null

  const proofUrl = imageUrl(payment.payment_proof_url)
  // 'paid' is a PaymentStatus on orders, not a valid Payment.status value.
  // Guard only against the terminal state that should not be re-updated.
  const canUpdate = payment.status !== 'completed'

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        {payment.order && (
          <Link
            to={`/admin/orders/${payment.order_id}`}
            className="text-sm text-primary-600 hover:underline"
          >
            ← Back to Order
          </Link>
        )}
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />
      )}

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Payment Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Amount</dt>
                <dd className="mt-0.5 text-xl font-bold text-primary-700">
                  {formatCurrency(payment.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-0.5 font-medium capitalize text-gray-900">{payment.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Method</dt>
                <dd className="mt-0.5">{PAYMENT_METHODS[payment.method]}</dd>
              </div>
              {payment.transaction_id && (
                <div>
                  <dt className="text-gray-500">Transaction ID</dt>
                  <dd className="mt-0.5 font-mono text-xs">{payment.transaction_id}</dd>
                </div>
              )}
              {payment.payment_date && (
                <div>
                  <dt className="text-gray-500">Payment Date</dt>
                  <dd className="mt-0.5">{formatDate(payment.payment_date)}</dd>
                </div>
              )}
              {payment.is_refunded && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Refund Reason</dt>
                  <dd className="mt-0.5 text-gray-700">{payment.refund_reason}</dd>
                </div>
              )}
            </dl>
          </Card>

          {proofUrl && (
            <Card title="Payment Proof">
              <AppImage
                src={proofUrl}
                alt="Payment proof"
                className="max-h-64 rounded object-contain"
                fallback={<p className="text-sm text-gray-500">Image not available</p>}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canUpdate && (
            <Button fullWidth onClick={() => setStatusModal(true)}>
              Update Status
            </Button>
          )}
          {isAdmin && payment.status === 'completed' && !payment.is_refunded && (
            <Button variant="danger" fullWidth onClick={() => setRefundModal(true)}>
              Issue Refund
            </Button>
          )}
          {payment.order && (
            <Link to={`/admin/orders/${payment.order_id}`}>
              <Button variant="outline" fullWidth>
                View Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Modal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Payment Status"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <FormInput
            label="Transaction ID (optional)"
            name="transaction_id"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            onBlur={() => {}}
          />
          <FormInput
            label="Payment Date (optional)"
            name="payment_date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            onBlur={() => {}}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setStatusModal(false)}>
              Cancel
            </Button>
            <Button isLoading={saving} loadingLabel="Saving..." onClick={handleUpdateStatus}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={refundModal}
        onClose={() => setRefundModal(false)}
        title="Issue Refund"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Refund Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              minLength={10}
              maxLength={500}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setRefundModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={saving}
              loadingLabel="Processing..."
              onClick={handleRefund}
              disabled={refundReason.trim().length < 10}
            >
              Issue Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminPaymentDetailPage
