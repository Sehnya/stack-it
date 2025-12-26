import { useState } from 'react'

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
}

export const LazyImage = ({ 
  src, 
  alt, 
  fallback,
  className = '',
  ...props 
}: LazyImageProps) => {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleError = () => {
    setError(true)
  }

  const handleLoad = () => {
    setLoaded(true)
  }

  if (error && fallback) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        loading="lazy"
        {...props}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${!loaded ? 'animate-pulse bg-gray-200' : ''}`}
      loading="lazy"
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  )
}

export default LazyImage
