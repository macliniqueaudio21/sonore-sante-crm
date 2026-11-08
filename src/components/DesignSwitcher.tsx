import { PanelLeft, PanelTop, Square } from 'lucide-react'
import { DESIGNS, useDesign, type DesignId } from '../design'
import { cn } from '../lib/utils'

const ICONS: Record<DesignId, typeof PanelLeft> = { clean: PanelLeft, topnav: PanelTop, swiss: Square }

/** Sélecteur discret en bas à droite : 3 architectures de design. */
export function DesignSwitcher() {
  const { design, setDesign } = useDesign()
  return (
    <div className="flat-overlay fixed right-4 bottom-4 z-[45] flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
      <span className="hidden px-2 text-[11px] font-medium text-slate-400 sm:inline">Design</span>
      {DESIGNS.map((d) => {
        const Icon = ICONS[d.id]
        const active = d.id === design.id
        return (
          <button
            key={d.id}
            onClick={() => setDesign(d.id)}
            title={`${d.nom} — ${d.description}`}
            aria-pressed={active}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <Icon size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">{d.court}</span>
          </button>
        )
      })}
    </div>
  )
}
