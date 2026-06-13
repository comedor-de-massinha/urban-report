import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Phone, Save, Shield } from 'lucide-react'
import { profileService } from '../services/profile'
import { useAuth } from '../context/AuthContext'
import { formatPhone, handlePhoneChange } from '../hooks/usePhoneMask'

export default function ProfilePage() {
  const { user, login, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm()

  useEffect(() => {
    profileService
      .get()
      .then((data) => {
        setValue('name', data.name)
        setValue('phone', data.phone ? formatPhone(data.phone) : '')
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [setValue])

  const onSubmit = async (formData) => {
    setLoading(true)
    try {
      const updated = await profileService.update({
        name: formData.name,
        phone: formData.phone || null,
      })
      // Atualiza o contexto de auth com o novo nome
      login(token, { ...user, name: updated.name, phone: updated.phone })
      toast.success('Perfil atualizado!')
    } catch {
      // tratado pelo interceptor
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
          <p className="text-sm text-gray-500">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Badge de perfil */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Shield className="w-3 h-3" />
              {user?.role === 'admin' ? 'Administrador' : 'Cidadão'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo *
            </label>
            <input
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
              {...register('name', {
                required: 'Nome obrigatorio.',
                minLength: { value: 2, message: 'Minimo 2 caracteres.' },
                maxLength: { value: 100, message: 'Maximo 100 caracteres.' },
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email (somente leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail <span className="text-gray-400 font-normal">(não editável)</span>
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Telefone com máscara */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('phone')}
                onChange={handlePhoneChange((v) => setValue('phone', v, { shouldDirty: true }))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isDirty}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
