import DOMPurify from 'dompurify'

// Mocked API Client for fully serverless Frontend deployment (using LocalStorage)

/* ─── Event Emitter (Mock Socket) ────────────────────────────────────────── */
class MockSocket {
  constructor() {
    this.events = {}
    this.id = 'mock-socket-' + Math.random().toString(36).substr(2, 9)
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = []
    this.events[event].push(listener)
  }
  off(event, listener) {
    if (!this.events[event]) return
    if (!listener) {
      this.events[event] = []
    } else {
      this.events[event] = this.events[event].filter(l => l !== listener)
    }
  }
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args))
    }
  }
}

const socketInstance = new MockSocket()
// Alias for easy global triggering of updates
export const triggerUpdate = () => socketInstance.emit('queue:updated')

export function getSocket() {
  return socketInstance
}

/* ─── LocalStorage DB Setup ────────────────────────────────────────────── */
const INITIAL_QUEUES = [
  {
    id: 'queue-movies-001',
    service_name: 'PVR Cinemas — Ticket Counter',
    description: 'Movie ticket collection, seat upgrades, F&B combos & group bookings',
    token_prefix: 'C',
    avg_service_time: 5,
    status: 'active',
  },
  {
    id: 'queue-clinic-001',
    service_name: 'City Medical Center',
    description: 'OPD consultations, diagnostics, blood tests & specialist referrals',
    token_prefix: 'M',
    avg_service_time: 15,
    status: 'active',
  },
  {
    id: 'queue-train-001',
    service_name: 'Indian Railways Booking',
    description: 'Train ticket reservations, cancellations, PNR enquiry & passes',
    token_prefix: 'T',
    avg_service_time: 12,
    status: 'active',
  },
  {
    id: 'queue-flight-001',
    service_name: 'Airport Services Counter',
    description: 'Flight booking, web check-in, baggage claim & boarding passes',
    token_prefix: 'F',
    avg_service_time: 10,
    status: 'active',
  },
]

// Initialize DB if empty
if (!localStorage.getItem('waitless_queues')) {
  localStorage.setItem('waitless_queues', JSON.stringify(INITIAL_QUEUES))
}
if (!localStorage.getItem('waitless_tokens')) {
  localStorage.setItem('waitless_tokens', JSON.stringify([]))
}

