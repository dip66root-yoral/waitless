import { describe, it, expect, beforeEach } from 'vitest'
import { queuesAPI, tokensAPI } from './client.js'

describe('Mock Backend (client.js)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('initializes default queues in localStorage', async () => {
    const res = await queuesAPI.list()
    expect(res.data).toBeDefined()
    expect(res.data.length).toBeGreaterThan(0)
    expect(res.data[0].service_name).toBeDefined()
  })

  it('can create a token', async () => {
    // Need to initialize queues first
    await queuesAPI.list()
    
    // Hardcoded queue ID from our default seed
    const qid = 'queue-movies-001' 
    const res = await tokensAPI.create({
      queue_id: qid,
      user_name: 'Test User',
      request_text: 'Test request'
    })
    
    expect(res.data).toBeDefined()
    expect(res.data.user_name).toBe('Test User')
    expect(res.data.status).toBe('waiting')
    expect(res.data.token_number).toContain('C-001')
  })
})
