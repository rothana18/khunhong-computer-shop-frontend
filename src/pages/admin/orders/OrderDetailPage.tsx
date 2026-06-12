import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { invoicesApi } from '@/api/invoices'
import { shipmentsApi } from '@/api/shipments'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import FormInput from '@/components/common/FormInput'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, formatDate, imageUrl } from '@/utils/formatters'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUSES,
  SHIPPING_METHODS,
} from '@/utils/constants'
import { apiMessage } from '@/utils/axiosError'
import { useForm } from '@/hooks/useForm'
import { validateRequired } from '@/utils/validation'
import type { Order } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

interface InvoiceFormValues {
  discount_amount: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
}

interface ShipmentFormValues {
  tracking_number: string
  carrier: string
  ship_date: string
}

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [shipmentModal, setShipmentModal] = useState(false)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [creatingShipment, setCreatingShipment] = useState(false)

  /**
   * Single fetch implementation used for both initial load and post-action
   * refresh. Pass `silent: true` to skip the full-page loading state and
   * surface errors in the action-level alert instead.
   */
  const fetchOrder = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!id) return
      ordersApi
        .getById(Number(id))
        .then((res) => setOrder(res.data.data))
        .catch((err) => {
          const msg = apiMessage(
            err,
            opts?.silent ? 'Failed to refresh order' : 'Failed to load order'
          )
          if (opts?.silent) setActionError(msg)
          else setError(msg)
        })
        .finally(() => {
          if (!opts?.silent) setLoading(false)
        })
    },
    [id]
  )

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const reload = useCallback(() => fetchOrder({ silent: true }), [fetchOrder])

  const invoiceForm = useForm<InvoiceFormValues>({
    initialValues: {
      discount_amount: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      shipping_address: '',
    },
    onSubmit: async (vals) => {
      if (!order) return
      setGeneratingInvoice(true)
      try {
        await invoicesApi.generate(order.id, {
          discount_amount: vals.discount_amount ? Number(vals.discount_amount) : undefined,
          customer_name: vals.customer_name || undefined,
          customer_email: vals.customer_email || undefined,
          customer_phone: vals.customer_phone || undefined,
          shipping_address: vals.shipping_address || undefined,
        })
        setInvoiceModal(false)
        setActionSuccess('Invoice generated')
        reload()
      } catch (err) {
        setActionError(apiMessage(err, 'Failed to generate invoice'))
      } finally {
        setGeneratingInvoice(false)
      }
    },
  })

  const shipmentForm = useForm<ShipmentFormValues>({
    initialValues: { tracking_number: '', carrier: '', ship_date: '' },
    validate: (vals) => {
      const e: Record<string, string> = {}
      const fields: (keyof ShipmentFormValues)[] = ['tracking_number', 'carrier', 'ship_date']
      for (const f of fields) {
        const r = validateRequired(vals[f])
        if (!r.valid) e[f] = r.message!
      }
      return e
    },
    onSubmit: async (vals) => {
      if (!order) return
      setCreatingShipment(true)
      try {
        await shipmentsApi.create(order.id, {
          tracking_number: vals.tracking_number,
          carrier: vals.carrier,
          ship_date: vals.ship_date,
        })
        setShipmentModal(false)
        setActionSuccess('Shipment created')
        reload()
      } catch (err) {
        setActionError(apiMessage(err, 'Failed to create shipment'))
      } finally {
        setCreatingShipment(false)
      }
    },
  })

  usePageTitle(order ? order.invoice_no : undefined)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!order) return null

  // COD orders are paid on delivery, so we always allow shipment creation.
  // For all other payment methods the order must be paid before shipping.
  const canCreateShipment =
    !order.shipment &&
    (order.payment_method === 'cash_on_delivery' || order.payment_status === 'paid')
  const canGenerateInvoice = !order.invoice
  const payment = order.payments?.[0]

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">
          ← Back to orders
        </Link>
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />
      )}

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="flex items-center gap-2 py-3">
                      <AppImage
                        src={imageUrl(item.product_image_url)}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                      <span className="text-gray-900">{item.name}</span>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr className="border-t">
                  <td colSpan={2} className="pt-3 text-right text-gray-500">
                    Subtotal
                  </td>
                  <td className="pt-3 text-right text-gray-700">
                    {formatCurrency(order.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="pt-1 text-right text-gray-500">
                    Shipping
                  </td>
                  <td className="pt-1 text-right text-gray-700">
                    {formatCurrency(order.shipping_cost)}
                  </td>
                </tr>
                {order.discount_amount > 0 && (
                  <tr>
                    <td colSpan={2} className="pt-1 text-right text-gray-500">
                      Discount
                    </td>
                    <td className="pt-1 text-right text-green-600">
                      −{formatCurrency(order.discount_amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t">
                  <td colSpan={2} className="pt-2 text-right font-semibold">
                    Total
                  </td>
                  <td className="pt-2 text-right font-bold text-primary-700">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Order Info">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Invoice #</dt>
                <dd className="font-medium">{order.invoice_no}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd>{formatDate(order.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                  >
                    {ORDER_STATUSES[order.status]}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment</dt>
                <dd>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
                  >
                    {PAYMENT_STATUSES[order.payment_status]}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment Method</dt>
                <dd>{PAYMENT_METHODS[order.payment_method]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd>{SHIPPING_METHODS[order.shipping_method]}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Customer">
            <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
            <p className="text-sm text-gray-500">{order.customer_email}</p>
          </Card>

          {payment?.id && (
            <Card title="Payment">
              <p className="text-sm text-gray-700">Status: {payment.status}</p>
              <Link to={`/admin/payments/${payment.id}`}>
                <Button variant="outline" fullWidth className="mt-2">
                  Manage Payment
                </Button>
              </Link>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            {canGenerateInvoice && (
              <Button variant="secondary" fullWidth onClick={() => setInvoiceModal(true)}>
                Generate Invoice
              </Button>
            )}
            {order.invoice && (
              <Link to={`/admin/invoices/${order.invoice.id}`}>
                <Button variant="outline" fullWidth>
                  View Invoice
                </Button>
              </Link>
            )}
            {canCreateShipment && (
              <Button fullWidth onClick={() => setShipmentModal(true)}>
                Create Shipment
              </Button>
            )}
            {order.shipment && (
              <Link to={`/admin/shipments/${order.shipment.id}`}>
                <Button variant="outline" fullWidth>
                  View Shipment
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={invoiceModal}
        onClose={() => setInvoiceModal(false)}
        title="Generate Invoice"
        size="md"
      >
        <form onSubmit={invoiceForm.handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            All fields are optional and default to the order values.
          </p>
          <FormInput
            label="Customer Name"
            name="customer_name"
            value={invoiceForm.values.customer_name}
            onChange={invoiceForm.handleChange}
            onBlur={invoiceForm.handleBlur}
          />
          <FormInput
            label="Customer Email"
            name="customer_email"
            type="email"
            value={invoiceForm.values.customer_email}
            onChange={invoiceForm.handleChange}
            onBlur={invoiceForm.handleBlur}
          />
          <FormInput
            label="Discount Amount ($)"
            name="discount_amount"
            type="number"
            value={invoiceForm.values.discount_amount}
            onChange={invoiceForm.handleChange}
            onBlur={invoiceForm.handleBlur}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setInvoiceModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={generatingInvoice} loadingLabel="Generating...">
              Generate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Shipment Modal */}
      <Modal
        isOpen={shipmentModal}
        onClose={() => setShipmentModal(false)}
        title="Create Shipment"
        size="md"
      >
        <form onSubmit={shipmentForm.handleSubmit} className="space-y-4">
          <FormInput
            label="Tracking Number"
            name="tracking_number"
            value={shipmentForm.values.tracking_number}
            onChange={shipmentForm.handleChange}
            onBlur={shipmentForm.handleBlur}
            error={shipmentForm.errors.tracking_number}
            touched={shipmentForm.touched.tracking_number}
            required
          />
          <FormInput
            label="Carrier"
            name="carrier"
            value={shipmentForm.values.carrier}
            onChange={shipmentForm.handleChange}
            onBlur={shipmentForm.handleBlur}
            error={shipmentForm.errors.carrier}
            touched={shipmentForm.touched.carrier}
            required
          />
          <FormInput
            label="Ship Date"
            name="ship_date"
            type="date"
            value={shipmentForm.values.ship_date}
            onChange={shipmentForm.handleChange}
            onBlur={shipmentForm.handleBlur}
            error={shipmentForm.errors.ship_date}
            touched={shipmentForm.touched.ship_date}
            required
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShipmentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingShipment} loadingLabel="Creating...">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminOrderDetailPage
