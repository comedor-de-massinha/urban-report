import api from './api'

export const profileService = {
  get: () => api.get('/me').then((r) => r.data),
  update: (data) => api.patch('/me', data).then((r) => r.data),
}
