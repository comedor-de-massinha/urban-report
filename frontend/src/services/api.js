import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Extrai a mensagem de erro mais útil possível da resposta
function extractMessage(error) {
  const data = error.response?.data
  if (!data) return 'Erro de conexão. Verifique sua internet.'

  // FastAPI validation errors (array de erros)
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg || JSON.stringify(e)).join(' | ')
  }

  // FastAPI HTTPException com string
  if (typeof data.detail === 'string') return data.detail

  // Fallback genérico por status
  const status = error.response?.status
  if (status === 400) return 'Requisição inválida.'
  if (status === 401) return 'E-mail ou senha incorretos.'
  if (status === 403) return 'Acesso negado.'
  if (status === 404) return 'Recurso não encontrado.'
  if (status === 409) return 'Este e-mail já está cadastrado.'
  if (status === 413) return 'Arquivo muito grande.'
  if (status === 415) return 'Tipo de arquivo não permitido.'
  if (status >= 500) return 'Erro interno do servidor. Tente novamente em instantes.'

  return 'Ocorreu um erro inesperado.'
}

// Interceptor de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = extractMessage(error)

    // Redireciona para login em caso de token inválido/expirado
    // MAS se já estiver no login, apenas mostra o erro sem redirecionar
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname.includes('/login')) {
        // Estamos na tela de login — só mostra o erro, não redireciona
        toast.error(message)
      } else {
        toast.error('Sessão expirada. Faça login novamente.')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    toast.error(message)
    return Promise.reject(error)
  },
)

export default api
