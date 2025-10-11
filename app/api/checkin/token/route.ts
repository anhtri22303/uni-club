import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createToken } from '@/lib/checkinTokenStore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const eventId = String(body.eventId || '')
    if (!eventId) return NextResponse.json({ success: false, message: 'missing eventId' }, { status: 400 })

    const token = randomUUID()
  // TTL 60 seconds
  await createToken(token, eventId, 60 * 1000)

    return NextResponse.json({ success: true, token })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
