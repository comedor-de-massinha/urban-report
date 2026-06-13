import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { occurrencesService } from '../services/occurrences'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import { MapPin, Filter, X } from 'lucide-react'

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORY_COLORS = { animal: '#f97316', dengue: '#ef4444', urban: '#8b5cf6' }

function createIcon(category) {
  const color = CATEGORY_COLORS[category] || '#3b82f6'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  })
}

// Componente que gerencia clusters fora do React-Leaflet
function ClusterLayer({ occurrences, onSelect }) {
  const map = useMap()
  const clusterRef = useRef(null)

  useEffect(() => {
    if (clusterRef.current) {
      clusterRef.current.clearLayers()
      map.removeLayer(clusterRef.current)
    }

    const cluster = L.markerClusterGroup({ maxClusterRadius: 60 })

    occurrences.forEach((occ) => {
      const marker = L.marker([occ.latitude, occ.longitude], { icon: createIcon(occ.category) })
      marker.on('click', () => onSelect(occ))
      marker.bindTooltip(occ.title, { direction: 'top', offset: [0, -30] })
      cluster.addLayer(marker)
    })

    map.addLayer(cluster)
    clusterRef.current = cluster

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current)
      }
    }
  }, [occurrences, map, onSelect])

  return null
}

export default function MapPage() {
  const [occurrences, setOccurrences] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ category: '', status: '' })
  const [showFilters, setShowFilters] = useState(false)

  const fetchOccurrences = async () => {
    setLoading(true)
    try {
      const params = { page_size: 500 }
      if (filters.category) params.category = filters.category
      if (filters.status) params.status = filters.status
      const data = await occurrencesService.list(params)
      setOccurrences(data.items)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOccurrences() }, [filters])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap z-10">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span>Mapa de Ocorrências</span>
          {!loading && (
            <span className="text-sm text-gray-400">({occurrences.length} exibidos)</span>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>

        {showFilters && (
          <div className="w-full flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Todas as categorias</option>
              <option value="animal">Animal Perdido</option>
              <option value="dengue">Dengue</option>
              <option value="urban">Prob. Urbano</option>
            </select>

            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="resolved">Resolvido</option>
              <option value="rejected">Rejeitado</option>
            </select>

            {(filters.category || filters.status) && (
              <button
                onClick={() => setFilters({ category: '', status: '' })}
                className="flex items-center gap-1 text-sm text-red-500 hover:underline"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="absolute bottom-8 left-4 z-[1000] bg-white rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            <span className="capitalize text-gray-600">
              {cat === 'animal' ? 'Animal Perdido' : cat === 'dengue' ? 'Dengue' : 'Prob. Urbano'}
            </span>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-[999] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        <MapContainer center={[-22.1256, -51.3889]} zoom={13} className="h-full w-full" zoomControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClusterLayer occurrences={occurrences} onSelect={setSelected} />
        </MapContainer>
      </div>

      {/* Painel de detalhes */}
      {selected && (
        <div className="absolute top-24 right-4 z-[1000] w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-gray-800 text-sm truncate">{selected.title}</span>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={selected.category} />
              <StatusBadge status={selected.status} />
            </div>
            <p className="text-sm text-gray-600">{selected.description}</p>
            {selected.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {selected.address}
              </p>
            )}
            {selected.images?.length > 0 && (
              <img
                src={selected.images[0].url}
                alt="Ocorrencia"
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
            <p className="text-xs text-gray-400">
              {format(new Date(selected.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            {selected.reporter_name && (
              <p className="text-xs text-gray-500">Denunciante: {selected.reporter_name}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
