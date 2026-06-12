import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { invoicesApi } from '@/api/invoices'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const InvoicesPage: React.FC = () => {
  usePageTitle('My Invoices')
  const fetcher = useCallback((page: number) => invoicesApi.list({ page, per_page: 15 }), [])

  const { items, isLoading, isFetchingMore, error, sentinelRef } = useInfiniteList<Invoice>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
      </div>

      {isLoading && <Loading className="py-20" />}
      {error && <Alert type="error" message={error} />}

      {!isLoading && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No invoices found.</p>
          ) : (
            items.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoice_no}</p>
                  <p className="text-sm text-gray-500">{formatDate(invoice.issue_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(invoice.financial.grand_total)}
                  </p>
                  {invoice.is_voided && (
                    <span className="text-xs font-medium text-red-600">Voided</span>
                  )}
                </div>
              </Link>
            ))
          )}
          <div ref={sentinelRef} />
          {isFetchingMore && <Loading className="py-6" />}
        </div>
      )}
    </div>
  )
}

export default InvoicesPage
