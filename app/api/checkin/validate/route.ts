import { NextResponse } from 'next/server'
import { validateAndConsumeToken } from '@/lib/checkinTokenStore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = String(body.token || '')
    if (!token) return NextResponse.json({ success: false, reason: 'missing' }, { status: 400 })

    const res = await validateAndConsumeToken(token)
    if (!res.valid) return NextResponse.json({ success: false, reason: res.reason }, { status: 400 })

    return NextResponse.json({ success: true, eventId: res.eventId })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'internal' }, { status: 500 })
  }
}
