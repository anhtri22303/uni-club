"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EventWallet, EventWalletTransaction, getEventWallet } from "@/service/eventApi"
import { useState, useEffect } from "react"
import { ArrowDownCircle, ArrowUpCircle, Calendar, DollarSign, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EventWalletHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | number
}

export function EventWalletHistoryModal({ open, onOpenChange, eventId }: EventWalletHistoryModalProps) {
  const [wallet, setWallet] = useState<EventWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return

    const fetchWalletData = async () => {
      setLoading(true)
      try {
        const data = await getEventWallet(eventId)
        setWallet(data)
      } catch (error: any) {
        console.error("Failed to fetch wallet history:", error)
        toast({
          title: "Error",
          description: error?.response?.data?.message || error?.message || "Failed to load wallet history",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [open, eventId, toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (amount: number) => {
    if (amount > 0) {
      return <ArrowDownCircle className="h-5 w-5 text-green-600" />
    }
    return <ArrowUpCircle className="h-5 w-5 text-red-600" />
  }

  const getTransactionBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "TRANSFER":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Transfer</Badge>
      case "DEPOSIT":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Deposit</Badge>
      case "WITHDRAWAL":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Withdrawal</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Wallet Transaction History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading wallet history...
          </div>
        ) : wallet ? (
          <div className="space-y-6">
            {/* Wallet Summary */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Name</label>
                    <p className="text-lg font-semibold text-blue-900">{wallet.eventName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Host Club</label>
                    <p className="text-lg font-semibold text-blue-900">{wallet.hostClubName}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <label className="text-sm font-medium text-muted-foreground">Budget Points</label>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{wallet.budgetPoints}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <label className="text-sm font-medium text-muted-foreground">Balance Points</label>
                    <p className="text-2xl font-bold text-green-700 mt-1">{wallet.balancePoints}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <label className="text-sm font-medium text-muted-foreground">Owner Type</label>
                    <p className="text-lg font-semibold text-blue-900 mt-1">{wallet.ownerType}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(wallet.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction History
                </h3>
                <Badge variant="secondary" className="text-sm">
                  {wallet.transactions.length} {wallet.transactions.length === 1 ? "transaction" : "transactions"}
                </Badge>
              </div>

              {wallet.transactions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No transactions found
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {wallet.transactions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((transaction) => (
                      <Card 
                        key={transaction.id} 
                        className={`transition-all hover:shadow-md ${
                          transaction.amount > 0 
                            ? 'border-l-4 border-l-green-500 bg-green-50/30' 
                            : 'border-l-4 border-l-red-500 bg-red-50/30'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getTransactionIcon(transaction.amount)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTransactionBadge(transaction.type)}
                                  <span className="text-xs text-muted-foreground">
                                    #{transaction.id}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 break-words">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(transaction.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-xl font-bold ${
                                transaction.amount > 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </p>
                              <p className="text-xs text-muted-foreground">points</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No wallet data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

