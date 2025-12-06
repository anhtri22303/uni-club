"use client"

import { useState, useEffect } from "react"
import { X, Users, Clock, CheckCircle2, XCircle, UserCheck } from "lucide-react"
import { getEventRegistrations, EventRegistrationDetail } from "@/service/eventApi"
import { useToast } from "@/hooks/use-toast"

interface RegistrationListModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: number
  eventName?: string
}

export default function RegistrationListModal({
  isOpen,
  onClose,
  eventId,
  eventName,
}: RegistrationListModalProps) {
  const [registrations, setRegistrations] = useState<EventRegistrationDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations()
    }
  }, [isOpen, eventId])

  const fetchRegistrations = async () => {
    setIsLoading(true)
    try {
      const data = await getEventRegistrations(eventId)
      setRegistrations(data)
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to load registration list",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      CHECKED_IN: {
        label: "Checked In",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      },
      CONFIRMED: {
        label: "Confirmed",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      },
      REGISTERED: {
        label: "Registered",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      },
      CANCELLED: {
        label: "Cancelled",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      },
      REFUNDED: {
        label: "Refunded",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      },
    }

    const badge = badges[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    }
    
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Registration List
              </h2>
              {eventName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {eventName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <UserCheck className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No registrations yet</p>
              <p className="text-sm">Registration data will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">
                    Total Registrations: {registrations.length}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-800">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Full Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Registered At
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Committed Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration, index) => (
                      <tr
                        key={registration.userId}
                        className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                              {registration.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {registration.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {registration.email}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(registration.status)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDateTime(registration.registeredAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                            <span>{registration.committedPoints}</span>
                            <span className="text-xs">pts</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
