import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, formatDate, imageUrl } from '@/utils/formatters'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  SHIPPING_METHODS,
} from '@/utils/constants'
import { apiMessage } from '@/utils/axiosError'
import type { Order } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const justPlaced = (location.state as { justPlaced?: boolean } | null)?.justPlaced
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!proofFile) {
      setProofPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(proofFile)
    setProofPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [proofFile])

  useEffect(() => {
    if (!id) return
    ordersApi
      .getById(Number(id))
      .then((res) => setOrder(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load order')))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!order) return
    setCancelling(true)
    try {
      await ordersApi.cancel(order.id)
      navigate('/orders')
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to cancel order'))
    } finally {
      setCancelling(false)
      setCancelOpen(false)
    }
  }

  const handleUploadProof = async () => {
    if (!order || !proofFile) return
    const payment = order.payments?.[0]
    if (!payment) return

    setUploadingProof(true)
    setActionError(null)
    try {
      await paymentsApi.uploadProof(payment.id, proofFile)
      setActionSuccess('Payment proof uploaded successfully')
      setProofFile(null)
      // refresh order
      const res = await ordersApi.getById(order.id)
      setOrder(res.data.data)
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to upload proof'))
    } finally {
      setUploadingProof(false)
    }
  }

  usePageTitle(order ? order.invoice_no : undefined)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!order) return null

  const payment = order.payments?.[0]
  const canCancel = order.status === 'pending'
  const canUploadProof = payment && payment.status === 'pending' && !payment.payment_proof_url

  return (
    <div>
      <div className="mb-4">
        <Link to="/orders" className="text-sm text-primary-600 hover:underline">
          ← Back to orders
        </Link>
      </div>

      {justPlaced && <Alert type="success" message="Your order has been placed successfully!" />}
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
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </td>
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
                  <td colSpan={2} className="pt-2 text-right font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="pt-2 text-right font-bold text-primary-700">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {canUploadProof && (
            <Card title="Upload Payment Proof">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    {proofFile ? 'Change image' : 'Choose image'}
                  </Button>
                  {proofFile && (
                    <Button
                      isLoading={uploadingProof}
                      loadingLabel="Uploading..."
                      onClick={handleUploadProof}
                    >
                      Upload
                    </Button>
                  )}
                </div>
                {proofPreviewUrl && (
                  <img
                    src={proofPreviewUrl}
                    alt="Payment proof preview"
                    className="max-h-48 rounded-md border border-gray-200 object-contain"
                  />
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Order Info">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Order #</dt>
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

          <Card title="Delivery Address">
            <address className="space-y-0.5 text-sm not-italic text-gray-700">
              <p className="font-medium">{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_phone}</p>
            </address>
          </Card>

          {order.order_notes && (
            <Card title="Notes">
              <p className="text-sm text-gray-600">{order.order_notes}</p>
            </Card>
          )}

          {canCancel && (
            <Button variant="danger" fullWidth onClick={() => setCancelOpen(true)}>
              Cancel Order
            </Button>
          )}

          {order.shipment && (
            <Card title="Shipment">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tracking #</dt>
                  <dd className="font-medium">{order.shipment.tracking_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Carrier</dt>
                  <dd>{order.shipment.carrier}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd>{SHIPMENT_STATUSES[order.shipment.status]}</dd>
                </div>
              </dl>
            </Card>
          )}

          {order.customer_name && (
            <Card title="Customer">
              <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
              <p className="text-sm text-gray-500">{order.customer_email}</p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={cancelOpen}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will restore product stock."
        confirmLabel="Cancel Order"
        cancelLabel="Keep order"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
        isProcessing={cancelling}
      />
    </div>
  )
}

export default OrderDetailPage
