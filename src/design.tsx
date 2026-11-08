import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/** 3 architectures de design : chacune change la structure ET le style. */
export type DesignId = 'clean' | 'topnav' | 'swiss'

export interface DesignDef {
  id: DesignId
  nom: string
  court: string
  description: string
  layout: 'sidebar' | 'topnav'
  chart: { ca: string; leads: string; grid: string; axis: string; cursor: string; fill: number }
}

export const DESIGNS: DesignDef[] = [
  {
    id: 'clean',
    nom: 'Épuré Blanc & Vert',
    court: 'Épuré',
    description: 'Sidebar blanche fine, accent émeraude',
    layout: 'sidebar',
    chart: { ca: '#059669', leads: '#CBD5E1', grid: '#F1F5F9', axis: '#94A3B8', cursor: '#E2E8F0', fill: 0.12 },
  },
  {
    id: 'topnav',
    nom: 'Pleine Largeur',
    court: 'Top Nav',
    description: 'Navigation en haut, contenu pleine largeur',
    layout: 'topnav',
    chart: { ca: '#047857', leads: '#D1D5DB', grid: '#F3F4F6', axis: '#9CA3AF', cursor: '#E5E7EB', fill: 0.1 },
  },
  {
    id: 'swiss',
    nom: 'Minimaliste Suisse',
    court: 'Suisse',
    description: 'Ultra-plat, bordures 1 px, typographie précise',
    layout: 'sidebar',
    chart: { ca: '#18181B', leads: '#D4D4D8', grid: '#F4F4F5', axis: '#A1A1AA', cursor: '#E4E4E7', fill: 0 },
  },
]

const KEY = 'sonore-design'
function readStored(): DesignId {
  try {
    const v = localStorage.getItem(KEY)
    if (v && DESIGNS.some((d) => d.id === v)) return v as DesignId
  } catch {
    /* stockage indisponible */
  }
  return 'clean'
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
