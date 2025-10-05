"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { History, CheckCircle, Calendar, Gift } from "lucide-react"

// Import data
import offers from "@/src/data/offers.json"

export default function StaffHistoryPage() {
  const { auth } = useAuth()
  const { staffHistory } = useData()

  // Get this staff member's validation history
  const myValidations = staffHistory
    .filter((h) => h.staffUserId === auth.userId)
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedValidations,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: myValidations,
    initialPageSize: 10,
  })

  // Group validations by date
  const validationsByDate = paginatedValidations.reduce(
    (acc, validation) => {
      const date = new Date(validation.when).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(validation)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const getOfferDetails = (offerId: string) => {
    return offers.find((o) => o.id === offerId)
  }

  const getCustomerName = (validation: any) => {
    // In a real app, we'd store customer info in the validation record
    // For demo, we'll show "Customer" since we don't have direct user mapping
    return "Customer"
  }

  if (myValidations.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["staff"]}>
        <AppShell>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Validation History</h1>
              <p className="text-muted-foreground">Your voucher validation records</p>
            </div>

            <EmptyState
              icon={History}
              title="No validations yet"
              description="Your voucher validations will appear here once you start processing customer vouchers"
              action={{
                label: "Start Validating",
                onClick: () => (window.location.href = "/staff/validate"),
              }}
            />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Validation History</h1>
            <p className="text-muted-foreground">Your voucher validation records</p>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myValidations.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    myValidations.filter((v) => {
                      const validationDate = new Date(v.when)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return validationDate > weekAgo
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myValidations.filter((v) => new Date(v.when).toDateString() === new Date().toDateString()).length}
                </div>
                <p className="text-xs text-muted-foreground">Validations today</p>
              </CardContent>
            </Card>
          </div>

          {/* Validation History by Date */}
          <div className="space-y-6">
            {Object.entries(validationsByDate).map(([date, validations]) => {
              const typedValidations = validations as any[];
              return (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <CardDescription>
                      {typedValidations.length} validation{typedValidations.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {typedValidations.map((validation, index) => {
                        const offer = getOfferDetails(validation.offerId)
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium">Voucher Validated</p>
                                <p className="text-sm text-muted-foreground">
                                  Code: <span className="font-mono">{validation.code}</span>
                                </p>
                                {offer && <p className="text-sm text-muted-foreground">Offer: {offer.title}</p>}
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge variant="default">Validated</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(validation.when).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {myValidations.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
