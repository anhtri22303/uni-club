"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Wallet, Copy, CheckCircle, Clock, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Removed static `src/data` import — use empty fallback. Replace with API/context later if needed.
const offers: any[] = []

export function WalletHistory() {
  const { auth } = useAuth()
  const { vouchers, removeVoucher } = useData()
  const { toast } = useToast()

  const userVouchers = vouchers?.filter((v) => v.userId === auth?.userId) || []

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedVouchers,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: userVouchers,
    initialPageSize: 6,
  })

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code Copied",
      description: "Voucher code copied to clipboard",
    })
  }

  const deleteVoucher = (voucherCode: string) => {
    removeVoucher(voucherCode)
    toast({
      title: "Voucher Deleted",
      description: "Voucher has been removed from your wallet",
    })
    // Optional: sau khi xóa, nếu trang hiện tại bị "trống" thì lùi về trang trước
    setTimeout(() => {
      if (totalItems - 1 <= (currentPage - 1) * pageSize && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    }, 0)
  }

  const getOfferDetails = (offerId: string) => {
    return offers.find((o) => o.id === offerId)
  }

  if (userVouchers.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No vouchers yet"
        description="Redeem offers to get voucher codes you can use at partner stores"
        action={{
          label: "Browse Offers",
          onClick: () => (window.location.href = "/member/offers"),
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedVouchers.map((voucher) => {
          const offer = getOfferDetails(voucher.offerId)

          return (
            <Card key={voucher.code} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{offer?.title}</CardTitle>
                    <CardDescription>{offer?.partner}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={voucher.used ? "secondary" : "default"}>
                      {voucher.used ? (
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
                    <Button
                      aria-label="Delete voucher"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteVoucher(voucher.code)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Voucher Code</div>
                    <div className="font-mono text-lg font-bold">{voucher.code}</div>
                  </div>

                  {voucher.redeemedAt && (
                    <div className="text-xs text-muted-foreground">
                      Redeemed: {new Date(voucher.redeemedAt).toLocaleDateString()}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => copyVoucherCode(voucher.code)}
                    disabled={voucher.used}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Luôn render Pagination; component sẽ tự ẩn nếu totalPages <= 1 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1) // reset về trang 1 khi đổi số dòng/trang
        }}
        pageSizeOptions={[6, 12, 24, 48]}
      />
    </div>
  )
}
