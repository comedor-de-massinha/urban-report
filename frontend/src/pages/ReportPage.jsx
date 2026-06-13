import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { PawPrint, Bug, Hammer, MapPin, Upload, CheckCircle, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { occurrencesService } from '../services/occurrences'

// Fix ícone padrão do Leaflet com Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORIES = [
  { id: 'animal', label: 'Animal Perdido', icon: <PawPrint className="w-6 h-6" />, color: 'orange' },
  { id: 'dengue', label: 'Foco de Dengue', icon: <Bug className="w-6 h-6" />, color: 'red' },
  { id: 'urban', label: 'Problema Urbano', icon: <Hammer className="w-6 h-6" />, color: 'purple' },
]

const COLOR_MAP = {
  orange: 'border-orange-400 bg-orange-50 text-orange-700',
  red: 'border-red-400 bg-red-50 text-red-700',
  purple: 'border-purple-400 bg-purple-50 text-purple-700',
}

// Componente para captura de clique no mapa
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function ReportPage() {
  const [category, setCategory] = useState(null)
  const [position, setPosition] = useState(null)
  const [loadingGps, setLoadingGps] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdId, setCreatedId] = useState(null)
  const fileInputRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const handleGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo navegador.')
      return
    }
    setLoadingGps(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        setLoadingGps(false)
        toast.success('Localização obtida!')
      },
      () => {
        setLoadingGps(false)
        toast.error('Não foi possível obter a localização. Clique no mapa manualmente.')
      },
    )
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5 MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const buildPayload = (formData) => {
    const base = {
      title: formData.title,
      description: formData.description,
      latitude: position.lat,
      longitude: position.lng,
      address: formData.address || undefined,
      reporter_name: formData.reporter_name || undefined,
      reporter_email: formData.reporter_email || undefined,
      reporter_phone: formData.reporter_phone || undefined,
    }

    if (category === 'animal') {
      return {
        ...base,
        animal_data: {
          animal_type: formData.animal_type,
          breed: formData.breed || undefined,
          color: formData.color || undefined,
          approximate_age: formData.approximate_age || undefined,
          has_collar: formData.has_collar === 'true',
          collar_details: formData.collar_details || undefined,
          last_seen_date: formData.last_seen_date || undefined,
        },
      }
    }
    if (category === 'dengue') {
      return {
        ...base,
        dengue_data: {
          focus_type: formData.focus_type,
          property_type: formData.property_type || undefined,
          is_accessible: formData.is_accessible !== 'false',
        },
      }
    }
    return {
      ...base,
      urban_data: {
        problem_type: formData.problem_type,
        severity: formData.severity ? Number(formData.severity) : undefined,
        affects_traffic: formData.affects_traffic === 'true',
      },
    }
  }

  const onSubmit = async (formData) => {
    if (!position) {
      toast.error('Selecione a localização no mapa ou use o GPS.')
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload(formData)
      let created

      if (category === 'animal') created = await occurrencesService.createAnimal(payload)
      else if (category === 'dengue') created = await occurrencesService.createDengue(payload)
      else created = await occurrencesService.createUrban(payload)

      if (imageFile) {
        try {
          await occurrencesService.uploadImage(created.id, imageFile)
        } catch {
          toast('Ocorrência criada, mas houve erro no upload da imagem.', { icon: '⚠️' })
        }
      }

      setCreatedId(created.id)
      setSuccess(true)
      reset()
      setPosition(null)
      setImageFile(null)
      setImagePreview(null)
    } catch {
      // Tratado pelo interceptor
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 px-4 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ocorrência registrada!</h2>
        <p className="text-gray-600 mb-2">Sua denúncia foi enviada com sucesso.</p>
        <p className="text-sm text-gray-400 mb-8 font-mono">ID: {createdId}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setCategory(null) }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nova denúncia
          </button>
          <Link
            to="/my-occurrences"
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" /> Ver minhas ocorrencias
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Registrar Ocorrência</h1>
      <p className="text-gray-500 mb-8">Selecione a categoria e preencha as informações.</p>

      {/* Seleção de categoria */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              category === cat.id
                ? COLOR_MAP[cat.color]
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {cat.icon}
            <span className="text-sm font-medium text-center">{cat.label}</span>
          </button>
        ))}
      </div>

      {category && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Título e descrição */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">Informações gerais</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Ex: Cachorro perdido no bairro Centro"
                {...register('title', { required: 'Título obrigatório.', minLength: { value: 5, message: 'Mínimo 5 caracteres.' }, maxLength: { value: 120, message: 'Máximo 120 caracteres.' } })}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição * (10–1000 caracteres)</label>
              <textarea
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Descreva a situação com o máximo de detalhes possível..."
                {...register('description', { required: 'Descrição obrigatória.', minLength: { value: 10, message: 'Mínimo 10 caracteres.' }, maxLength: { value: 1000, message: 'Máximo 1000 caracteres.' } })}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>

          {/* Campos específicos por categoria */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">Detalhes da ocorrência</h2>

            {/* Animal */}
            {category === 'animal' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de animal *</label>
                    <select
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.animal_type ? 'border-red-400' : 'border-gray-300'}`}
                      {...register('animal_type', { required: 'Selecione o tipo.' })}
                    >
                      <option value="">Selecione</option>
                      <option value="dog">Cachorro</option>
                      <option value="cat">Gato</option>
                      <option value="bird">Pássaro</option>
                      <option value="other">Outro</option>
                    </select>
                    {errors.animal_type && <p className="text-red-500 text-xs mt-1">{errors.animal_type.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
                    <input className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('breed')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('color')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idade aproximada</label>
                    <input placeholder="Ex: 2 anos" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('approximate_age')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tem coleira?</label>
                    <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('has_collar')}>
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Última vez visto</label>
                    <input type="date" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('last_seen_date')} />
                  </div>
                </div>
              </>
            )}

            {/* Dengue */}
            {category === 'dengue' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de foco *</label>
                    <select
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.focus_type ? 'border-red-400' : 'border-gray-300'}`}
                      {...register('focus_type', { required: 'Selecione o tipo de foco.' })}
                    >
                      <option value="">Selecione</option>
                      <option value="standing_water">Água parada</option>
                      <option value="tire">Pneu</option>
                      <option value="container">Recipiente</option>
                      <option value="construction">Construção</option>
                      <option value="other">Outro</option>
                    </select>
                    {errors.focus_type && <p className="text-red-500 text-xs mt-1">{errors.focus_type.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de imóvel</label>
                    <input placeholder="Ex: Residencial, Terreno baldio" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('property_type')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">O local é acessível?</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('is_accessible')}>
                    <option value="true">Sim</option>
                    <option value="false">Não (portão fechado, etc.)</option>
                  </select>
                </div>
              </>
            )}

            {/* Urban */}
            {category === 'urban' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de problema *</label>
                    <select
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.problem_type ? 'border-red-400' : 'border-gray-300'}`}
                      {...register('problem_type', { required: 'Selecione o tipo.' })}
                    >
                      <option value="">Selecione</option>
                      <option value="pothole">Buraco na via</option>
                      <option value="broken_street_light">Iluminação danificada</option>
                      <option value="garbage">Lixo/entulho</option>
                      <option value="flooding">Alagamento</option>
                      <option value="broken_sidewalk">Calçada danificada</option>
                      <option value="graffiti">Pichação</option>
                      <option value="illegal_dumping">Descarte irregular</option>
                      <option value="other">Outro</option>
                    </select>
                    {errors.problem_type && <p className="text-red-500 text-xs mt-1">{errors.problem_type.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gravidade (1–5)</label>
                    <input type="number" min={1} max={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('severity', { min: 1, max: 5 })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Afeta o trânsito?</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('affects_traffic')}>
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Localização */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">Localização *</h2>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleGps}
                disabled={loadingGps}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {loadingGps ? 'Obtendo GPS...' : 'Usar minha localização'}
              </button>
              <span className="text-sm text-gray-500 self-center">ou clique no mapa abaixo</span>
            </div>

            {position && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                📍 Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
              </p>
            )}

            <div className="h-56 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={position || [-22.1256, -51.3889]}
                zoom={position ? 15 : 13}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={(lat, lng) => setPosition({ lat, lng })} />
                {position && <Marker position={[position.lat, position.lng]} />}
              </MapContainer>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (opcional)</label>
              <input placeholder="Ex: Rua das Flores, 100, Centro" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('address')} />
            </div>
          </div>

          {/* Dados do denunciante */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">Seus dados (opcional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('reporter_name', { maxLength: { value: 100, message: 'Máximo 100 caracteres.' } })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('reporter_email')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="tel" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('reporter_phone')} />
              </div>
            </div>
          </div>

          {/* Upload de imagem */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 text-lg mb-4">Foto (opcional)</h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Clique para selecionar uma imagem</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP — máx. 5 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            {imageFile && (
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} className="mt-2 text-xs text-red-500 hover:underline">
                Remover imagem
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !position}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors shadow-lg"
          >
            {loading ? 'Enviando...' : 'Registrar ocorrência'}
          </button>
        </form>
      )}
    </div>
  )
}
