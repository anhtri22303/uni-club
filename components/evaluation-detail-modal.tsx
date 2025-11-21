"use client"

import { StaffEvaluation } from "@/service/eventStaffApi"
import { Button } from "./ui/button"
import { X } from "lucide-react"

interface EvaluationDetailModalProps {
  open: boolean
  onClose: () => void
  evaluation: StaffEvaluation | null
}

export default function EvaluationDetailModal({
  open,
  onClose,
  evaluation,
}: EvaluationDetailModalProps) {
  if (!open || !evaluation) return null

  const getPerformanceBadge = (performance: string) => {
    const styles = {
      POOR: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
      AVERAGE: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
      GOOD: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
      EXCELLENT: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    }
    return styles[performance as keyof typeof styles] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  }

  const getPerformanceLabel = (performance: string) => {
    const labels = {
      POOR: "Poor",
      AVERAGE: "Average",
      GOOD: "Good",
      EXCELLENT: "Excellent",
    }
    return labels[performance as keyof typeof labels] || performance
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-110"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Evaluation Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Performance Rating */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Performance Rating
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getPerformanceBadge(
                  evaluation.performance
                )}`}
              >
                {getPerformanceLabel(evaluation.performance)}
              </span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Note
            </label>
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {evaluation.note || "No note provided"}
              </p>
            </div>
          </div>

          {/* Evaluated At */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Evaluated At
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(evaluation.createdAt).toLocaleString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Event Staff ID */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Evaluation ID
              </label>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200">#{evaluation.id}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Event Staff ID
              </label>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200">#{evaluation.eventStaffId}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
