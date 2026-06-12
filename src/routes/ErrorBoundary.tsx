import React from 'react'

interface State {
  hasError: boolean
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Replace with Sentry.captureException(error, { extra: info }) or similar in production
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
          <p className="text-sm text-gray-500">
            This page could not be loaded. Please refresh or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
