"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { putEventStatus } from "@/service/eventApi"
import { getClubWallet } from "@/service/walletApi"
import { useToast } from "@/hooks/use-toast"

type ApproveBudgetModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: number
  hostClubId: number
  hostClubName?: string
  defaultRequestPoints?: number
  onApproved?: (approvedBudgetPoints: number) => void
}

export function ApproveBudgetModal(props: ApproveBudgetModalProps) {
  const { open, onOpenChange, eventId, hostClubId, hostClubName, defaultRequestPoints = 0, onApproved } = props
  const { toast } = useToast()

  const [balancePoints, setBalancePoints] = useState<number | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approvedPointsInput, setApprovedPointsInput] = useState<string>(() => String(defaultRequestPoints || 0))

  useEffect(() => {
    if (!open) return
    setApprovedPointsInput(String(defaultRequestPoints || 0))
    setLoadingWallet(true)
    getClubWallet(hostClubId)
      .then((w) => setBalancePoints(Number(w.balancePoints) || 0))
      .catch(() => setBalancePoints(null))
      .finally(() => setLoadingWallet(false))
  }, [open, hostClubId, defaultRequestPoints])

  const approvedPoints = useMemo(() => {
    const n = Number(approvedPointsInput)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }, [approvedPointsInput])

  const isExceedBalance = useMemo(() => {
    if (balancePoints === null) return false
    return approvedPoints > balancePoints
  }, [approvedPoints, balancePoints])

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await putEventStatus(eventId, approvedPoints)
      toast({
        title: "Approved",
        description: `Approved ${approvedPoints.toLocaleString()} pts for ${hostClubName || "club"}`
      })
      onApproved?.(approvedPoints)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Approval failed",
        description: err?.response?.data?.message || err?.message || "Could not approve budget",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Approve Event Budget</DialogTitle>
          <DialogDescription>
            Set approved points for the event. Club: {hostClubName || `#${hostClubId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            <div className="text-muted-foreground">
              Current balance
            </div>
            <div className="font-semibold">
              {loadingWallet ? "Loading..." : balancePoints !== null ? `${balancePoints.toLocaleString()} pts` : "—"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approvedPoints">Approved Budget Points</Label>
            <Input
              id="approvedPoints"
              value={approvedPointsInput}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) {
                  setApprovedPointsInput(v)
                }
              }}
              inputMode="numeric"
              placeholder="0"
            />
            {isExceedBalance && (
              <div className="text-xs text-amber-700">
                Approved points exceed the club balance.
                {" "}
                <Link
                  href={`/uni-staff/points?clubId=${hostClubId}&reason=${encodeURIComponent("More point for event burget")}`}
                  className="underline"
                >
                  Add more points
                </Link>
                {" "}for this club, then retry.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={submitting || approvedPointsInput === "" || isExceedBalance}>
              {submitting ? "Approving..." : "Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


