import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { invoicesApi } from '@/api/invoices'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { PAYMENT_METHODS } from '@/utils/constants'
import type { Invoice, PaymentMethod } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminInvoicesPage: React.FC = () => {
  usePageTitle('Invoices')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [query, setQuery] = useState({
    search: '',
    fromDate: '',
    toDate: '',
    paymentMethod: '' as PaymentMethod | '',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((q) => ({ ...q, search }))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetcher = useCallback(
    (page: number) =>
      invoicesApi.list({
        page,
        per_page: 20,
        search: query.search || undefined,
        from_date: query.fromDate || undefined,
        to_date: query.toDate || undefined,
        payment_method: query.paymentMethod || undefined,
      }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, total } = useInfiniteList<Invoice>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="invoice-search">
          Search invoices
        </label>
        <input
          id="invoice-search"
          type="search"
          placeholder="Search invoice, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <label htmlFor="invoice-from" className="flex items-center gap-1.5 text-sm text-gray-600">
          From
          <input
            id="invoice-from"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value)
              setQuery((q) => ({ ...q, fromDate: e.target.value }))
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </label>
        <label htmlFor="invoice-to" className="flex items-center gap-1.5 text-sm text-gray-600">
          To
          <input
            id="invoice-to"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value)
              setQuery((q) => ({ ...q, toDate: e.target.value }))
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </label>
        <label className="sr-only" htmlFor="invoice-payment-method">
          Filter by payment method
        </label>
        <select
          id="invoice-payment-method"
          value={paymentMethod}
          onChange={(e) => {
            const v = e.target.value as PaymentMethod | ''
            setPaymentMethod(v)
            setQuery((q) => ({ ...q, paymentMethod: v }))
          }}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All methods</option>
          {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {(search !== '' || fromDate !== '' || toDate !== '' || paymentMethod !== '') && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFromDate('')
              setToDate('')
              setPaymentMethod('')
              setQuery({ search: '', fromDate: '', toDate: '', paymentMethod: '' })
            }}
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loading className="py-20" />
      ) : (
        <>
          {total > 0 && <p className="mb-3 text-sm text-gray-500">{total} invoices</p>}
          <div>
            {items.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No invoices found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Invoice #</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {invoice.invoice_no}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{invoice.customer.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(invoice.financial.grand_total)}
                        </td>
                        <td className="px-4 py-3">
                          {invoice.is_voided ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Voided
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/invoices/${invoice.id}`}>
                            <Button variant="outline">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div ref={sentinelRef} />
            {isFetchingMore && <Loading className="py-6" />}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminInvoicesPage
