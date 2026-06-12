import React, { useCallback, useEffect, useState } from 'react'
import { invoicesApi } from '@/api/invoices'
import { shipmentsApi } from '@/api/shipments'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { PAYMENT_METHODS } from '@/utils/constants'
import type { InvoiceAnalytics, ShipmentSummary } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

// Functions rather than constants so that each component mount gets a fresh
// value. Module-level constants are frozen at bundle-load time and become
// stale if the page is left open overnight or cached across days.
const getToday = () => new Date().toISOString().split('T')[0]
const getFirstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

const AdminDashboardPage: React.FC = () => {
  usePageTitle('Dashboard')
  const [analytics, setAnalytics] = useState<InvoiceAnalytics | null>(null)
  const [summary, setSummary] = useState<ShipmentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Input state (unconfirmed while the user is typing)
  const [fromInput, setFromInput] = useState(getFirstOfMonth)
  const [toInput, setToInput] = useState(getToday)
  // Applied state — only changes on explicit "Apply"
  const [fromDate, setFromDate] = useState(getFirstOfMonth)
  const [toDate, setToDate] = useState(getToday)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([invoicesApi.analyticsSummary(fromDate, toDate), shipmentsApi.summary()])
      .then(([analyticsRes, summaryRes]) => {
        setAnalytics(analyticsRes.data.data)
        setSummary(summaryRes.data.data)
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [fromDate, toDate])

  useEffect(() => {
    load()
  }, [load])

  const handleApply = () => {
    setFromDate(fromInput)
    setToDate(toInput)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-from" className="text-gray-600">
              From
            </label>
            <input
              id="dashboard-from"
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-to" className="text-gray-600">
              To
            </label>
            <input
              id="dashboard-to"
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading && <Loading className="py-20" />}

      {!loading && analytics && summary && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Revenue ({formatDate(fromDate)} – {formatDate(toDate)})
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  {
                    label: 'Total Revenue',
                    value: formatCurrency(analytics.summary.total_revenue),
                    color: 'text-primary-700',
                  },
                  {
                    label: 'Invoices',
                    value: analytics.summary.total_invoices,
                    color: 'text-gray-900',
                  },
                  {
                    label: 'Discounts',
                    value: formatCurrency(analytics.summary.total_discounts),
                    color: 'text-amber-600',
                  },
                  {
                    label: 'Refunds',
                    value: formatCurrency(analytics.summary.total_refunds),
                    color: 'text-red-600',
                  },
                ] as const
              ).map((card) => (
                <Card key={card.label}>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Revenue by Payment Method
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                Object.entries(analytics.by_payment_method) as [
                  keyof typeof analytics.by_payment_method,
                  { count: number; total: number },
                ][]
              ).map(([method, data]) => (
                <Card key={method}>
                  <p className="text-xs text-gray-500">{PAYMENT_METHODS[method]}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(data.total)}
                  </p>
                  <p className="text-xs text-gray-400">{data.count} transactions</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Shipments
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  { label: 'In Transit', value: summary.in_transit, color: 'text-blue-700' },
                  { label: 'Ready to Ship', value: summary.ready_to_ship, color: 'text-amber-600' },
                  {
                    label: 'Delivered Today',
                    value: summary.delivered_today,
                    color: 'text-green-600',
                  },
                  { label: 'Cancelled', value: summary.cancelled_total, color: 'text-red-600' },
                ] as const
              ).map((card) => (
                <Card key={card.label}>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
