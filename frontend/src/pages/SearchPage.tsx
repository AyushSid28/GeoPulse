import { Search } from 'lucide-react'

export default function SearchPage() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Search Trains</h1>
      <div className="flex items-center gap-2 bg-surface rounded-xl border border-border px-4 py-3 shadow-sm">
        <Search className="w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Train number or name..."
          className="flex-1 bg-transparent focus:outline-none"
        />
      </div>
      <p className="text-text-secondary text-sm mt-6 text-center">Search results will appear here.</p>
    </div>
  )
}
