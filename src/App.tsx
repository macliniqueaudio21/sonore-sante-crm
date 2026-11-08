import { useEffect, useState } from 'react'
import { useStore } from './store'
import { useDesign } from './design'
import { Sidebar } from './components/Navigation'
import { ProspectDrawer, RdvModal, RelanceModal, Toasts } from './components/Overlays'
import { DesignSwitcher } from './components/DesignSwitcher'
import { Dashboard } from './views/Dashboard'
import { Kanban } from './views/Kanban'
import { Relance } from './views/Relance'
import { Parcours } from './views/Parcours'
import { AllProspects } from './views/AllProspects'
import { Facturation, Support } from './views/Secondary'

export default function App() {
  const { state } = useStore()
  const { design } = useDesign()
  const [mobileNav, setMobileNav] = useState(false)
  const onMenu = () => setMobileNav(true)

  // Retour en haut de page à chaque changement de vue ou de design.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.view, design.id])

  const View = {
    dashboard: Dashboard,
    kanban: Kanban,
    relance: Relance,
    parcours: Parcours,
    prospects: AllProspects,
    facturation: Facturation,
    support: Support,
  }[state.view]

  return (
    <div className="bg-app flex min-h-screen text-slate-900">
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      <main className="min-w-0 flex-1">
        {/* key : remonte la vue à chaque changement de centre pour réinitialiser pagination et onglets */}
        <div
          key={`${state.view}-${state.branch}`}
          className="animate-fade-in mx-auto max-w-[1280px] px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-9"
        >
          <View onMenu={onMenu} />
        </div>
      </main>
      <ProspectDrawer />
      <RdvModal />
      <RelanceModal />
      <Toasts />
      <DesignSwitcher />
    </div>
  )
}
