import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Interceptor de resposta — trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (status === 403) {
      toast.error('Acesso negado.')
    } else if (status === 404) {
      toast.error('Recurso não encontrado.')
    } else if (status === 422) {
      const errors = error.response?.data?.detail
      if (Array.isArray(errors)) {
        errors.forEach((e) => toast.error(e.msg || 'Erro de validação.'))
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Dados inválidos.')
      }
    } else if (status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente.')
    }

    return Promise.reject(error)
  },
)

export default api
