import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Sparkles, Bell } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/search?ai=1', label: 'AI', icon: Sparkles },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to.split('?')[0]) && to !== '/'
          const isAI = label === 'AI'

          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                isAI
                  ? 'text-ai'
                  : isActive
                    ? 'text-primary-light'
                    : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
