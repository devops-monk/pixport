import { useEffect, useState } from 'react'

/** Object URL for a canvas, kept until the next canvas is encoded so images never flash blank. */
export function useCanvasUrl(canvas: HTMLCanvasElement | null, type = 'image/jpeg', quality = 0.92): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!canvas) {
      setUrl(null)
      return
    }
    let cancelled = false
    canvas.toBlob(
      (blob) => {
        if (cancelled || !blob) return
        const next = URL.createObjectURL(blob)
        setUrl((prev) => {
          if (prev) setTimeout(() => URL.revokeObjectURL(prev), 1000)
          return next
        })
      },
      type,
      quality,
    )
    return () => {
      cancelled = true
    }
  }, [canvas, type, quality])
  return url
}
