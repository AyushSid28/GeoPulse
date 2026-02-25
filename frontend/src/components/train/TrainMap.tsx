import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, useMap, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { LiveTrainStatus } from '../../types'

import 'leaflet/dist/leaflet.css'

const trainIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #1e3a8a;
    border: 3px solid white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    box-shadow: 0 0 0 3px rgba(30,58,138,0.3), 0 2px 8px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(30,58,138,0.3), 0 2px 8px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(30,58,138,0.1), 0 2px 8px rgba(0,0,0,0.3); }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length >= 2) {
      const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]))
      map.fitBounds(bounds, { padding: [30, 30] })
    } else if (coords.length === 1) {
      map.setView(coords[0], 10)
    }
  }, [coords, map])
  return null
}

interface Props {
  routeGeometry: [number, number][] | null
  liveStatus: LiveTrainStatus | null
  stationCoords?: { code: string; name: string; lat: number; lng: number }[]
}

export default function TrainMap({ routeGeometry, liveStatus, stationCoords }: Props) {
  const routeLatLngs = useMemo(() => {
    if (!routeGeometry) return []
    return routeGeometry.map(([lng, lat]) => [lat, lng] as [number, number])
  }, [routeGeometry])

  const trainPosition = useMemo(() => {
    if (liveStatus?.position) {
      return [liveStatus.position.lat, liveStatus.position.lng] as [number, number]
    }
    return null
  }, [liveStatus])

  const allCoords = useMemo(() => {
    const pts: [number, number][] = []
    if (routeLatLngs.length > 0) pts.push(...routeLatLngs)
    else if (trainPosition) pts.push(trainPosition)
    if (stationCoords) {
      stationCoords.forEach((s) => {
        if (s.lat && s.lng) pts.push([s.lat, s.lng])
      })
    }
    return pts
  }, [routeLatLngs, trainPosition, stationCoords])

  const center: [number, number] = allCoords.length > 0 ? allCoords[0] : [22.5, 82.0]

  return (
    <div className="w-full h-[45vh] rounded-xl overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={center}
        zoom={6}
        className="w-full h-full"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allCoords.length > 0 && <FitBounds coords={allCoords} />}

        {routeLatLngs.length >= 2 && (
          <Polyline
            positions={routeLatLngs}
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
          />
        )}

        {stationCoords?.map((s) =>
          s.lat && s.lng ? (
            <CircleMarker
              key={s.code}
              center={[s.lat, s.lng]}
              radius={4}
              pathOptions={{ color: '#64748b', fillColor: '#ffffff', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="text-xs">{s.name} ({s.code})</span>
              </Tooltip>
            </CircleMarker>
          ) : null
        )}

        {trainPosition && (
          <Marker position={trainPosition} icon={trainIcon}>
            <Tooltip direction="top" offset={[0, -14]} permanent>
              <span className="text-xs font-semibold">
                {liveStatus?.current_station?.station_name || 'Train'}
              </span>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
