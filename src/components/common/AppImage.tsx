import React, { useEffect, useState } from 'react'

interface Props {
  src: string | null | undefined
  alt: string
  className?: string
  fallback?: React.ReactNode
}

const AppImage: React.FC<Props> = ({ src, alt, className, fallback = null }) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) return <>{fallback}</>

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}

export default AppImage
