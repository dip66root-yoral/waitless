import axios from 'axios'
import { io } from 'socket.io-client'

// In production: set VITE_API_URL to your backend (e.g. https://waitless-backend.onrender.com)
// In dev: falls back to /api (proxied by Vite)
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
const SOCKET_URL = import.meta.env.VITE_API_URL || '/'

// Axios API client
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.response.use(
  res => res.data,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err.response?.data || { error: err.message })
  }
)

// Socket.io client (singleton)
let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id)
    })

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message)
    })
  }
  return socketInstance
}

// API helpers
export const queuesAPI = {
  list: () => api.get('/queues'),
  get: (id) => api.get(`/queues/${id}`),
  create: (data) => api.post('/queues', data),
  updateStatus: (id, status) => api.patch(`/queues/${id}/status`, { status }),
}

export const tokensAPI = {
  get: (id) => api.get(`/tokens/${id}`),
  getByQueue: (queueId) => api.get(`/tokens/queue/${queueId}`),
  create: (data) => api.post('/tokens', data),
  updateStatus: (id, status) => api.patch(`/tokens/${id}/status`, { status }),
  callNext: (queueId) => api.post(`/tokens/queue/${queueId}/next`),
  skip: (queueId) => api.post(`/tokens/queue/${queueId}/skip`),
}

export const geminiAPI = {
  parse: (text) => api.post('/gemini/parse', { text }),
}
