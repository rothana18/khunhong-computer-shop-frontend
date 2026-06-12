import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { invoicesApi } from '@/api/invoices'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { PAYMENT_METHODS } from '@/utils/constants'
import { apiMessage } from '@/utils/axiosError'
import type { Invoice } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [voidModal, setVoidModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [restoreStock, setRestoreStock] = useState(false)
  const [voiding, setVoiding] = useState(false)

  const reload = () => {
    if (!id) return
    invoicesApi
      .getById(Number(id))
      .then((res) => setInvoice(res.data.data))
      .catch((err) => setActionError(apiMessage(err, 'Failed to reload invoice')))
  }

  useEffect(() => {
    if (!id) return
    invoicesApi
      .getById(Number(id))
      .then((res) => setInvoice(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load invoice')))
      .finally(() => setLoading(false))
  }, [id])

  const handleVoid = async () => {
    if (!invoice) return
    setVoiding(true)
    try {
      await invoicesApi.void(invoice.id, { reason: voidReason, restore_stock: restoreStock })
      setVoidModal(false)
      setActionSuccess('Invoice voided')
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to void invoice'))
    } finally {
      setVoiding(false)
    }
  }

  usePageTitle(invoice?.invoice_no)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!invoice) return null

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        <Link to="/admin/invoices" className="text-sm text-primary-600 hover:underline">
          ← Back to invoices
        </Link>
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_no}</h1>
          <p className="text-sm text-gray-500">{formatDate(invoice.issue_date)}</p>
        </div>
        <div className="flex items-center gap-3">
          {invoice.is_voided ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              Voided
            </span>
          ) : (
            <Button variant="danger" onClick={() => setVoidModal(true)}>
              Void Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Order Items">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-gray-900">{item.name}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={2} className="pt-2 text-right text-gray-700">
                    Subtotal
                  </td>
                  <td className="pt-2 text-right font-medium">
                    {formatCurrency(invoice.financial.subtotal)}
                  </td>
                </tr>
                {invoice.financial.shipping_cost > 0 && (
                  <tr>
                    <td colSpan={2} className="text-right text-gray-700">
                      Shipping
                    </td>
                    <td className="text-right">
                      {formatCurrency(invoice.financial.shipping_cost)}
                    </td>
                  </tr>
                )}
                {invoice.financial.discount_amount > 0 && (
                  <tr>
                    <td colSpan={2} className="text-right text-gray-700">
                      Discount
                    </td>
                    <td className="text-right text-green-600">
                      −{formatCurrency(invoice.financial.discount_amount)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} className="pt-1 text-right font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="pt-1 text-right font-bold text-primary-700">
                    {formatCurrency(invoice.financial.grand_total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Invoice Info">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Invoice #</dt>
                <dd className="font-medium">{invoice.invoice_no}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd>{formatDate(invoice.issue_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment</dt>
                <dd>{PAYMENT_METHODS[invoice.payment.method]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Order Status</dt>
                <dd>{invoice.order.status}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Bill To">
            <div className="space-y-0.5 text-sm text-gray-700">
              <p className="font-medium">{invoice.customer.name}</p>
              {invoice.customer.email && <p>{invoice.customer.email}</p>}
              {invoice.customer.shipping_phone && <p>{invoice.customer.shipping_phone}</p>}
              {invoice.customer.address && (
                <p className="mt-1 text-gray-500">{invoice.customer.address}</p>
              )}
            </div>
          </Card>

          <Link to={`/admin/orders/${invoice.order.id}`}>
            <Button variant="outline" fullWidth>
              View Order
            </Button>
          </Link>

          {invoice.void_reason && (
            <Card title="Void Reason">
              <p className="text-sm text-gray-600">{invoice.void_reason}</p>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={voidModal} onClose={() => setVoidModal(false)} title="Void Invoice" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={3}
              minLength={5}
              maxLength={255}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={restoreStock}
              onChange={(e) => setRestoreStock(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Restore product stock
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setVoidModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={voiding}
              loadingLabel="Voiding..."
              onClick={handleVoid}
              disabled={voidReason.trim().length < 5}
            >
              Void Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminInvoiceDetailPage
