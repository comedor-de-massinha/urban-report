import { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Search, Trash2, Edit, ChevronLeft, ChevronRight,
  CheckCircle, Clock, AlertCircle, XCircle,
} from 'lucide-react'
import { occurrencesService } from '../services/occurrences'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend)

const PAGE_SIZE = 15

// ── Modal de edição ────────────────────────────────────────────────────────────
function EditModal({ occurrence, onClose, onSave }) {
  const [status, setStatus] = useState(occurrence.status)
  const [adminNotes, setAdminNotes] = useState(occurrence.admin_notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(occurrence.id, { status, admin_notes: adminNotes || undefined })
      toast.success('Ocorrência atualizada.')
      onClose()
    } catch {
      //
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg">Editar Ocorrência</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{occurrence.title}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="resolved">Resolvido</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas administrativas</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Observações internas..."
              maxLength={1000}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${colors[color] || colors.blue}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ── Dashboard principal ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [occurrences, setOccurrences] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ category: '', status: '', search: '' })
  const [editTarget, setEditTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: PAGE_SIZE }
      if (filters.category) params.category = filters.category
      if (filters.status) params.status = filters.status

      const [occData, statsData] = await Promise.all([
        occurrencesService.list(params),
        occurrencesService.getStats(),
      ])
      setOccurrences(occData.items)
      setTotal(occData.total)
      setStats(statsData)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id) => {
    try {
      await occurrencesService.delete(id)
      toast.success('Ocorrência excluída.')
      setDeleteConfirm(null)
      fetchData()
    } catch {
      //
    }
  }

  const handleUpdate = async (id, data) => {
    await occurrencesService.update(id, data)
    fetchData()
  }

  const filteredBySearch = occurrences.filter(
    (o) =>
      !filters.search ||
      o.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      o.description.toLowerCase().includes(filters.search.toLowerCase()),
  )

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Dados dos gráficos
  const categoryChart = stats
    ? {
        labels: ['Animal Perdido', 'Dengue', 'Prob. Urbano'],
        datasets: [{
          data: [
            stats.by_category.animal || 0,
            stats.by_category.dengue || 0,
            stats.by_category.urban || 0,
          ],
          backgroundColor: ['#f97316', '#ef4444', '#8b5cf6'],
          borderWidth: 0,
        }],
      }
    : null

  const statusChart = stats
    ? {
        labels: ['Pendente', 'Em andamento', 'Resolvido', 'Rejeitado'],
        datasets: [{
          label: 'Ocorrências',
          data: [
            stats.by_status.pending || 0,
            stats.by_status.in_progress || 0,
            stats.by_status.resolved || 0,
            stats.by_status.rejected || 0,
          ],
          backgroundColor: ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444'],
          borderRadius: 6,
        }],
      }
    : null

  const trendChart = stats?.trend?.length
    ? {
        labels: stats.trend.map((t) =>
          format(new Date(t.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
        ),
        datasets: [{
          label: 'Ocorrências',
          data: stats.trend.map((t) => t.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
        }],
      }
    : null

  const chartOptions = { responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Administrativo</h1>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Total de ocorrências" value={stats.total} color="blue" />
          <StatCard icon={<Clock className="w-6 h-6" />} label="Pendentes" value={stats.by_status.pending || 0} color="yellow" />
          <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Resolvidas" value={stats.by_status.resolved || 0} color="green" />
          <StatCard icon={<XCircle className="w-6 h-6" />} label="Últimos 30 dias" value={stats.recent_30_days} sub="novas ocorrências" color="red" />
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Por Categoria</h3>
            <div className="h-48">
              {categoryChart && <Doughnut data={categoryChart} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} />}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Por Status</h3>
            <div className="h-48">
              {statusChart && <Bar data={statusChart} options={chartOptions} />}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Tendência (14 dias)</h3>
            <div className="h-48">
              {trendChart ? (
                <Line data={trendChart} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">Sem dados</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filtros da tabela */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <h3 className="font-semibold text-gray-800 mr-2">Ocorrências</h3>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="text-sm flex-1 focus:outline-none"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>

          <select
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
            value={filters.category}
            onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(1) }}
          >
            <option value="">Todas categorias</option>
            <option value="animal">Animal Perdido</option>
            <option value="dengue">Dengue</option>
            <option value="urban">Prob. Urbano</option>
          </select>

          <select
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1) }}
          >
            <option value="">Todos status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="resolved">Resolvido</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Título</th>
                <th className="px-5 py-3 text-left">Categoria</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Localização</th>
                <th className="px-5 py-3 text-left">Data</th>
                <th className="px-5 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredBySearch.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Nenhuma ocorrência encontrada.
                  </td>
                </tr>
              ) : (
                filteredBySearch.map((occ) => (
                  <tr key={occ.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 max-w-xs truncate">{occ.title}</p>
                      {occ.reporter_name && (
                        <p className="text-xs text-gray-400">{occ.reporter_name}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <CategoryBadge category={occ.category} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={occ.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                      {occ.address || `${occ.latitude.toFixed(4)}, ${occ.longitude.toFixed(4)}`}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(occ.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditTarget(occ)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(occ.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Página {page} de {totalPages} — {total} registros
            </p>
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

      {/* Modal de edição */}
      {editTarget && (
        <EditModal
          occurrence={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 text-lg mb-2">Confirmar exclusão</h3>
              <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
