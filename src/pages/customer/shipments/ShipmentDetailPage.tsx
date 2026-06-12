import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { shipmentsApi } from '@/api/shipments'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import AppImage from '@/components/common/AppImage'
import { formatDate, formatDateTime, imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { SHIPMENT_STATUS_COLORS, SHIPMENT_STATUSES } from '@/utils/constants'
import type { Shipment } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    shipmentsApi
      .getById(Number(id))
      .then((res) => setShipment(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load shipment')))
      .finally(() => setLoading(false))
  }, [id])

  usePageTitle(shipment?.tracking_number)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!shipment) return null

  const podUrl = imageUrl(shipment.proof_of_delivery)

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        <Link to="/shipments" className="text-sm text-primary-600 hover:underline">
          ← Back to shipments
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Shipment Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Tracking Number</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{shipment.tracking_number}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Carrier</dt>
                <dd className="mt-0.5 text-gray-900">{shipment.carrier}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ship Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(shipment.ship_date)}</dd>
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
                  <dd className="mt-0.5 text-gray-900">{formatDateTime(shipment.delivered_at)}</dd>
                </div>
              )}
              {shipment.delivery_notes && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Delivery Notes</dt>
                  <dd className="mt-0.5 text-gray-900">{shipment.delivery_notes}</dd>
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

        <div>
          {shipment.order && (
            <Card title="Order">
              <Link
                to={`/orders/${shipment.order_id}`}
                className="text-sm text-primary-600 hover:underline"
              >
                View Order #{shipment.order.invoice_no}
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShipmentDetailPage
