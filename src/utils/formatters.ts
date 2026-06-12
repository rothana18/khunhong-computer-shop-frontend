import type { User } from '@/types'

export const formatCurrency = (amount: string | number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount))

export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export const formatDateTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '')

export const imageUrl = (path: string | undefined | null): string | null => {
  if (!path) return null
  try {
    const { pathname } = new URL(path)
    return `${API_BASE}${pathname}`
  } catch {
    return `${API_BASE}/storage/${path}`
  }
}

export const fullName = (user: Pick<User, 'first_name' | 'last_name'>): string =>
  `${user.first_name} ${user.last_name}`

/** "manage_users" -> "Manage Users" */
export const formatPermission = (slug: string): string =>
  slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

type Badge = { label: string; className: string }

const ROLE_BADGES: Record<string, Badge> = {
  admin:    { label: 'Administrator', className: 'bg-violet-100 text-violet-800' },
  staff:    { label: 'Staff',         className: 'bg-blue-100 text-blue-800'    },
  customer: { label: 'Customer',      className: 'bg-sky-100 text-sky-800'      },
}

export const formatUserRoleBadge = (role: string): Badge =>
  ROLE_BADGES[role] ?? {
    label: role.charAt(0).toUpperCase() + role.slice(1),
    className: 'bg-gray-100 text-gray-800',
  }

const STATUS_BADGES: Record<string, Badge> = {
  active:   { label: 'Active',   className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', className: 'bg-amber-100 text-amber-800' },
  banned:   { label: 'Banned',   className: 'bg-red-100 text-red-800'    },
}

export const formatUserStatusBadge = (status: string): Badge =>
  STATUS_BADGES[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: 'bg-gray-100 text-gray-800',
  }
