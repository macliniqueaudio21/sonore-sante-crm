import { Ear, ShieldCheck, User, Users } from 'lucide-react'
import type { Prospect } from '../data/types'
import { cn } from '../lib/utils'

/** Réponses au formulaire Meta (Facebook / Instagram Lead Ads). */
export function MetaTags({ p, className }: { p: Prospect; className?: string }) {
  const cent =
    p.centPourcent === 'Oui'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
      : p.centPourcent === 'Non'
        ? 'bg-slate-50 text-slate-600 ring-slate-500/15'
        : 'bg-amber-50 text-amber-700 ring-amber-600/15'
  const tag = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset'
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      <span className={cn(tag, 'bg-indigo-50 text-indigo-700 ring-indigo-600/15')} title="Pour qui ?">
        {p.pourQui === 'Pour moi' ? <User size={11} /> : <Users size={11} />}
        {p.pourQui}
      </span>
      <span className={cn(tag, 'bg-slate-50 text-slate-700 ring-slate-500/15')} title="Situation gênante">
        <Ear size={11} />
        {p.situation}
      </span>
      <span className={cn(tag, cent)} title="Éligible 100% Santé ?">
        <ShieldCheck size={11} />
        100% Santé : {p.centPourcent}
      </span>
    </div>
  )
}

export function SourceDot({ source }: { source: Prospect['source'] }) {
  return (
    <span
      title={`Lead ${source}`}
      className={cn(
        'inline-grid h-4 w-4 place-items-center rounded-[5px] text-[9px] font-bold text-[#fff]',
        source === 'Facebook' ? 'bg-[#1877F2]' : 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
      )}
    >
      {source === 'Facebook' ? 'f' : 'ig'}
    </span>
  )
}
