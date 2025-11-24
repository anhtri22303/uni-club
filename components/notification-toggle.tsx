"use client"

import { Bell, BellOff } from "lucide-react"
import { useNotifications } from "@/contexts/notification-context"
import { Button } from "@/components/ui/button"

export function NotificationToggle() {
  const { enabled, toggleNotifications } = useNotifications()

  return (
    <Button variant="ghost" size="icon" onClick={toggleNotifications}>
      <Bell className={`h-[1.2rem] w-[1.2rem] transition-all ${enabled ? 'scale-100' : 'scale-0 absolute'}`} />
      <BellOff className={`h-[1.2rem] w-[1.2rem] transition-all ${enabled ? 'scale-0 absolute' : 'scale-100'}`} />
      <span className="sr-only">Toggle notifications</span>
    </Button>
  )
}
