import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { authService } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { handlePhoneChange } from '../hooks/usePhoneMask'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm()

  const onSubmit = async (formData) => {
    setLoading(true)
    try {
      // Cadastra e já faz login automático
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      })
      const session = await authService.login(formData.email, formData.password)
      login(session.access_token, session.user)
      toast.success(`Bem-vindo, ${session.user.name.split(' ')[0]}!`)
      navigate('/')
    } catch {
      // Tratado pelo interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <UserPlus className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">Criar conta</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                {...register('name', { required: 'Nome obrigatório.', minLength: { value: 2, message: 'Mínimo 2 caracteres.' } })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input
                type="email"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                {...register('email', { required: 'E-mail obrigatório.' })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('phone')}
                onChange={handlePhoneChange((v) => setValue('phone', v))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
              <input
                type="password"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                {...register('password', {
                  required: 'Senha obrigatória.',
                  minLength: { value: 3, message: 'Mínimo 3 caracteres.' },
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha *</label>
              <input
                type="password"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                {...register('confirmPassword', {
                  required: 'Confirme sua senha.',
                  validate: (v) => v === watch('password') || 'As senhas não coincidem.',
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
