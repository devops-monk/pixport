import { MotionConfig } from 'motion/react'
import { useApp } from './store/app'
import { Home } from './components/home/Home'
import { PassportFlow } from './components/passport/PassportFlow'
import { EditorFlow } from './components/editor/EditorFlow'
import { Toasts } from './components/ui/Toasts'

export default function App() {
  const screen = useApp((s) => s.screen)
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        {screen === 'home' && <Home />}
        {screen === 'passport' && <PassportFlow />}
        {screen === 'editor' && <EditorFlow />}
      </div>
      <Toasts />
    </MotionConfig>
  )
}
