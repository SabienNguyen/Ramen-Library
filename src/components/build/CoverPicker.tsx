import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { COVER_TEMPLATES, type CoverTemplateId } from '../../../shared/bowl'
import { cn } from '@/lib/utils'
import type { Bowl } from '@/store/bowl'
import { BuildCover } from './CoverArt'

export type CoverChoice = {
  /** a freshly picked file, not yet uploaded */
  file: File | null
  /** an already-uploaded photo */
  imageUrl: string | null
  thumbUrl: string | null
  templateId: CoverTemplateId
}

export const defaultCover = (existing?: Partial<CoverChoice>): CoverChoice => ({ file: null, imageUrl: null, thumbUrl: null, templateId: 'live', ...existing })

/** Pick a photo, or an illustrated template for people who haven't shot the bowl yet. */
export function CoverPicker({ bowl, name, value, onChange }: { bowl: Bowl; name?: string; value: CoverChoice; onChange: (v: CoverChoice) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!value.file) return setPreview(null)
    const url = URL.createObjectURL(value.file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value.file])

  const pick = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    onChange({ ...value, file, imageUrl: null, thumbUrl: null })
  }
  const clearPhoto = () => onChange({ ...value, file: null, imageUrl: null, thumbUrl: null })
  const hasPhoto = !!(value.file || value.imageUrl)
  const photoSrc = preview ?? value.thumbUrl ?? value.imageUrl

  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold">Photo</span>
          {hasPhoto && (
            <button type="button" onClick={clearPhoto} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
              <X className="size-3" /> Remove
            </button>
          )}
        </div>
        {hasPhoto && photoSrc ? (
          <button type="button" onClick={() => inputRef.current?.click()} className="group relative block w-full overflow-hidden rounded-xl border border-border">
            <img src={photoSrc} alt="" className="aspect-[4/3] w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-foreground/60 py-1.5 text-xs font-semibold text-background opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-3.5" /> Replace photo
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files[0] ?? null)
            }}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-1 border border-dashed px-3 py-4 text-center',
              dragging ? 'border-primary bg-muted' : 'border-input hover:bg-muted',
            )}
          >
            <ImagePlus className="size-6 text-muted-foreground" />
            <span className="text-[12px] font-bold">Add a photo</span>
            <span className="text-[11px] text-muted-foreground">JPEG, PNG or WebP up to 8 MB.</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </div>

      <div>
        <div className="mb-1 text-[11px] font-bold">{hasPhoto ? 'Or use a drawing' : 'Drawing'}</div>
        <div className="grid grid-cols-5 gap-2">
          {COVER_TEMPLATES.map((t) => {
            const selected = !hasPhoto && value.templateId === t.id
            return (
              <button
                key={t.id}
                type="button"
                title={t.blurb}
                onClick={() => onChange({ ...value, file: null, imageUrl: null, thumbUrl: null, templateId: t.id })}
                className={cn('overflow-hidden border-2 text-left', selected ? 'border-primary' : 'border-border hover:border-input')}
              >
                <BuildCover build={{ bowl, templateId: t.id, name }} className="aspect-[4/3]" />
                <span className="block truncate px-1 py-0.5 text-[10px]">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
