import { BookOpen, Check, Download, FileText, Mail, MessageCircle, Phone, Zap } from 'lucide-react'
import { useStore } from '../store'
import { CENTRES, GROUP_NAME } from '../data/constants'
import { formatEur } from '../lib/utils'
import { Badge, Button, Card, PageHeader } from '../components/ui'

const INVOICES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date()
  d.setMonth(d.getMonth() - i, 1)
  return { id: `SS-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-0459`, date: d, montant: 1490 }
})

export function Facturation({ onMenu }: { onMenu: () => void }) {
  const { toast } = useStore()
  return (
    <>
      <PageHeader onMenu={onMenu} title="Facturation" subtitle={`Abonnement du groupe ${GROUP_NAME}`} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="relative overflow-hidden p-6 xl:col-span-2">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-50" />
          <div className="relative">
            <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-600/15"><Zap size={11} /> Offre Réseau</Badge>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">{formatEur(1490)}</span>
              <span className="text-sm text-slate-500">HT / mois · 4 centres</span>
            </div>
            <ul className="mt-5 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-2">
              {['Campagnes Meta gérées par Sonore Santé', 'Leads illimités, livrés en temps réel', 'CRM multi-centres & Branch Switcher', 'SMS de confirmation et de rappel RDV', 'Reporting CA & ROI par centre', 'Account manager dédié'].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={15} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => toast({ title: 'Demande envoyée', description: 'Votre account manager vous recontacte sous 24 h.', tone: 'success' })}>Ajouter un centre</Button>
              <Button onClick={() => toast({ title: 'Moyen de paiement', description: 'Disponible dans la version connectée.' })}>Modifier le moyen de paiement</Button>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-900">Centres inclus</h2>
          <ul className="mt-4 space-y-3">
            {Object.values(CENTRES).map((c) => (
              <li key={c.nom} className="text-sm">
                <div className="font-medium text-slate-800">{c.nom}</div>
                <div className="text-xs text-slate-500">{c.adresse}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-4 overflow-hidden">
        <div className="p-5 pb-3"><h2 className="text-base font-semibold text-slate-900">Factures</h2></div>
        <div className="divide-y divide-slate-50 border-t border-slate-100">
          {INVOICES.map((inv, i) => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <FileText size={16} className="text-slate-400" />
              <span className="flex-1 font-medium text-slate-800">{inv.id}</span>
              <span className="hidden text-slate-500 sm:inline">{inv.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
              <span className="w-24 text-right tabular-nums">{formatEur(inv.montant)}</span>
              <Badge className={i === 0 ? 'bg-amber-50 text-amber-700 ring-amber-600/15' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'}>{i === 0 ? 'À venir' : 'Payée'}</Badge>
              <button className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Télécharger" onClick={() => toast({ title: `Téléchargement ${inv.id}.pdf` })}>
                <Download size={15} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

export function Support({ onMenu }: { onMenu: () => void }) {
  const { toast } = useStore()
  const faq = [
    ['Quel délai pour rappeler un nouveau lead ?', 'Idéalement moins de 2 heures : au-delà, le taux de prise de RDV chute fortement. Le badge rouge sur les cartes vous alerte.'],
    ['Que signifie NRP ?', '« Ne Répond Pas ». Après NRP 2, planifiez une relance phoning ou passez le prospect en « Clôture ».'],
    ['Comment est calculé le CA ?', 'Le CA additionne le « Panier Moyen (€) » de chaque patient au statut « Facturé » (2 500 € par défaut, modifiable dans le Parcours Patient).'],
    ['Puis-je voir un seul centre ?', 'Oui, utilisez le sélecteur de centre en haut de la barre latérale : toute l’application se filtre instantanément.'],
  ]
  return (
    <>
      <PageHeader onMenu={onMenu} title="Support" subtitle="Votre équipe Sonore Santé vous répond du lundi au vendredi, 9h–18h" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: <MessageCircle size={18} />, title: 'Chat en direct', text: 'Réponse moyenne en 4 min', cls: 'bg-emerald-50 text-emerald-600' },
          { icon: <Phone size={18} />, title: '03 20 00 59 59', text: 'Ligne partenaires dédiée', cls: 'bg-indigo-50 text-indigo-600' },
          { icon: <Mail size={18} />, title: 'partenaires@sonore-sante.fr', text: 'Réponse sous 24 h', cls: 'bg-amber-50 text-amber-600' },
        ].map((c) => (
          <Card key={c.title} className="p-5">
            <button className="w-full cursor-pointer text-left" onClick={() => toast({ title: c.title, description: 'Disponible dans la version connectée.' })}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.cls}`}>{c.icon}</span>
              <div className="mt-3 font-semibold text-slate-900">{c.title}</div>
              <div className="text-sm text-slate-500">{c.text}</div>
            </button>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><BookOpen size={18} className="text-slate-400" /> Questions fréquentes</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {faq.map(([q, a]) => (
            <details key={q} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:hidden">
                <span className="mr-2 inline-block text-slate-400 transition-transform group-open:rotate-90">›</span>
                {q}
              </summary>
              <p className="mt-2 pl-5 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </Card>
    </>
  )
}
