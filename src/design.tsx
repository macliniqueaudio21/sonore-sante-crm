import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/** 3 styles de design, tous sur la même structure épurée (sidebar + zone blanche). */
export type DesignId = 'emerald' | 'forest' | 'pastel'

export interface DesignDef {
  id: DesignId
  nom: string
  description: string
  /** Aperçu du sélecteur : [sidebar, accent] */
  swatch: [string, string]
  chart: { ca: string; leads: string; grid: string; axis: string; cursor: string; fill: number }
}

const CHART = { ca: '#10B981', leads: '#CBD5E1', grid: '#F1F5F9', axis: '#94A3B8', cursor: '#D1FAE5', fill: 0.35 }

export const DESIGNS: DesignDef[] = [
  { id: 'emerald', nom: 'Émeraude Clair', description: 'Sidebar blanche, rappels de vert émeraude', swatch: ['#FFFFFF', '#059669'], chart: CHART },
  { id: 'forest', nom: 'Forêt & Blanc', description: 'Sidebar vert forêt profond, zone blanche aérée', swatch: ['#062E22', '#10B981'], chart: CHART },
  { id: 'pastel', nom: 'Plateaux Pastel', description: 'Colonnes Kanban et KPI teintés tout en douceur', swatch: ['#FFFFFF', '#FDE68A'], chart: CHART },
]

const KEY = 'sonore-style'
function readStored(): DesignId {
  try {
    const v = localStorage.getItem(KEY)
    if (v && DESIGNS.some((d) => d.id === v)) return v as DesignId
  } catch {
    /* stockage indisponible */
  }
  return 'emerald'
}

const Ctx = createContext<{ design: DesignDef; setDesign: (id: DesignId) => void } | null>(null)

export function DesignProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<DesignId>(readStored)
  useEffect(() => {
    document.documentElement.dataset.design = id
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }, [id])
  return <Ctx.Provider value={{ design: DESIGNS.find((d) => d.id === id)!, setDesign: setId }}>{children}</Ctx.Provider>
}

export function useDesign() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDesign must be used inside DesignProvider')
  return v
}
