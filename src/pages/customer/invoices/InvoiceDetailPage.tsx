import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { invoicesApi } from '@/api/invoices'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { PAYMENT_METHODS } from '@/utils/constants'
import { apiMessage } from '@/utils/axiosError'
import type { Invoice } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    invoicesApi
      .getById(Number(id))
      .then((res) => setInvoice(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load invoice')))
      .finally(() => setLoading(false))
  }, [id])

  usePageTitle(invoice?.invoice_no)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!invoice) return null

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        <Link to="/invoices" className="text-sm text-primary-600 hover:underline">
          ← Back to invoices
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_no}</h1>
          <p className="text-sm text-gray-500">{formatDate(invoice.issue_date)}</p>
        </div>
        {invoice.is_voided && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            Voided
          </span>
        )}
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
                    <td className="py-2 text-right text-gray-600">{item.quantity}</td>
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
          <Card title="Invoice Details">
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

          {invoice.void_reason && (
            <Card title="Void Reason">
              <p className="text-sm text-gray-600">{invoice.void_reason}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetailPage
