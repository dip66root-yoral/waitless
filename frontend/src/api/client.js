/**
 * WAITLESS - Real API Client
 * Connects to the Node.js backend via Axios (REST) and Socket.io (real-time).
 * Response shape is normalized so callers always receive { data: ... }.
 */
import axios from 'axios'
import { io } from 'socket.io-client'

const BASE_URL = import.meta.env.VITE_API_URL || ''

/* ─── Axios instance ──────────────────────────────────────────────────────── */
const api = axios.create({ baseURL: BASE_URL })

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  // Use Clerk token if available
  if (window.Clerk && window.Clerk.session) {
    const token = await window.Clerk.session.getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  } else {
    // Fallback to legacy waitless token just in case
    const token = localStorage.getItem('waitless_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize: backend wraps everything in { success, data }.
// We unwrap so callers always get { data: <actual payload> }
api.interceptors.response.use(
  (res) => {
    // If the backend returned { success: true, data: ... }, unwrap it
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return { ...res, data: res.data.data }
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
      localStorage.removeItem('waitless_token')
      localStorage.removeItem('waitless_user')
      window.location.href = '/login'
    }
    // Surface the backend error message to callers
    const message = err.response?.data?.error || err.message || 'Request failed'
    return Promise.reject({ error: message, status: err.response?.status })
  }
)

/* ─── Socket.io ───────────────────────────────────────────────────────────── */
let socketInstance = null

/**
 * Get (or create) the singleton Socket.io connection.
 * @returns {import('socket.io-client').Socket}
 */
export function getSocket() {
  if (!socketInstance) {
    // Connect to backend API URL (or localhost in dev) for WebSocket
    const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001'
    socketInstance = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socketInstance
}

/* ─── Auth API ────────────────────────────────────────────────────────────── */
export const authAPI = {
  /** Register a new user. */
  register: (data) => api.post('/api/auth/register', data),
  /** Login with email/phone + password. */
  login: (data) => api.post('/api/auth/login', data),
  /** Fetch currently authenticated user. */
  me: () => api.get('/api/auth/me'),
  /** Fetch all registered users (admin only). */
  users: () => api.get('/api/auth/users'),
  /** Update user active status (admin only). */
  updateUserStatus: (id, isActive) => api.patch(`/api/auth/users/${id}/status`, { isActive }),
  /** Fetch support tickets. */
  getSupportTickets: () => api.get('/api/auth/support-tickets'),
  /** Resolve a support ticket. */
  resolveSupportTicket: (id) => api.patch(`/api/auth/support-tickets/${id}/resolve`),
}

/* ─── Queues API ──────────────────────────────────────────────────────────── */
export const queuesAPI = {
  /** List all active queues with live stats. */
  list: () => api.get('/api/queues'),
  /** Get a single queue + its tokens. */
  get: (id) => api.get(`/api/queues/${id}`),
  /** Create a new queue. */
  create: (data) => api.post('/api/queues', data),
  /** Update queue status (active / paused / closed). */
  updateStatus: (id, status) => api.patch(`/api/queues/${id}/status`, { status }),
}

/* ─── Tokens API ──────────────────────────────────────────────────────────── */
export const tokensAPI = {
  /** Create a new booking token. */
  create: (data) => api.post('/api/tokens', data),
  /** Get a single token (returns { token, queue, peopleAhead }). */
  get: (id) => api.get(`/api/tokens/${id}`),
  /** Get all tokens + stats for a queue (returns { tokens, stats }). */
  getByQueue: (queueId) => api.get(`/api/tokens/queue/${queueId}`),
  /** Call the next waiting token. */
  callNext: (queueId) => api.post(`/api/tokens/queue/${queueId}/next`),
  /** Skip the current in-progress token. */
  skip: (queueId) => api.post(`/api/tokens/queue/${queueId}/skip`),
  /** Update a token's status directly. */
  updateStatus: (id, status) => api.patch(`/api/tokens/${id}/status`, { status }),
}

/* ─── Gemini AI API ───────────────────────────────────────────────────────── */
export const geminiAPI = {
  /**
   * Parse a natural-language request using Gemini AI.
   * @param {string} text
   */
  parse: (text) => api.post('/api/gemini/parse', { text }),
}
