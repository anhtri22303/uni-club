"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function InvalidQrPage() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="max-w-md mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">QR Code Invalid or Expired</h1>
        <p className="mb-6 text-muted-foreground">The QR code you scanned is no longer valid. Please ask the event organizer to generate a new one or refresh the QR on the event page.</p>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/club-leader/events')}>Back to Events</Button>
        </div>
      </div>
    </AppShell>
  )
}
