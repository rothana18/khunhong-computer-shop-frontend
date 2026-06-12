import { isAxiosError } from 'axios'
import type { AxiosError } from 'axios'

export { isAxiosError }

const METHOD_VERBS: Record<string, string> = {
  GET: 'retrieving',
  POST: 'creating',
  PUT: 'updating',
  PATCH: 'updating',
  DELETE: 'deleting',
}

function requestPath(err: AxiosError): string {
  const base = err.config?.baseURL ?? ''
  const basePath = (() => {
    try {
      return new URL(base).pathname
    } catch {
      return base
    }
  })()
  const url = err.config?.url ?? ''
  const path = basePath.replace(/\/$/, '') + url
  console.log('[Err] API Path: ' + path)
  return path
}

export const apiMessage = (err: unknown, fallback: string): string => {
  if (!isAxiosError(err)) {
    // unknown error type -> use fallback message
    return fallback
  }

  const path = requestPath(err)
  const method = (err.config?.method ?? '').toUpperCase()
  const verb = METHOD_VERBS[method] ?? 'calling'

  if (!err.response) {
    // network error or timeout -> no HTTP response object
    if (path) {
      return `${fallback} (network error - no response received for ${path}).`
    } else {
      return `${fallback} (network error - no response received).`
    }
  }

  const { status, data } = err.response
  const apiMsg: string | null =
    data != null && typeof data.message === 'string' ? data.message : null

  const lead = (apiMsg ?? fallback).replace(/[.!?]\s*$/, '')
  const detail = path
    ? `The API responded with error code ${status} when ${verb} ${path}`
    : `The API responded with error code ${status}`

  return `${lead}. ${detail}.`
}
