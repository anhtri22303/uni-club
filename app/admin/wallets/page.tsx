"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminTransaction, AdminWallet, AdjustWalletParams, adjustAdminWallet, fetchAdminTransactions, fetchAdminWallets, } from "@/service/adminApi/adminWalletApi"
import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog"
import { FileText, Eye, Trash, Plus, Minus, Search, Wallet, History, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminWalletsPage() {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("wallets")

    // --- State cho Tab Wallets ---
    const [walletPage, setWalletPage] = useState(0)
    const [walletPageSize, setWalletPageSize] = useState(10)
    const [walletQuery, setWalletQuery] = useState("")

    // --- State cho Tab Transactions ---
    const [txPage, setTxPage] = useState(0)
    const [txPageSize, setTxPageSize] = useState(10)
    const [txQuery, setTxQuery] = useState("")

    // --- State cho Modal ---
    const [adjustModalOpen, setAdjustModalOpen] = useState(false)
    const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(null)
    const [adjustAmount, setAdjustAmount] = useState<number>(0)
    const [adjustNote, setAdjustNote] = useState("")

    // --- Data Fetching: Wallets ---
    const { data: walletData, isLoading: walletLoading } = useQuery({
        queryKey: ["adminWallets", walletPage, walletPageSize],
        queryFn: () =>
            fetchAdminWallets({ page: walletPage, size: walletPageSize }),
        placeholderData: (previousData) => previousData
    })

    const wallets = walletData?.content || []
    const walletTotalPages = walletData?.totalPages || 1
    const walletTotalElements = walletData?.totalElements || 0

    // --- Data Fetching: Transactions ---
    const { data: txData, isLoading: txLoading } = useQuery({
        queryKey: ["adminTransactions", txPage, txPageSize],
        queryFn: () =>
            fetchAdminTransactions({ page: txPage, size: txPageSize }),
        placeholderData: (previousData) => previousData,
    })

    const transactions = txData?.content || []
    const txTotalPages = txData?.totalPages || 1
    const txTotalElements = txData?.totalElements || 0

    // --- Client-side Filtering ---
    const filteredWallets = useMemo(() => {
        if (!walletQuery) return wallets
        const q = walletQuery.toLowerCase()
        return wallets.filter(
            (w) =>
                w.ownerName.toLowerCase().includes(q) ||
                w.walletType.toLowerCase().includes(q) ||
                w.id.toString().includes(q),
        )
    }, [wallets, walletQuery])

    const filteredTransactions = useMemo(() => {
        if (!txQuery) return transactions
        const q = txQuery.toLowerCase()
        return transactions.filter(
            (t) =>
                (t.senderName || "").toLowerCase().includes(q) ||
                (t.receiverName || "").toLowerCase().includes(q) ||
                (t.note || "").toLowerCase().includes(q) ||
                t.type.toLowerCase().includes(q) ||
                t.id.toString().includes(q),
        )
    }, [transactions, txQuery])

    // --- Mutation: Adjust Wallet ---
    const adjustMutation = useMutation({
        mutationFn: adjustAdminWallet,
        onSuccess: () => {
            toast({ title: "Success", description: "Wallet balance adjusted successfully." })
            setAdjustModalOpen(false)
            // Tải lại cả ví và giao dịch
            queryClient.invalidateQueries({ queryKey: ["adminWallets"] })
            queryClient.invalidateQueries({ queryKey: ["adminTransactions"] })
        },
        onError: (err: any) => {
            toast({
                title: "Error",
                description: err.response?.data?.message || err.message,
                variant: "destructive",
            })
        },
    })

    const handleAdjustSubmit = () => {
        if (!selectedWallet) return
        if (adjustAmount === 0 || isNaN(adjustAmount)) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a non-zero amount.",
                variant: "destructive",
            })
            return
        }
        if (!adjustNote) {
            toast({
                title: "Note Required",
                description: "Please provide a reason/note for the adjustment.",
                variant: "destructive",
            })
            return
        }

        adjustMutation.mutate({
            walletId: selectedWallet.id,
            amount: adjustAmount,
            note: adjustNote,
        })
    }

    // --- Handlers ---
    const openAdjustModal = (wallet: AdminWallet) => {
        setSelectedWallet(wallet)
        setAdjustAmount(0)
        setAdjustNote("")
        setAdjustModalOpen(true)
    }

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
        })
    }

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <AppShell>
                <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Wallet Management</h1>
                            <p className="text-muted-foreground">View and manage all system wallets and transactions</p>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 max-w-md">
                            <TabsTrigger value="wallets">
                                <Wallet className="h-4 w-4 mr-2" />
                                Wallets ({walletTotalElements})
                            </TabsTrigger>
                            <TabsTrigger value="transactions">
                                <History className="h-4 w-4 mr-2" />
                                Transactions ({txTotalElements})
                            </TabsTrigger>
                        </TabsList>

                        {/* === WALLETS TAB === */}
                        <TabsContent value="wallets">
                            <Card>
                                <CardHeader>
                                    <CardTitle>All Wallets</CardTitle>
                                    <div className="relative mt-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search wallets by name, type, or ID..."
                                            value={walletQuery}
                                            onChange={(e) => setWalletQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px] text-center">ID</TableHead>
                                                    <TableHead>Owner Name</TableHead>
                                                    <TableHead className="w-[120px]">Type</TableHead>
                                                    <TableHead className="w-[150px] text-right">Balance</TableHead>
                                                    <TableHead className="w-[120px] text-center">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {walletLoading ? (
                                                    [...Array(5)].map((_, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : filteredWallets.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="p-6 text-center">
                                                            No wallets found.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredWallets.map((w) => (
                                                        <TableRow key={w.id}>
                                                            <TableCell className="text-center text-muted-foreground">{w.id}</TableCell>
                                                            <TableCell className="font-medium">{w.ownerName}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={w.walletType === "CLUB" ? "default" : "secondary"}>
                                                                    {w.walletType}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-blue-600">
                                                                {w.balance.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Button size="sm" onClick={() => openAdjustModal(w)}>
                                                                    Adjust
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Wallet Pagination */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Page {walletPage + 1} of {walletTotalPages}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setWalletPage(0)} disabled={walletPage === 0}>
                                                First
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setWalletPage(p => p - 1)} disabled={walletPage === 0}>
                                                Prev
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setWalletPage(p => p + 1)} disabled={walletPage >= walletTotalPages - 1}>
                                                Next
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setWalletPage(walletTotalPages - 1)} disabled={walletPage >= walletTotalPages - 1}>
                                                Last
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* === TRANSACTIONS TAB === */}
                        <TabsContent value="transactions">
                            <Card>
                                <CardHeader>
                                    <CardTitle>All Transactions</CardTitle>
                                    <div className="relative mt-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search transactions by sender, receiver, note, or type..."
                                            value={txQuery}
                                            onChange={(e) => setTxQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">Date</TableHead>
                                                    <TableHead>Sender</TableHead>
                                                    <TableHead>Receiver</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead>Note</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {txLoading ? (
                                                    [...Array(10)].map((_, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : filteredTransactions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="p-6 text-center">
                                                            No transactions found.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredTransactions.map((t) => (
                                                        <TableRow key={t.id}>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                                {formatDateTime(t.createdAt)}
                                                            </TableCell>
                                                            <TableCell className="font-medium">{t.senderName || "System"}</TableCell>
                                                            <TableCell className="font-medium">{t.receiverName}</TableCell>
                                                            <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                                                            <TableCell className={`text-right font-bold ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                                {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">{t.note}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Transaction Pagination */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Page {txPage + 1} of {txTotalPages}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setTxPage(0)} disabled={txPage === 0}>
                                                First
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setTxPage(p => p - 1)} disabled={txPage === 0}>
                                                Prev
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setTxPage(p => p + 1)} disabled={txPage >= txTotalPages - 1}>
                                                Next
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setTxPage(txTotalPages - 1)} disabled={txPage >= txTotalPages - 1}>
                                                Last
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* === ADJUST BALANCE DIALOG === */}
                <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adjust Wallet Balance</DialogTitle>
                            <DialogDescription>
                                Manually add or remove points from{" "}
                                <span className="font-bold text-primary">{selectedWallet?.ownerName}</span>
                                's wallet (ID: {selectedWallet?.id}).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="adjust-amount">Amount</Label>
                                <Input
                                    id="adjust-amount"
                                    type="number"
                                    placeholder="e.g., 500 or -100"
                                    value={adjustAmount || ""}
                                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use a positive number to add points (e.g., 100) or a negative number to subtract (e.g., -50).
                                </p>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => setAdjustAmount(100)}>+100</Button>
                                    <Button size="sm" variant="outline" onClick={() => setAdjustAmount(500)}>+500</Button>
                                    <Button size="sm" variant="outline" onClick={() => setAdjustAmount(-100)}>-100</Button>
                                    <Button size="sm" variant="outline" onClick={() => setAdjustAmount(-500)}>-500</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adjust-note">Note / Reason (Required)</Label>
                                <Textarea
                                    id="adjust-note"
                                    placeholder="e.g., Admin correction, Test adjustment..."
                                    value={adjustNote}
                                    onChange={(e) => setAdjustNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAdjustSubmit}
                                disabled={adjustMutation.isPending}
                            >
                                {adjustMutation.isPending ? "Submitting..." : "Submit Adjustment"} {/* <-- SỬA */}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppShell>
        </ProtectedRoute>
    )
}