"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { useRouter } from "next/navigation"

export default function MemberHistoryPage() {
  const router = useRouter()

  return (
    <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-muted-foreground">Your past participation and rewards</p>
          <div className="mt-4">
            <button onClick={() => (window.location.href = "/member/clubs")}>Browse Clubs</button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
