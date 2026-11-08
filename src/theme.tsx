import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeId = 'emerald' | 'qonto' | 'minimal' | 'dark'

export interface ThemeDef {
  id: ThemeId
  nom: string
  description: string
  /** Aperçu dans le sélecteur : [sidebar, fond, accent, carte] */
  swatch: [string, string, string, string]
  chart: { primary: string; secondary: string; grid: string; axis: string; cursor: string }
}

export const THEMES: ThemeDef[] = [
  {
    id: 'emerald',
    nom: 'Émeraude Médical',
    description: 'Sidebar Slate 900, accents émeraude',
    swatch: ['#0F172A', '#F8FAFC', '#10B981', '#FFFFFF'],
    chart: { primary: '#10B981', secondary: '#6366F1', grid: '#F1F5F9', axis: '#94A3B8', cursor: '#CBD5E1' },
  },
  {
    id: 'qonto',
    nom: 'Fintech Qonto',
    description: 'Noir carbone, indigo et violet, bordures nettes',
    swatch: ['#090D16', '#FFFFFF', '#4F46E5', '#FFFFFF'],
    chart: { primary: '#4F46E5', secondary: '#8B5CF6', grid: '#F4F4F5', axis: '#A1A1AA', cursor: '#D4D4D8' },
  },
  {
    id: 'minimal',
    nom: 'Minimaliste Clair',
    description: 'Sidebar claire, tons pastel, style Apple / Attio',
    swatch: ['#F4F4F5', '#FFFFFF', '#5AAA86', '#FFFFFF'],
    chart: { primary: '#5AAA86', secondary: '#7880D8', grid: '#F4F4F5', axis: '#A1A1AA', cursor: '#D4D4D8' },
  },
  {
    id: 'dark',
    nom: 'Dark Mode Pro',
    description: '100 % sombre, badges néon doux, style Linear',
    swatch: ['#0B101C', '#090D16', '#34D399', '#111827'],
    chart: { primary: '#34D399', secondary: '#818CF8', grid: '#1F2937', axis: '#6B7280', cursor: '#374151' },
  },
]

const STORAGE_KEY = 'sonore-theme'

function readStored(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && THEMES.some((t) => t.id === v)) return v as ThemeId
  } catch {
    /* stockage indisponible : thème par défaut */
  }
  return 'emerald'
}

const Ctx = createContext<{ theme: ThemeDef; setTheme: (id: ThemeId) => void } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ThemeId>(readStored)

  useEffect(() => {
    document.documentElement.dataset.theme = id
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [id])

  return <Ctx.Provider value={{ theme: THEMES.find((t) => t.id === id)!, setTheme: setId }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used inside ThemeProvider')
  return v
}
