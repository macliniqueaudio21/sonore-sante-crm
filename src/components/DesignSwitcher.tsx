import { DESIGNS, useDesign } from '../design'
import { cn } from '../lib/utils'

/** Sélecteur discret en bas à droite : 3 styles. */
export function DesignSwitcher() {
  const { design, setDesign } = useDesign()
  return (
    <div className="fixed right-4 bottom-4 z-[45] flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
      <span className="hidden px-2 text-[11px] font-medium text-slate-400 sm:inline">Style</span>
      {DESIGNS.map((d) => {
        const active = d.id === design.id
        return (
          <button
            key={d.id}
            onClick={() => setDesign(d.id)}
            title={`${d.nom} — ${d.description}`}
            aria-pressed={active}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: `linear-gradient(135deg, ${d.swatch[0]} 50%, ${d.swatch[1]} 50%)` }} />
            <span className="hidden sm:inline">{d.nom}</span>
          </button>
        )
      })}
    </div>
  )
}
