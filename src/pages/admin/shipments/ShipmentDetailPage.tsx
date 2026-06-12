import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { shipmentsApi } from '@/api/shipments'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import AppImage from '@/components/common/AppImage'
import { formatDate, formatDateTime, imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { SHIPMENT_STATUS_COLORS, SHIPMENT_STATUSES } from '@/utils/constants'
import type { Shipment } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [deliverOpen, setDeliverOpen] = useState(false)
  const [delivering, setDelivering] = useState(false)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => {
    if (!id) return
    shipmentsApi.getById(Number(id)).then((res) => setShipment(res.data.data))
  }

  useEffect(() => {
    if (!id) return
    shipmentsApi
      .getById(Number(id))
      .then((res) => setShipment(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load shipment')))
      .finally(() => setLoading(false))
  }, [id])

  const handleMarkDelivered = async () => {
    if (!shipment) return
    setDelivering(true)
    try {
      await shipmentsApi.markDelivered(shipment.id, {
        delivery_notes: deliveryNotes || undefined,
        proof_of_delivery: proofFile ?? undefined,
      })
      setDeliverOpen(false)
      setActionSuccess('Shipment marked as delivered')
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to mark as delivered'))
    } finally {
      setDelivering(false)
    }
  }

  usePageTitle(shipment?.tracking_number)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!shipment) return null

  const podUrl = imageUrl(shipment.proof_of_delivery)
  const canDeliver = shipment.status !== 'delivered'

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        <Link to="/admin/shipments" className="text-sm text-primary-600 hover:underline">
          ← Back to shipments
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
          <Card title="Shipment Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Tracking Number</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{shipment.tracking_number}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Carrier</dt>
                <dd className="mt-0.5">{shipment.carrier}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ship Date</dt>
                <dd className="mt-0.5">{formatDate(shipment.ship_date)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-0.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}
                  >
                    {SHIPMENT_STATUSES[shipment.status]}
                  </span>
                </dd>
              </div>
              {shipment.delivered_at && (
                <div>
                  <dt className="text-gray-500">Delivered At</dt>
                  <dd className="mt-0.5">{formatDateTime(shipment.delivered_at)}</dd>
                </div>
              )}
              {shipment.delivery_notes && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Delivery Notes</dt>
                  <dd className="mt-0.5">{shipment.delivery_notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          {podUrl && (
            <Card title="Proof of Delivery">
              <AppImage
                src={podUrl}
                alt="Proof of delivery"
                className="max-h-64 rounded object-contain"
                fallback={<p className="text-sm text-gray-500">Image not available</p>}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canDeliver && (
            <Button fullWidth onClick={() => setDeliverOpen(true)}>
              Mark as Delivered
            </Button>
          )}
          {shipment.order && (
            <Link to={`/admin/orders/${shipment.order_id}`}>
              <Button variant="outline" fullWidth>
                View Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mark as delivered — uses a custom modal for the optional proof upload */}
      {deliverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeliverOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Mark as Delivered</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Notes (optional)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Delivery (optional)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1"
                >
                  {proofFile ? proofFile.name : 'Choose image'}
                </Button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeliverOpen(false)} disabled={delivering}>
                Cancel
              </Button>
              <Button
                isLoading={delivering}
                loadingLabel="Marking..."
                onClick={handleMarkDelivered}
              >
                Confirm Delivery
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminShipmentDetailPage
