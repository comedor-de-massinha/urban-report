import api from './api'

export const authService = {
  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),

  login: (email, password) => {
    // OAuth2PasswordRequestForm exige application/x-www-form-urlencoded
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    return api
      .post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((r) => r.data)
  },
}
