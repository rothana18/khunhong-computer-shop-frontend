import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as useAuthModule from '@/hooks/useAuth'
import ProtectedRoute from '../ProtectedRoute'
import type { AuthState } from '@/context/authContext'

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
const mockUseAuth = vi.mocked(useAuthModule.useAuth)

function setup(stateOverrides: Partial<AuthState> = {}) {
  mockUseAuth.mockReturnValue({
    state: {
      isAuthenticated: false,
      loading: false,
      user: null,
      error: null,
      ...stateOverrides,
    },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    updateUser: vi.fn(),
  } as ReturnType<typeof useAuthModule.useAuth>)

  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/auth/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProtectedRoute', () => {
  it('shows loading spinner while auth is loading', () => {
    setup({ loading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    setup({ isAuthenticated: false })
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    setup({
      isAuthenticated: true,
      user: {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'j@d.com',
        role: 'customer',
        permissions: [],
      },
    })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /unauthorized when role does not match', () => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: true,
        loading: false,
        user: {
          id: 1,
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'j@d.com',
          role: 'customer',
          permissions: [],
        },
        error: null,
      },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Unauthorized')).toBeInTheDocument()
  })
})
