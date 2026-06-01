import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
})

// Interceptor: token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amvet_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: manejo de errores globales
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('amvet_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api