const db = {
  get: (key) => JSON.parse(localStorage.getItem(`waitless_${key}`) || '[]'),
  set: (key, data) => localStorage.setItem(`waitless_${key}`, JSON.stringify(data)),
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/* ─── Queues API ───────────────────────────────────────────────────────── */
export const queuesAPI = {
  list: async () => {
    await delay(300)
    const queues = db.get('queues')
    const tokens = db.get('tokens')
    // Calculate stats per queue
    const data = queues.map(q => {
      const qTokens = tokens.filter(t => t.queue_id === q.id)
      return {
        ...q,
        stats: {
          waiting_count: qTokens.filter(t => t.status === 'waiting').length,
          serving_count: qTokens.filter(t => t.status === 'in-progress').length,
        }
      }
    })
    return { data }
  },
  get: async (id) => {
    await delay(200)
    const q = db.get('queues').find(q => q.id === id)
    if (!q) throw { error: 'Queue not found' }
    return { data: q }
  }
}

/* ─── Tokens API ───────────────────────────────────────────────────────── */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const tokensAPI = {
  get: async (id) => {
    await delay(200)
    const token = db.get('tokens').find(t => t.id === id)
    if (!token) throw { error: 'Token not found' }
    
    // Recalculate position
    if (token.status === 'waiting') {
      const qTokens = db.get('tokens').filter(t => t.queue_id === token.queue_id && t.status === 'waiting')
      // Sort by priority then date
      qTokens.sort((a, b) => b.priority - a.priority || new Date(a.created_at) - new Date(b.created_at))
      const pos = qTokens.findIndex(t => t.id === token.id) + 1
      token.position = pos
      
      const q = db.get('queues').find(q => q.id === token.queue_id)
      token.estimated_wait_time = pos * (q?.avg_service_time || 10)
    }

    return { data: token }
  },
  
  getByQueue: async (queueId) => {
    await delay(300)
    const tokens = db.get('tokens').filter(t => t.queue_id === queueId)
    const waiting = tokens.filter(t => t.status === 'waiting')
    const serving = tokens.filter(t => t.status === 'in-progress')
    
    // Assign positions
    waiting.sort((a, b) => b.priority - a.priority || new Date(a.created_at) - new Date(b.created_at))
    waiting.forEach((t, i) => t.position = i + 1)

    return {
      data: {
        tokens,
        stats: {
          waiting: waiting.length,
          serving: serving.length,
          done: tokens.filter(t => t.status === 'done').length,
          skipped: tokens.filter(t => t.status === 'skipped').length,
        }
      }
    }
  },

  create: async (data) => {
    await delay(500)
    const q = db.get('queues').find(q => q.id === data.queue_id)
    if (!q) throw { error: 'Queue not found' }

    const tokens = db.get('tokens')
    // Generate token number (e.g. C-001)
    const qTokens = tokens.filter(t => t.queue_id === data.queue_id)
    const number = `${q.token_prefix}-${String(qTokens.length + 1).padStart(3, '0')}`

    const priorityMap = { high: 10, medium: 5, low: 1 }

    const newToken = {
      id: uuidv4(),
      queue_id: data.queue_id,
      token_number: number,
      user_name: DOMPurify.sanitize(data.user_name || 'Guest'),
      request_text: DOMPurify.sanitize(data.request_text || ''),
      service_type: data.service_type || 'General Service',
      urgency: data.urgency || 'medium',
      priority: priorityMap[data.urgency || 'medium'] || 5,
      notes: DOMPurify.sanitize(data.notes || ''),
      status: 'waiting',
      created_at: new Date().toISOString()
    }

    tokens.push(newToken)
    db.set('tokens', tokens)
    triggerUpdate()
    return { data: newToken }
  },

  updateStatus: async (id, status) => {
    await delay(300)
    const tokens = db.get('tokens')
    const idx = tokens.findIndex(t => t.id === id)
    if (idx === -1) throw { error: 'Token not found' }
    
    tokens[idx].status = status
    db.set('tokens', tokens)
    triggerUpdate()
    return { data: tokens[idx] }
  },

  callNext: async (queueId) => {
    await delay(400)
    const tokens = db.get('tokens')
    const waiting = tokens.filter(t => t.queue_id === queueId && t.status === 'waiting')
    
    if (waiting.length === 0) return { data: null }

    waiting.sort((a, b) => b.priority - a.priority || new Date(a.created_at) - new Date(b.created_at))
    const nextToken = waiting[0]
    
    const idx = tokens.findIndex(t => t.id === nextToken.id)
    tokens[idx].status = 'in-progress'
    
    db.set('tokens', tokens)
    triggerUpdate()
    return { data: tokens[idx] }
  },
}

/* ─── Gemini API (Mocked) ──────────────────────────────────────────────── */
export const geminiAPI = {
  parse: async (text) => {
    await delay(1200) // Simulate AI thinking time
    
    let urgency = 'medium'
    let service_type = 'General Inquiry'
    let notes = ''
    let queue_id = null

    const lower = text.toLowerCase()
    
    // Simple heuristic parsing
    if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('asap')) {
      urgency = 'high'
    }
    
    if (lower.includes('movie') || lower.includes('ticket') || lower.includes('cinema')) {
      queue_id = 'queue-movies-001'
      service_type = 'Ticket Booking'
    } else if (lower.includes('doctor') || lower.includes('pain') || lower.includes('hospital')) {
      queue_id = 'queue-clinic-001'
      service_type = 'Medical Consultation'
    } else if (lower.includes('train') || lower.includes('pnr')) {
      queue_id = 'queue-train-001'
      service_type = 'Railway Inquiry'
    } else if (lower.includes('flight') || lower.includes('airport')) {
      queue_id = 'queue-flight-001'
      service_type = 'Flight Services'
    }

    if (text.length > 20) {
      notes = text.substring(0, 50) + '...'
    }

    return {
      data: {
        queue_id,
        urgency,
        service_type,
        notes
      }
    }
  }
}
