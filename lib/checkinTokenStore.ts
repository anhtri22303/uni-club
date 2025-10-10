import { Redis } from '@upstash/redis'

type TokenRecord = {
  eventId: string
  expiresAt: number
  used?: boolean
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || ''
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ''
let redis: Redis | null = null
if (UPSTASH_URL && UPSTASH_TOKEN) {
  redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
}

// Fallback in-memory store if redis not configured (use only for local dev)
const memStore = new Map<string, TokenRecord>()

export async function createToken(token: string, eventId: string, ttlMs: number) {
  const expiresAt = Date.now() + ttlMs
  const key = `checkin:token:${token}`
  if (redis) {
    const payload = JSON.stringify({ eventId, used: 0 })
    // set key and expire (seconds)
    await redis.set(key, payload)
    await redis.expire(key, Math.ceil(ttlMs / 1000))
  } else {
    memStore.set(token, { eventId, expiresAt, used: false })
  }
}

export async function validateAndConsumeToken(token: string) {
  const key = `checkin:token:${token}`
  if (redis) {
  const raw = await redis.get(key)
  if (!raw || typeof raw !== 'string') return { valid: false, reason: 'not_found' }
  let rec: any
  try { rec = JSON.parse(raw as string) } catch { return { valid: false, reason: 'invalid' } }
    if (rec.used === 1) return { valid: false, reason: 'used' }
    // consume token by deleting key (atomic enough for our use-case)
    await redis.del(key)
    return { valid: true, eventId: rec.eventId }
  }

  // fallback mem
  const rec = memStore.get(token)
  if (!rec) return { valid: false, reason: 'not_found' }
  if (rec.used) return { valid: false, reason: 'used' }
  if (Date.now() > rec.expiresAt) return { valid: false, reason: 'expired' }
  rec.used = true
  memStore.set(token, rec)
  return { valid: true, eventId: rec.eventId }
}

export function cleanupExpired() {
  if (redis) return
  const now = Date.now()
  for (const [k, v] of memStore.entries()) if (v.expiresAt < now) memStore.delete(k)
}
