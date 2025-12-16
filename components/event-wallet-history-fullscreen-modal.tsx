"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EventWallet,
  EventWalletTransaction,
  getEventWallet,
} from "@/service/eventApi";
import { useState, useEffect } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventWalletHistoryFullscreenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | number;
}

export function EventWalletHistoryFullscreenModal({
  open,
  onOpenChange,
  eventId,
}: EventWalletHistoryFullscreenModalProps) {
  const [wallet, setWallet] = useState<EventWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const data = await getEventWallet(eventId);
        setWallet(data);
      } catch (error: any) {
        console.error("Failed to fetch wallet history:", error);
        toast({
          title: "Error",
          description:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load wallet history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [open, eventId, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (amount: number, type: string) => {
    const normalizedType = type.toUpperCase().replace(/_/g, " ");
    
    // BONUS REWARD: red down arrow
    if (normalizedType === "BONUS REWARD") {
      return (
        <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
      );
    }
    
    // COMMIT LOCK: green up arrow
    if (normalizedType === "COMMIT LOCK") {
      return (
        <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
      );
    }
    
    // Other transactions: green for positive, red for negative
    if (amount > 0) {
      return (
        <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
      );
    }
    return <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-500" />;
  };

  const getTransactionBadge = (type: string) => {
    const typeUpper = type.toUpperCase().replace(/_/g, " ");
    
    const badgeConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
      "BONUS REWARD": {
        bg: "bg-red-50 dark:bg-red-950/50",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-300 dark:border-red-700",
        label: "BONUS REWARD"
      },
      "COMMIT LOCK": {
        bg: "bg-green-50 dark:bg-green-950/50",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-300 dark:border-green-700",
        label: "COMMIT LOCK"
      },
      "CLUB TO MEMBER": {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-300 dark:border-blue-700",
        label: "CLUB TO MEMBER"
      },
      "REFUND PRODUCT": {
        bg: "bg-purple-50 dark:bg-purple-950/50",
        text: "text-purple-700 dark:text-purple-400",
        border: "border-purple-300 dark:border-purple-700",
        label: "REFUND PRODUCT"
      },
      "TRANSFER": {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-300 dark:border-blue-700",
        label: "TRANSFER"
      },
      "DEPOSIT": {
        bg: "bg-green-50 dark:bg-green-950/50",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-300 dark:border-green-700",
        label: "DEPOSIT"
      },
      "WITHDRAWAL": {
        bg: "bg-orange-50 dark:bg-orange-950/50",
        text: "text-orange-700 dark:text-orange-400",
        border: "border-orange-300 dark:border-orange-700",
        label: "WITHDRAWAL"
      }
    };

    const config = badgeConfig[typeUpper] || {
      bg: "bg-gray-50 dark:bg-gray-950/50",
      text: "text-gray-700 dark:text-gray-400",
      border: "border-gray-300 dark:border-gray-700",
      label: typeUpper
    };

    return (
      <Badge
        variant="outline"
        className={`${config.bg} ${config.text} ${config.border}`}
      >
        {config.label}
      </Badge>
    );
  };

  // Pagination logic
  const sortedTransactions = wallet?.transactions
    ? [...wallet.transactions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];
  
  // Filter transactions by type
  const filteredByType = typeFilter === "all"
    ? sortedTransactions
    : sortedTransactions.filter((t) => {
        const normalizedType = t.type.toUpperCase().replace(/_/g, " ");
        return normalizedType === typeFilter;
      });
  
  // Filter by date range
  const filteredTransactions = dateFilter === "all"
    ? filteredByType
    : filteredByType.filter((t) => {
        const transactionDate = new Date(t.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter) {
          case "today":
            return transactionDate >= today;
          case "week": {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transactionDate >= monthAgo;
          }
          case "lastMonth": {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
          }
          default:
            return true;
        }
      });
  
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Calculate statistics for BONUS REWARD and COMMIT LOCK
  const bonusRewardStats = filteredTransactions
    .filter((t) => t.type.toUpperCase().replace(/_/g, " ") === "BONUS REWARD")
    .reduce(
      (acc, t) => ({
        count: acc.count + 1,
        total: acc.total + t.amount,
      }),
      { count: 0, total: 0 }
    );
  
  const commitLockStats = filteredTransactions
    .filter((t) => t.type.toUpperCase().replace(/_/g, " ") === "COMMIT LOCK")
    .reduce(
      (acc, t) => ({
        count: acc.count + 1,
        total: acc.total + Math.abs(t.amount),
      }),
      { count: 0, total: 0 }
    );
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-[98vw] !h-[98vh] !max-h-[98vh] p-6 overflow-hidden">
        <DialogHeader className="mb-4 shrink-0">
          <DialogTitle className="text-3xl font-bold flex items-center gap-2">
            Wallet Transaction History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading wallet history...</p>
            </div>
          </div>
        ) : wallet ? (
          <div className="flex flex-col h-full overflow-auto space-y-4 pr-2">
            {/* Wallet Summary - Compact */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardContent className="py-4">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Event Name
                    </label>
                    <p className="text-base font-semibold text-blue-900 dark:text-blue-300 truncate">
                      {wallet.eventName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Host Club
                    </label>
                    <p className="text-base font-semibold text-blue-900 dark:text-blue-300 truncate">
                      {wallet.hostClubName}
                    </p>
                  </div>
                  <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="text-xs font-medium text-muted-foreground">
                      Budget Points
                    </label>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                      {wallet.budgetPoints}
                    </p>
                  </div>
                  <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="text-xs font-medium text-muted-foreground">
                      Balance Points
                    </label>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">
                      {wallet.balancePoints}
                    </p>
                  </div>
                  <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="text-xs font-medium text-muted-foreground">
                      Owner Type
                    </label>
                    <p className="text-base font-semibold text-blue-900 dark:text-blue-300">
                      {wallet.ownerType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List - Fills remaining space */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction History
                </h3>
                <Badge variant="secondary" className="text-sm">
                  {totalTransactions}{" "}
                  {totalTransactions === 1 ? "transaction" : "transactions"}
                </Badge>
              </div>

              {/* Statistics and Filters */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Statistics Boxes */}
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">Bonus Reward</p>
                          <p className="text-lg font-bold text-red-700 dark:text-red-300">
                            {bonusRewardStats.total} pts
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {bonusRewardStats.count} {bonusRewardStats.count === 1 ? "transaction" : "transactions"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">Commit Lock</p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-300">
                            +{commitLockStats.total} pts
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {commitLockStats.count} {commitLockStats.count === 1 ? "transaction" : "transactions"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-48 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="COMMIT LOCK">Commit Lock</SelectItem>
                        <SelectItem value="BONUS REWARD">Bonus Reward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                  {(typeFilter !== "all" || dateFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTypeFilter("all");
                        setDateFilter("all");
                      }}
                      className="h-9"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {totalTransactions === 0 ? (
                <Card className="flex-1 flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground">
                    No transactions found
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[15%]">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[35%]">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[20%]">
                            From/To
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[15%]">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[15%]">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {paginatedTransactions.map((transaction) => {
                          const isIncoming = transaction.amount > 0;
                          const fromTo = isIncoming
                            ? `From: ${transaction.type.includes("SYSTEM") || transaction.type.includes("BONUS") ? "System" : wallet.hostClubName}\nTo: ${wallet.eventName}`
                            : `From: ${wallet.eventName}\nTo: System`;
                          
                          return (
                            <tr
                              key={transaction.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.amount, transaction.type)}
                                  {getTransactionBadge(transaction.type)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {transaction.description}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                  {fromTo.split("\n").map((line, i) => (
                                    <div key={i}>
                                      {line.startsWith("From:") ? (
                                        <span>
                                          <span className="text-gray-500 dark:text-gray-500">From: </span>
                                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                                            {line.replace("From: ", "")}
                                          </span>
                                        </span>
                                      ) : (
                                        <span>
                                          <span className="text-gray-500 dark:text-gray-500">To: </span>
                                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                                            {line.replace("To: ", "")}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`text-lg font-bold ${
                                    isIncoming
                                      ? "text-green-700 dark:text-green-400"
                                      : "text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  {isIncoming ? "+" : ""}
                                  {transaction.amount} pts
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(transaction.createdAt)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Rows per page:
                        </span>
                        <Select
                          value={pageSize.toString()}
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-24 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No wallet data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
