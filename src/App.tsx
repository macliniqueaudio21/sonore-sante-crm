import { useState } from 'react'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ProspectDrawer, RdvModal, RelanceModal, Toasts } from './components/Overlays'
import { Dashboard } from './views/Dashboard'
import { Kanban } from './views/Kanban'
import { Relance } from './views/Relance'
import { Parcours } from './views/Parcours'
import { AllProspects } from './views/AllProspects'
import { Facturation, Support } from './views/Secondary'

export default function App() {
  const { state } = useStore()
  const [mobileNav, setMobileNav] = useState(false)
  const onMenu = () => setMobileNav(true)

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
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      <main className="min-w-0 flex-1">
        {/* key : remonte la vue à chaque changement de centre pour réinitialiser pagination et onglets */}
        <div key={`${state.view}-${state.branch}`} className="animate-fade-in mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <View onMenu={onMenu} />
        </div>
      </main>
      <ProspectDrawer />
      <RdvModal />
      <RelanceModal />
      <Toasts />
    </div>
  )
}
