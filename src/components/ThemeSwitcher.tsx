import { useEffect, useRef, useState } from 'react'
import { Check, Palette, X } from 'lucide-react'
import { THEMES, useTheme } from '../theme'
import { cn } from '../lib/utils'

/** Barre flottante discrète (bas droite) pour changer de direction artistique en direct. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="fixed right-4 bottom-4 z-[45] flex flex-col items-end gap-2">
      {open && (
        <div className="animate-pop-in card-surface w-[300px] bg-white p-2 shadow-2xl">
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Direction artistique</span>
            <button onClick={() => setOpen(false)} className="cursor-pointer rounded-md p-0.5 text-slate-400 hover:text-slate-700" aria-label="Fermer">
              <X size={14} />
            </button>
          </div>
          {THEMES.map((t) => {
            const active = t.id === theme.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors', active ? 'bg-slate-100' : 'hover:bg-slate-50')}
              >
                <ThemePreview swatch={t.swatch} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-slate-900">{t.nom}</span>
                  <span className="block truncate text-[11px] text-slate-500">{t.description}</span>
                </span>
                {active && <Check size={15} className="shrink-0 text-emerald-600" />}
              </button>
            )
          })}
        </div>
      )}

      <div className="card-surface flex items-center gap-1 bg-white/90 p-1 shadow-lg backdrop-blur">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          aria-expanded={open}
          title="Changer de design"
        >
          <Palette size={14} />
          <span className="hidden sm:inline">{theme.nom}</span>
        </button>
        <span className="h-4 w-px bg-slate-200" />
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.nom}
            aria-label={`Thème ${t.nom}`}
            className={cn(
              'grid h-7 w-7 cursor-pointer place-items-center rounded-lg transition-transform hover:scale-110',
              t.id === theme.id && 'ring-2 ring-slate-900 ring-offset-1 ring-offset-white',
            )}
          >
            <span className="h-4 w-4 overflow-hidden rounded-full border border-black/10" style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[2]} 50%)` }} />
          </button>
        ))}
      </div>
    </div>
  )
}

/** Mini-maquette du thème : sidebar, fond, carte et accent. */
function ThemePreview({ swatch: [side, bg, accent, card] }: { swatch: [string, string, string, string] }) {
  return (
    <span className="flex h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10" style={{ background: bg }}>
      <span className="w-3.5" style={{ background: side }}>
        <span className="mx-auto mt-1.5 block h-1 w-1.5 rounded-full" style={{ background: accent }} />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-1.5">
        <span className="h-2.5 rounded-[3px] border border-black/5" style={{ background: card }} />
        <span className="h-1.5 w-2/3 rounded-full" style={{ background: accent }} />
      </span>
    </span>
  )
}
