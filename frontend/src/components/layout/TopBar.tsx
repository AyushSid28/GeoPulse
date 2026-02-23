import { Link, useLocation } from 'react-router-dom'
import { Train, Search, Bell } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Home', icon: Train },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

export default function TopBar() {
  const { pathname } = useLocation()

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Train className="w-6 h-6" />
          GeoPulse
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                pathname === to ? 'text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
