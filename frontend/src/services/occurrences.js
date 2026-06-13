import api from './api'

export const occurrencesService = {
  // Minhas ocorrencias
  myOccurrences: (params = {}) =>
    api.get('/me/occurrences', { params }).then((r) => r.data),
  // Listar com filtros
  list: (params = {}) =>
    api.get('/occurrences', { params }).then((r) => r.data),

  // Buscar por ID
  getById: (id) =>
    api.get(`/occurrences/${id}`).then((r) => r.data),

  // Criar animal perdido
  createAnimal: (data) =>
    api.post('/occurrences/animal', data).then((r) => r.data),

  // Criar dengue
  createDengue: (data) =>
    api.post('/occurrences/dengue', data).then((r) => r.data),

  // Criar problema urbano
  createUrban: (data) =>
    api.post('/occurrences/urban', data).then((r) => r.data),

  // Upload de imagem
  uploadImage: (occurrenceId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post(`/occurrences/${occurrenceId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  // Atualizar (admin)
  update: (id, data) =>
    api.patch(`/occurrences/${id}`, data).then((r) => r.data),

  // Deletar (admin)
  delete: (id) =>
    api.delete(`/occurrences/${id}`),

  // Estatísticas (admin)
  getStats: () =>
    api.get('/stats').then((r) => r.data),
}
