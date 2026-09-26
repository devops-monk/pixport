import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Redo2, Undo2 } from 'lucide-react'
import { TopBar } from '../layout/TopBar'
import { Studio } from '../layout/Studio'
import { Button, IconButton } from '../ui/Button'
import { Segmented } from '../ui/Segmented'
import { DropZone } from '../upload/DropZone'
import { EditorStage } from './EditorStage'
import { BackgroundPanel } from './BackgroundPanel'
import { AdjustPanel } from './AdjustPanel'
import { FilterPanel } from './FilterPanel'
import { CropPanel, type Aspect } from './CropPanel'
import { ExportSheet } from './ExportSheet'
import { useApp } from '../../store/app'
import { usePhoto } from '../../store/photo'
import { useEditor } from '../../store/editor'
import { openPhoto } from '../../lib/start'
import { renderEdit, type Sources } from '../../lib/image/compose'
import type { Rect } from '../../types'

export type EditorTab = 'background' | 'adjust' | 'filters' | 'crop'

const PREVIEW_SIZE = 1600

export function useSources(): Sources | null {
  const image = usePhoto((s) => s.image)
  const cutout = usePhoto((s) => s.cutout)
  const bgImage = useEditor((s) => s.bgImage)
  return useMemo(() => (image ? { original: image.canvas, cutout, bgImage } : null), [image, cutout, bgImage])
}

export function EditorFlow() {
  const go = useApp((s) => s.go)
  const image = usePhoto((s) => s.image)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const [tab, setTab] = useState<EditorTab>('background')
  const [exportOpen, setExportOpen] = useState(false)
  const [aspect, setAspect] = useState<Aspect>('original')
  const [pendingCrop, setPendingCrop] = useState<Rect | null>(null)

  const sources = useSources()
  const recipe = useDeferredValue(useEditor((s) => s.recipe))
  const preview = useMemo(
    () => (sources ? renderEdit(sources, recipe, { maxSize: PREVIEW_SIZE, uncropped: tab === 'crop' }) : null),
    [sources, recipe, tab],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'range') return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <>
      <TopBar
        onBack={() => go('home')}
        backLabel="Home"
        center={image && <p className="truncate text-center text-[15px] font-semibold">{image.name}</p>}
        right={
          image && (
            <>
              <IconButton label="Undo" onClick={undo} disabled={!canUndo}>
                <Undo2 size={18} />
              </IconButton>
              <IconButton label="Redo" onClick={redo} disabled={!canRedo} className="hidden sm:inline-flex">
                <Redo2 size={18} />
              </IconButton>
              <Button size="sm" className="ml-1" onClick={() => setExportOpen(true)}>
                Export
              </Button>
            </>
          )
        }
      />

      {!image ? (
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
          <DropZone
            title="Open a photo to edit"
            hint="Remove or replace the background, crop, straighten and adjust colour. Nothing is uploaded."
            onFile={(file) => openPhoto(file, 'editor')}
          />
        </main>
      ) : (
        <Studio
          stage={
            <EditorStage
              preview={preview}
              cropMode={tab === 'crop'}
              aspect={aspect}
              onCropChange={setPendingCrop}
            />
          }
          inspector={
            <>
              <div className="px-5 pt-5">
                <Segmented
                  label="Tool"
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: 'background', label: 'Background' },
                    { value: 'adjust', label: 'Adjust' },
                    { value: 'filters', label: 'Filters' },
                    { value: 'crop', label: 'Crop' },
                  ]}
                />
              </div>
              {tab === 'background' && <BackgroundPanel />}
              {tab === 'adjust' && <AdjustPanel />}
              {tab === 'filters' && <FilterPanel />}
              {tab === 'crop' && (
                <CropPanel aspect={aspect} setAspect={setAspect} pendingCrop={pendingCrop} onDone={() => setTab('adjust')} />
              )}
            </>
          }
        />
      )}

      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}
