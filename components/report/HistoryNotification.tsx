"use client"

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

export interface NotificationProps {
  message: string
  type?: 'info' | 'warning' | 'success' | 'error'
  duration?: number
  onClose?: () => void
}

export function HistoryNotification({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const icons = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle,
    error: AlertCircle
  }

  const colors = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
  }

  const Icon = icons[type]

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg ${colors[type]} animate-in slide-in-from-bottom-2 duration-300`}
      role="alert"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Notification Manager Hook
export function useHistoryNotification() {
  const [notification, setNotification] = useState<NotificationProps | null>(null)

  const showNotification = (props: NotificationProps) => {
    setNotification(props)
  }

  const hideNotification = () => {
    setNotification(null)
  }

  return {
    notification,
    showNotification,
    hideNotification
  }
}

