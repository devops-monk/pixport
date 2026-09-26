import { loadImageFile } from './image/load'
import { usePhoto } from '../store/photo'
import { useApp } from '../store/app'
import { usePassport } from '../store/passport'
import { useEditor } from '../store/editor'

/** Load a photo and move the chosen flow forward. Heavy models start in the background. */
export async function openPhoto(file: File, mode: 'passport' | 'editor'): Promise<boolean> {
  const app = useApp.getState()
  try {
    const image = await loadImageFile(file)
    usePhoto.getState().setImage(image)
    if (mode === 'passport') {
      usePassport.getState().resetEdits()
      void usePhoto.getState().ensureScan()
      void usePhoto.getState().ensureCutout()
      app.setPassportStep('document')
      app.go('passport')
    } else {
      useEditor.getState().reset()
      app.go('editor')
    }
    return true
  } catch (err) {
    app.toast(err instanceof Error ? err.message : 'That photo could not be opened.', 'error')
    return false
  }
}
