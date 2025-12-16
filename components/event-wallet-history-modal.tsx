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
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventWalletHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | number;
}

export function EventWalletHistoryModal({
  open,
  onOpenChange,
  eventId,
}: EventWalletHistoryModalProps) {
  const [wallet, setWallet] = useState<EventWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

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

  const getTransactionIcon = (amount: number) => {
    if (amount > 0) {
      return (
        <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
      );
    }
    return <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-500" />;
  };

  const getTransactionBadge = (type: string) => {
    const typeUpper = type.toUpperCase();
    switch (typeUpper) {
      case "BONUS_REWARD":
      case "BONUS REWARD":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
          >
            BONUS REWARD
          </Badge>
        );
      case "COMMIT_LOCK":
      case "COMMIT LOCK":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700"
          >
            COMMIT LOCK
          </Badge>
        );
      case "CLUB_TO_MEMBER":
      case "CLUB TO MEMBER":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
          >
            CLUB TO MEMBER
          </Badge>
        );
      case "REFUND_PRODUCT":
      case "REFUND PRODUCT":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700"
          >
            REFUND PRODUCT
          </Badge>
        );
      case "TRANSFER":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
          >
            TRANSFER
          </Badge>
        );
      case "DEPOSIT":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
          >
            DEPOSIT
          </Badge>
        );
      case "WITHDRAWAL":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700"
          >
            WITHDRAWAL
          </Badge>
        );
      default:
        return <Badge variant="outline">{typeUpper}</Badge>;
    }
  };

  // Pagination logic
  const sortedTransactions = wallet?.transactions
    ? [...wallet.transactions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];
  const totalTransactions = sortedTransactions.length;
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
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
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Event Name
                    </label>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                      {wallet.eventName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Host Club
                    </label>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                      {wallet.hostClubName}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="text-sm font-medium text-muted-foreground">
                      Budget Points
                    </label>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                      {wallet.budgetPoints}
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="text-sm font-medium text-muted-foreground">
                      Balance Points
                    </label>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                      {wallet.balancePoints}
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <label className="text-sm font-medium text-muted-foreground">
                      Owner Type
                    </label>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-300 mt-1">
                      {wallet.ownerType}
                    </p>
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
                  {totalTransactions}{" "}
                  {totalTransactions === 1 ? "transaction" : "transactions"}
                </Badge>
              </div>

              {totalTransactions === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No transactions found
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            From/To
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
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
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.amount)}
                                  {getTransactionBadge(transaction.type)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {transaction.description}
                                </p>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                  {fromTo.split("\n").map((line, i) => (
                                    <div key={i}>
                                      {line.startsWith("From:") ? (
                                        <span>
                                          <span className="text-gray-500 dark:text-gray-500">From: </span>
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {line.replace("From: ", "")}
                                          </span>
                                        </span>
                                      ) : (
                                        <span>
                                          <span className="text-gray-500 dark:text-gray-500">To: </span>
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {line.replace("To: ", "")}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right whitespace-nowrap">
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
                              <td className="px-4 py-4 whitespace-nowrap">
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
                      <div className="flex items-center gap-2">
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
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
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
          <div className="py-12 text-center text-muted-foreground">
            No wallet data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
