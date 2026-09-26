import { useEffect, useRef, useState } from 'react'
import { SwitchCamera } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Button, IconButton } from '../ui/Button'
import { Spinner } from '../ui/Progress'
import { canvasToBlob, createCanvas, ctx2d } from '../../lib/image/canvas'

interface Props {
  open: boolean
  guide: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function CameraCapture({ open, guide, onClose, onCapture }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let stream: MediaStream | null = null
    let cancelled = false
    setReady(false)
    setError(null)
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (video.current) {
          video.current.srcObject = s
          void video.current.play()
        }
      })
      .catch(() => setError('Camera access was blocked. Allow the camera in your browser settings, or choose a photo instead.'))
    if (!navigator.mediaDevices) setError('This browser can’t use the camera. Choose a photo instead.')
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [open, facing])

  const shoot = async () => {
    const v = video.current
    if (!v) return
    const c = createCanvas(v.videoWidth, v.videoHeight)
    const ctx = ctx2d(c)
    if (facing === 'user') {
      // Save what the person saw in the mirror-like preview.
      ctx.translate(c.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, 0, 0)
    const blob = await canvasToBlob(c, 'image/jpeg', 0.95)
    onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }))
  }

  const countdown = () => {
    let n = 3
    setCount(n)
    const t = setInterval(() => {
      n -= 1
      if (n === 0) {
        clearInterval(t)
        setCount(null)
        void shoot()
      } else setCount(n)
    }, 1000)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Take a photo" wide>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
        <video
          ref={video}
          playsInline
          muted
          onLoadedMetadata={() => setReady(true)}
          className="size-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
        />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Spinner />
          </div>
        )}
        {error && <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-[15px] text-white/90">{error}</p>}
        {guide && ready && (
          <svg viewBox="0 0 400 300" className="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <mask id="cam-mask">
                <rect width="400" height="300" fill="white" />
                <ellipse cx="200" cy="130" rx="62" ry="84" fill="black" />
              </mask>
            </defs>
            <rect width="400" height="300" fill="black" opacity="0.35" mask="url(#cam-mask)" />
            <ellipse cx="200" cy="130" rx="62" ry="84" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>
        )}
        {count !== null && (
          <div className="absolute inset-0 flex items-center justify-center text-[96px] font-semibold text-white drop-shadow-lg">{count}</div>
        )}
      </div>
      {guide && (
        <p className="mt-3 text-center text-[13px] text-ink-2">
          Fit your face in the oval, look straight at the camera and keep a neutral expression. Stand about 1 m from a plain wall.
        </p>
      )}
      <div className="mt-4 flex items-center justify-center gap-3">
        <IconButton label="Switch camera" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} className="bg-surface-2">
          <SwitchCamera size={18} />
        </IconButton>
        <Button size="lg" onClick={() => void shoot()} disabled={!ready || count !== null}>
          Capture
        </Button>
        <Button size="lg" variant="secondary" onClick={countdown} disabled={!ready || count !== null}>
          3 s timer
        </Button>
      </div>
    </Sheet>
  )
}
