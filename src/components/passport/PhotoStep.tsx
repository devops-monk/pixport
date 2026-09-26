import { useEffect } from 'react'
import { DropZone } from '../upload/DropZone'
import { openPhoto } from '../../lib/start'
import { preloadFaceModel } from '../../lib/ml/face'
import { preloadBackgroundModel } from '../../lib/ml/removeBackground'

const TIPS = [
  { title: 'Face the camera', body: 'Look straight ahead with a neutral expression and your mouth closed.' },
  { title: 'Light it evenly', body: 'Stand facing a window or soft light. Avoid shadows on your face.' },
  { title: 'Leave some room', body: 'Include your shoulders and the space above your head. Pixport does the cropping.' },
]

export function PhotoStep() {
  useEffect(() => {
    preloadFaceModel()
    preloadBackgroundModel()
  }, [])

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <DropZone
        cameraGuide
        title="Add your photo"
        hint="Any recent, sharp photo of you works. You’ll choose the country and check the fit next."
        onFile={(file) => openPhoto(file, 'passport')}
      />
      <ul className="mt-10 grid gap-6 sm:grid-cols-3">
        {TIPS.map((t) => (
          <li key={t.title}>
            <h3 className="text-[15px] font-semibold">{t.title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{t.body}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
