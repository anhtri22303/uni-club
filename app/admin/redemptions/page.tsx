"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { CheckCircle, Clock, Gift } from "lucide-react"

// Import data
import offers from "@/src/data/offers.json"
import redemptions from "@/src/data/redemptions.json"
import users from "@/src/data/users.json"

export default function PartnerRedemptionsPage() {
  const { vouchers } = useData()

  // For demo purposes, show redemptions for CoffeeLab
  const partnerName = "CoffeeLab"
  const partnerOffers = offers.filter((o) => o.partner === partnerName)
  const partnerOfferIds = partnerOffers.map((o) => o.id)

  // Combine historical redemptions and current vouchers
  const allRedemptions = [
    ...redemptions.filter((r) => partnerOfferIds.includes(r.offerId)),
    ...vouchers.filter((v) => partnerOfferIds.includes(v.offerId)),
  ]

  const getOfferTitle = (offerId: string) => {
    return offers.find((o) => o.id === offerId)?.title || "Unknown Offer"
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.fullName || "Unknown User"
  }

  const enhancedRedemptions = allRedemptions.map((redemption) => {
    const isUsed = redemption.used || redemption.date
    const offer = offers.find((o) => o.id === redemption.offerId)

    return {
      ...redemption,
      status: isUsed ? "used" : "active",
      offerTitle: getOfferTitle(redemption.offerId),
      userName: getUserName(redemption.userId),
      offerType: offer?.title.includes("Coffee")
        ? "Coffee"
        : offer?.title.includes("Food")
          ? "Food"
          : offer?.title.includes("Discount")
            ? "Discount"
            : "Other",
    }
  })

  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "used", label: "Used" },
        { value: "active", label: "Active" },
      ],
    },
    {
      key: "offerType",
      label: "Offer Type",
      type: "select" as const,
      options: [
        { value: "Coffee", label: "Coffee" },
        { value: "Food", label: "Food" },
        { value: "Discount", label: "Discount" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      key: "date",
      label: "Redemption Date",
      type: "date" as const,
    },
  ]

  const columns = [
    {
      key: "code" as const,
      label: "Voucher Code",
      render: (value: string) => <div className="font-mono text-sm">{value}</div>,
    },
    {
      key: "offer" as const,
      label: "Offer",
      render: (_: any, redemption: any) => (
        <div>
          <div className="font-medium">{getOfferTitle(redemption.offerId)}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Gift className="h-3 w-3" />
            {partnerName}
          </div>
        </div>
      ),
    },
    {
      key: "user" as const,
      label: "Redeemed By",
      render: (_: any, redemption: any) => <div className="font-medium">{getUserName(redemption.userId)}</div>,
    },
    {
      key: "status" as const,
      label: "Status",
      render: (_: any, redemption: any) => {
        const isUsed = redemption.used || redemption.date // Historical redemptions have date
        return (
          <Badge variant={isUsed ? "default" : "secondary"}>
            {isUsed ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Used
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Active
              </>
            )}
          </Badge>
        )
      },
    },
    {
      key: "date" as const,
      label: "Date",
      render: (_: any, redemption: any) => {
        const date = redemption.date || redemption.redeemedAt
        return date ? new Date(date).toLocaleDateString() : "Recently"
      },
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Redemptions</h1>
            <p className="text-muted-foreground">View all {partnerName} voucher redemptions</p>
          </div>

          <DataTable
            title="All Redemptions"
            data={enhancedRedemptions}
            columns={columns}
            searchKey="code"
            searchPlaceholder="Search by voucher code..."
            filters={filters}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
