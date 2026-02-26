import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import FloatingAIButton from '../ai/FloatingAIButton'
import AIDrawer from '../ai/AIDrawer'
import OfflineBanner from '../shared/OfflineBanner'
import useOnlineStatus from '../../hooks/useOnlineStatus'

export default function Layout() {
  const [aiOpen, setAiOpen] = useState(false)
  const online = useOnlineStatus()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!online && <OfflineBanner />}
      <TopBar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <FloatingAIButton onClick={() => setAiOpen(true)} />
      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
