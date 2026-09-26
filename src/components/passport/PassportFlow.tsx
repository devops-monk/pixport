import { AnimatePresence, motion } from 'motion/react'
import { TopBar } from '../layout/TopBar'
import { Steps } from '../layout/Steps'
import { useApp, type PassportStep } from '../../store/app'
import { usePhoto } from '../../store/photo'
import { PhotoStep } from './PhotoStep'
import { DocumentStep } from './DocumentStep'
import { AdjustStep } from './AdjustStep'
import { ExportStep } from './ExportStep'

const STEPS: { id: PassportStep; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'document', label: 'Document' },
  { id: 'adjust', label: 'Adjust' },
  { id: 'export', label: 'Save & print' },
]

const BACK: Record<PassportStep, PassportStep | 'home'> = {
  photo: 'home',
  document: 'photo',
  adjust: 'document',
  export: 'adjust',
}

export function PassportFlow() {
  const step = useApp((s) => s.passportStep)
  const setStep = useApp((s) => s.setPassportStep)
  const go = useApp((s) => s.go)
  const hasImage = usePhoto((s) => !!s.image)

  const back = BACK[step]
  const onBack = () => (back === 'home' ? go('home') : setStep(back))

  return (
    <>
      <TopBar
        onBack={onBack}
        backLabel={back === 'home' ? 'Home' : STEPS.find((s) => s.id === back)!.label}
        center={
          <Steps
            steps={STEPS}
            current={step}
            reachable={(id) => id === 'photo' || hasImage}
            onSelect={setStep}
          />
        }
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {step === 'photo' && <PhotoStep />}
          {step === 'document' && <DocumentStep />}
          {step === 'adjust' && <AdjustStep />}
          {step === 'export' && <ExportStep />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
