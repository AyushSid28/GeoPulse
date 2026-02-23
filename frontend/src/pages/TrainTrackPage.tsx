import { useParams } from 'react-router-dom'

export default function TrainTrackPage() {
  const { id } = useParams()

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Train Details</h1>
      <p className="text-text-secondary">Train ID: <span className="font-mono font-medium">{id}</span></p>
      <p className="text-text-secondary text-sm mt-4">Map, live status, and schedule will load here.</p>
    </div>
  )
}
