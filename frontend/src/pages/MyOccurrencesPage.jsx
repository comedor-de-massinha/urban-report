import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClipboardList, MapPin, ChevronLeft, ChevronRight, FilePlus } from 'lucide-react'
import { occurrencesService } from '../services/occurrences'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'

const CATEGORY_DETAIL = {
  animal: (o) => o.lost_animal ? `${o.lost_animal.animal_type === 'dog' ? 'Cachorro' : o.lost_animal.animal_type === 'cat' ? 'Gato' : o.lost_animal.animal_type === 'bird' ? 'Passaro' : 'Animal'}${o.lost_animal.breed ? ` · ${o.lost_animal.breed}` : ''}` : '',
  dengue: (o) => o.dengue_report ? ({ standing_water: 'Agua parada', tire: 'Pneu', container: 'Recipiente', construction: 'Construcao', other: 'Outro' }[o.dengue_report.focus_type] || '') : '',
  urban: (o) => o.urban_problem ? ({ pothole: 'Buraco', broken_street_light: 'Iluminacao', garbage: 'Lixo', flooding: 'Alagamento', broken_sidewalk: 'Calcada', graffiti: 'Pichacao', illegal_dumping: 'Descarte', other: 'Outro' }[o.urban_problem.problem_type] || '') : '',
}

const PAGE_SIZE = 10

export default function MyOccurrencesPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    occurrencesService
      .myOccurrences({ page, page_size: PAGE_SIZE })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Minhas Ocorrencias</h1>
            {data && (
              <p className="text-sm text-gray-500">{data.total} registro{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FilePlus className="w-4 h-4" /> Nova ocorrencia
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma ocorrencia ainda</h2>
          <p className="text-gray-400 text-sm mb-6">Voce ainda nao registrou nenhuma ocorrencia.</p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <FilePlus className="w-4 h-4" /> Registrar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((occ) => (
            <div key={occ.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                {/* Imagem thumbnail */}
                {occ.images?.length > 0 ? (
                  <img
                    src={occ.images[0].url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">
                    {occ.category === 'animal' ? '🐾' : occ.category === 'dengue' ? '🦟' : '🏙️'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <CategoryBadge category={occ.category} />
                    <StatusBadge status={occ.status} />
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate">{occ.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{occ.description}</p>

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {occ.address && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {occ.address}
                      </span>
                    )}
                    {CATEGORY_DETAIL[occ.category]?.(occ) && (
                      <span className="text-xs text-gray-400">
                        {CATEGORY_DETAIL[occ.category](occ)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {format(new Date(occ.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  {occ.admin_notes && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                      <span className="font-medium">Nota da prefeitura:</span> {occ.admin_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* ID discreto no rodape */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-mono">ID: {occ.id}</p>
              </div>
            </div>
          ))}

          {/* Paginacao */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">Pagina {page} de {totalPages}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
