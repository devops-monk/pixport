import { useRef, useState } from 'react'
import clsx from 'clsx'
import { Camera, ImagePlus } from 'lucide-react'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Progress'
import { CameraCapture } from './CameraCapture'

interface Props {
  onFile: (file: File) => Promise<unknown>
  title: string
  hint: string
  cameraGuide?: boolean
}

export function DropZone({ onFile, title, hint, cameraGuide = false }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [camera, setCamera] = useState(false)

  const handle = async (file?: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      await onFile(file)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void handle(e.dataTransfer.files[0])
        }}
        className={clsx(
          'flex flex-col items-center rounded-[28px] border-2 border-dashed px-6 py-14 text-center transition-colors sm:py-20',
          over ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
        )}
      >
        <div className="mb-5 flex size-16 items-center justify-center rounded-[20px] bg-accent-soft text-accent">
          {busy ? <Spinner /> : <ImagePlus size={30} strokeWidth={1.8} />}
        </div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">{hint}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => input.current?.click()} disabled={busy}>
            Choose photo
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setCamera(true)} disabled={busy}>
            <Camera size={18} />
            Take photo
          </Button>
        </div>
        <p className="mt-5 text-[13px] text-ink-3">JPEG, PNG, WebP or HEIC · or drop a file here</p>
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            void handle(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <CameraCapture
        open={camera}
        guide={cameraGuide}
        onClose={() => setCamera(false)}
        onCapture={(file) => {
          setCamera(false)
          void handle(file)
        }}
      />
    </>
  )
}
