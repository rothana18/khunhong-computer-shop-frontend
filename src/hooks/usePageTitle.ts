import { useEffect } from 'react'

const SITE_NAME = 'Khunhong Computer Shop'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    // No cleanup: the incoming page's usePageTitle call sets the new title.
    // Resetting to SITE_NAME here caused a visible flash during route transitions.
  }, [title])
}
