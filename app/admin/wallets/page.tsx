"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    AdminTransaction, AdminWallet, AdjustWalletParams, adjustAdminWallet, fetchAdminTransactions, fetchAdminWallets,
} from "@/service/adminApi/adminWalletApi"
import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog"
import { FileText, Eye, Trash, Plus, Minus, Search, Wallet, History, ArrowRight, X, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

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

    // --- State cho Filter Wallets ---
    const [walletTypeFilter, setWalletTypeFilter] = useState("ALL") // ALL, CLUB, STUDENT
    const [walletSortOrder, setWalletSortOrder] = useState("default") // default, balance-asc, balance-desc

    // --- State cho Filter Transactions ---
    const [txTypeFilter, setTxTypeFilter] = useState("ALL")
    const [txAmountRange, setTxAmountRange] = useState({ min: "", max: "" })
    const [txSignFilter, setTxSignFilter] = useState("all") // all, positive, negative

    // --- State cho Modal ---
    const [adjustModalOpen, setAdjustModalOpen] = useState(false)
    const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(null)
    const [adjustAmount, setAdjustAmount] = useState<number>(0)
    const [adjustNote, setAdjustNote] = useState("")

    const getBadgeStyles = (type: string) => {
        const upperType = type.toUpperCase();
        // Màu Tím cho EVENT
        if (upperType.includes("EVENT")) {
            return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
        }
        // Màu Xanh Dương cho CLUB
        if (upperType.includes("CLUB")) {
            return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
        }
        // Màu Xanh Nhạt/Xám cho USER
        if (upperType.includes("USER") || upperType === "STUDENT") {
            return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
        }
        // Mặc định cho các loại khác
        return "bg-gray-50 text-gray-600 border-gray-100";
    };

    // --- Data Fetching: Wallets ---
    const { data: walletData, isLoading: walletLoading } = useQuery({
        queryKey: ["adminWallets"], // Bỏ page, size khỏi queryKey để không fetch lại khi đổi trang
        queryFn: () =>
            fetchAdminWallets({ page: 0, size: 1000 }), // Lấy 1000 items để có data tổng
        placeholderData: (previousData) => previousData
    })

    const allWallets = walletData?.content || [] // Toàn bộ dữ liệu từ server

    const wallets = walletData?.content || []
    const walletTotalPages = walletData?.totalPages || 1
    const walletTotalElements = walletData?.totalElements || 0

    // --- Data Fetching: Transactions ---
    const { data: txData, isLoading: txLoading } = useQuery({
        queryKey: ["adminTransactions"], // Bỏ txPage, txPageSize để không fetch lại khi đổi trang
        queryFn: () =>
            fetchAdminTransactions({ page: 0, size: 1000 }), // Lấy 1000 items để lọc toàn cục
        placeholderData: (previousData) => previousData,
    })

    const allTransactions = txData?.content || [] // Toàn bộ dữ liệu từ server

    const transactions = txData?.content || []
    const txTotalPages = txData?.totalPages || 1
    const txTotalElements = txData?.totalElements || 0

    // --- Client-side Filtering ---
    // 1. Lọc trên TOÀN BỘ danh sách (allWallets)
    const filteredWallets = useMemo(() => {
        let result = [...allWallets];
        if (walletQuery) {
            const q = walletQuery.toLowerCase();
            result = result.filter(w => w.ownerName.toLowerCase().includes(q) || w.id.toString().includes(q));
        }
        if (walletTypeFilter !== "ALL") {
            result = result.filter(w => w.walletType === walletTypeFilter);
        }
        if (walletSortOrder === "balance-asc") result.sort((a, b) => a.balance - b.balance);
        if (walletSortOrder === "balance-desc") result.sort((a, b) => b.balance - a.balance);
        return result;
    }, [allWallets, walletQuery, walletTypeFilter, walletSortOrder]);

    // 2. Tự tính toán các thông số phân trang mới
    const lastPage = Math.max(0, Math.ceil(filteredWallets.length / walletPageSize) - 1);

    // 3. Quan trọng: Tự động đưa về trang cuối nếu trang hiện tại vượt quá số lượng sau khi lọc
    if (walletPage > lastPage && filteredWallets.length > 0) {
        setWalletPage(lastPage);
    }

    // 4. Cắt dữ liệu để hiển thị trên trang hiện tại (Dùng cái này để render Table)
    const paginatedWallets = useMemo(() => {
        const start = walletPage * walletPageSize;
        return filteredWallets.slice(start, start + walletPageSize);
    }, [filteredWallets, walletPage, walletPageSize]);


    // 1. Lọc trên TOÀN BỘ danh sách allTransactions
    const filteredTransactions = useMemo(() => {
        let result = [...allTransactions];

        // Lọc theo search query (Note, Sender, Receiver)
        if (txQuery) {
            const q = txQuery.toLowerCase();
            result = result.filter(t =>
                (t.note || "").toLowerCase().includes(q) ||
                (t.senderName || "").toLowerCase().includes(q) ||
                (t.receiverName || "").toLowerCase().includes(q)
            );
        }

        // Lọc theo Type
        if (txTypeFilter !== "ALL") {
            result = result.filter(t => t.type === txTypeFilter);
        }

        // Lọc theo dấu Âm/Dương
        if (txSignFilter === "positive") result = result.filter(t => t.amount > 0);
        if (txSignFilter === "negative") result = result.filter(t => t.amount < 0);

        // Lọc theo khoảng Amount (giá trị tuyệt đối)
        if (txAmountRange.min) result = result.filter(t => Math.abs(t.amount) >= Number(txAmountRange.min));
        if (txAmountRange.max) result = result.filter(t => Math.abs(t.amount) <= Number(txAmountRange.max));

        return result;
    }, [allTransactions, txQuery, txTypeFilter, txSignFilter, txAmountRange]);

    // 2. Tính toán thông số phân trang cho Transactions
    const txLastPage = Math.max(0, Math.ceil(filteredTransactions.length / txPageSize) - 1);

    // 3. Tự động đưa về trang cuối nếu trang hiện tại bị "lố" sau khi lọc
    if (txPage > txLastPage && filteredTransactions.length > 0) {
        setTxPage(txLastPage);
    }

    // 4. Cắt dữ liệu để hiển thị (Dùng cái này để render Table)
    const paginatedTransactions = useMemo(() => {
        const start = txPage * txPageSize;
        return filteredTransactions.slice(start, start + txPageSize);
    }, [filteredTransactions, txPage, txPageSize]);

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
                description: err.response?.data?.error || err.response?.data?.message || err.message,
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
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <CardTitle>All Wallets</CardTitle>
                                        <div className="flex items-center gap-2">
                                            {/* Search Input */}
                                            <div className="relative w-100">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search wallets by name, type, or ID..."
                                                    value={walletQuery}
                                                    onChange={(e) => setWalletQuery(e.target.value)}
                                                    className="pl-10 pr-10 w-full border-slate-300"
                                                />
                                                {/* Nút Clear (X) cho Wallet */}
                                                {walletQuery && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                                                        onClick={() => setWalletQuery("")}
                                                    >
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Filter Button */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="bg-cyan-600 text-white hover:bg-cyan-700 hover:text-white border-none">
                                                        <Filter className="h-4 w-4 mr-2" /> Filters & Sort
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-4">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-bold">Filter Information</h4>
                                                            <Button variant="ghost" size="sm" className="h-auto p-0 text-red-500 p-2"
                                                                onClick={() => { setWalletTypeFilter("ALL"); setWalletSortOrder("default") }}>
                                                                Clear all
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label>Wallet Type</Label>
                                                                <Select value={walletTypeFilter} onValueChange={setWalletTypeFilter}>
                                                                    <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="ALL">All Types</SelectItem>
                                                                        <SelectItem value="CLUB">CLUB</SelectItem>
                                                                        <SelectItem value="EVENT">EVENT</SelectItem>
                                                                        <SelectItem value="USER">USER</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Sort Balance</Label>
                                                                <Select value={walletSortOrder} onValueChange={setWalletSortOrder}>
                                                                    <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="default">Default</SelectItem>
                                                                        <SelectItem value="balance-desc">High to Low</SelectItem>
                                                                        <SelectItem value="balance-asc">Low to High</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </CardHeader>


                                <CardContent>
                                    <div className="w-full overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[100px] text-center">ID</TableHead>
                                                    <TableHead className="text-left pl-20">Owner Name</TableHead>
                                                    <TableHead className="w-[100px] text-center">Type</TableHead>
                                                    <TableHead className="w-[150px] text-right pr-10">Balance</TableHead>
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
                                                ) : paginatedWallets.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="p-6 text-center">
                                                            No wallets found.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    paginatedWallets.map((w) => (
                                                        <TableRow key={w.id}>
                                                            <TableCell className="text-center text-muted-foreground">{w.id}</TableCell>
                                                            <TableCell className="font-medium">{w.ownerName}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={getBadgeStyles(w.walletType)}
                                                                >
                                                                    {w.walletType}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-black pr-5">
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
                                    <div className="mt-4 flex items-center justify-between border-t pt-4"> {/* Thêm container này */}
                                        <div className="text-sm text-muted-foreground">
                                            Showing {filteredWallets.length === 0 ? 0 : walletPage * walletPageSize + 1} to {Math.min((walletPage + 1) * walletPageSize, filteredWallets.length)} of {filteredWallets.length} wallets
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm" variant="outline"
                                                onClick={() => setWalletPage(0)}
                                                disabled={walletPage === 0}
                                            >First</Button>

                                            <Button
                                                size="sm" variant="outline"
                                                onClick={() => setWalletPage(p => Math.max(0, p - 1))}
                                                disabled={walletPage === 0}
                                            >Prev</Button>

                                            <div className="px-2 text-sm">
                                                Page {walletPage + 1} of {Math.max(1, Math.ceil(filteredWallets.length / walletPageSize))}
                                            </div>

                                            <Button
                                                size="sm" variant="outline"
                                                onClick={() => setWalletPage(p => Math.min(p + 1, lastPage))}
                                                disabled={walletPage >= lastPage}
                                            >Next</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* === TRANSACTIONS TAB === */}
                        <TabsContent value="transactions">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <CardTitle>All Transactions</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-100">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search transactions..."
                                                    value={txQuery}
                                                    onChange={(e) => setTxQuery(e.target.value)}
                                                    className="pl-10 pr-10 w-full border-slate-300"
                                                />
                                                {/* Nút Clear (X) cho Transactions */}
                                                {txQuery && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                                                        onClick={() => setTxQuery("")}
                                                    >
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </div>

                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="bg-cyan-600 text-white hover:bg-cyan-700 hover:text-white border-none">
                                                        <Filter className="h-4 w-4 mr-2" /> Filters & Sort
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-96 p-4">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-bold">Filter Transactions</h4>
                                                            <Button variant="ghost" size="sm" className="h-auto p-0 text-red-500 p-2"
                                                                onClick={() => { setTxTypeFilter("ALL"); setTxSignFilter("all"); setTxAmountRange({ min: "", max: "" }) }}>
                                                                Clear all
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label>Type</Label>
                                                                <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                                                                    <SelectTrigger className="border-slate-300">
                                                                        <SelectValue placeholder="All Types" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="max-h-[300px]"> {/* Thêm max-height để scroll vì danh sách dài */}
                                                                        <SelectItem value="ALL">All Types</SelectItem>

                                                                        {/* ===== CORE ===== */}
                                                                        <SelectItem value="ADD">ADD</SelectItem>
                                                                        <SelectItem value="REDUCE">REDUCE</SelectItem>
                                                                        <SelectItem value="TRANSFER">TRANSFER</SelectItem>

                                                                        {/* ===== UNIVERSITY / CLUB ===== */}
                                                                        <SelectItem value="UNI_TO_CLUB">UNI_TO_CLUB</SelectItem>
                                                                        <SelectItem value="CLUB_TO_MEMBER">CLUB_TO_MEMBER</SelectItem>

                                                                        {/* ===== EVENT ===== */}
                                                                        <SelectItem value="EVENT_BUDGET_GRANT">EVENT_BUDGET_GRANT</SelectItem>
                                                                        <SelectItem value="EVENT_REFUND_REMAINING">EVENT_REFUND_REMAINING</SelectItem>
                                                                        <SelectItem value="EVENT_BUDGET_FORFEIT">EVENT_BUDGET_FORFEIT</SelectItem>

                                                                        {/* ===== COMMIT / BONUS ===== */}
                                                                        <SelectItem value="COMMIT_LOCK">COMMIT_LOCK</SelectItem>
                                                                        <SelectItem value="REFUND_COMMIT">REFUND_COMMIT</SelectItem>
                                                                        <SelectItem value="BONUS_REWARD">BONUS_REWARD</SelectItem>
                                                                        <SelectItem value="RETURN_SURPLUS">RETURN_SURPLUS</SelectItem>
                                                                        <SelectItem value="PUBLIC_EVENT_REWARD">PUBLIC_EVENT_REWARD</SelectItem>

                                                                        {/* ===== PRODUCT ===== */}
                                                                        <SelectItem value="REDEEM_PRODUCT">REDEEM_PRODUCT</SelectItem>
                                                                        <SelectItem value="REFUND_PRODUCT">REFUND_PRODUCT</SelectItem>
                                                                        <SelectItem value="EVENT_REDEEM_PRODUCT">EVENT_REDEEM_PRODUCT</SelectItem>
                                                                        <SelectItem value="EVENT_REFUND_PRODUCT">EVENT_REFUND_PRODUCT</SelectItem>
                                                                        <SelectItem value="PRODUCT_CREATION_COST">PRODUCT_CREATION_COST</SelectItem>
                                                                        <SelectItem value="PRODUCT_IMPORT_COST">PRODUCT_IMPORT_COST</SelectItem>

                                                                        {/* ===== CLUB INTERNAL ===== */}
                                                                        <SelectItem value="CLUB_RECEIVE_REDEEM">CLUB_RECEIVE_REDEEM</SelectItem>
                                                                        <SelectItem value="CLUB_REFUND">CLUB_REFUND</SelectItem>
                                                                        <SelectItem value="CLUB_REWARD_DISTRIBUTE">CLUB_REWARD_DISTRIBUTE</SelectItem>

                                                                        {/* ===== PENALTY ===== */}
                                                                        <SelectItem value="MEMBER_PENALTY">MEMBER_PENALTY</SelectItem>
                                                                        <SelectItem value="CLUB_FROM_PENALTY">CLUB_FROM_PENALTY</SelectItem>

                                                                        {/* ===== ADMIN & CASHOUT ===== */}
                                                                        <SelectItem value="ADMIN_ADJUST">ADMIN_ADJUST</SelectItem>
                                                                        <SelectItem value="CASHOUT_REQUEST">CASHOUT_REQUEST</SelectItem>
                                                                        <SelectItem value="CASHOUT_APPROVED">CASHOUT_APPROVED</SelectItem>
                                                                        <SelectItem value="CASHOUT_REJECTED">CASHOUT_REJECTED</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Amount Sign</Label>
                                                                <Select value={txSignFilter} onValueChange={setTxSignFilter}>
                                                                    <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="all">Both (+/-)</SelectItem>
                                                                        <SelectItem value="positive">Positive (+)</SelectItem>
                                                                        <SelectItem value="negative">Negative (-)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Amount Range (Absolute Value)</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input placeholder="Min" type="number" value={txAmountRange.min} className="border-slate-300"
                                                                    onChange={(e) => setTxAmountRange({ ...txAmountRange, min: e.target.value })} />
                                                                <Input placeholder="Max" type="number" value={txAmountRange.max} className="border-slate-300"
                                                                    onChange={(e) => setTxAmountRange({ ...txAmountRange, max: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <TooltipProvider> {/* Bao bọc toàn bộ nội dung bằng TooltipProvider */}
                                        <div className="w-full overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[120px] text-center">Date</TableHead>
                                                        <TableHead className="w-[200px] pl-10">Sender</TableHead>
                                                        <TableHead className="w-[250px] pl-10">Receiver</TableHead>
                                                        <TableHead className="w-[150px] text-center">Type</TableHead>
                                                        <TableHead className="w-[90px] text-right pr-5">Amount</TableHead>
                                                        <TableHead className="w-[200px] text-left pl-10">Note</TableHead> {/* Cột Note sẽ chiếm phần diện tích còn lại */}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {txLoading ? (
                                                        [...Array(10)].map((_, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : paginatedTransactions.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="p-6 text-center">
                                                                No transactions found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        paginatedTransactions.map((t) => (
                                                            <TableRow key={t.id}>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                    {formatDateTime(t.createdAt)}
                                                                </TableCell>
                                                                {/* <TableCell className="font-medium truncate max-w-[150px]">{t.senderName || "System"}</TableCell> */}
                                                                <TableCell className="font-medium">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="max-w-[150px] truncate cursor-help">
                                                                                {t.senderName || "System"}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            <p>{t.senderName || "System"}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TableCell>
                                                                {/* <TableCell className="font-medium truncate max-w-[150px]">{t.receiverName}</TableCell> */}
                                                                <TableCell className="font-medium">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="max-w-[150px] truncate cursor-help">
                                                                                {t.receiverName}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            <p>{t.receiverName}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TableCell>
                                                                <TableCell className="text-center"><Badge variant="outline">{t.type}</Badge></TableCell>
                                                                <TableCell className={`text-right font-bold ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                                                                </TableCell>
                                                                {/* Xử lý Note dài với Tooltip */}
                                                                <TableCell>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="max-w-[250px] truncate cursor-help text-sm text-muted-foreground">
                                                                                {t.note}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="bottom" className="max-w-[300px] break-words">
                                                                            <p>{t.note}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TooltipProvider>

                                    {/* Transaction Pagination */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {filteredTransactions.length === 0 ? 0 : txPage * txPageSize + 1} to {Math.min((txPage + 1) * txPageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setTxPage(0)} disabled={txPage === 0}>
                                                First
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setTxPage(p => Math.max(0, p - 1))} disabled={txPage === 0}>
                                                Prev
                                            </Button>
                                            <div className="px-2 text-sm font-medium">
                                                Page {txPage + 1} of {Math.max(1, Math.ceil(filteredTransactions.length / txPageSize))}
                                            </div>
                                            <Button
                                                size="sm" variant="outline"
                                                onClick={() => setTxPage(p => Math.min(p + 1, txLastPage))}
                                                disabled={txPage >= txLastPage}
                                            >
                                                Next
                                            </Button>
                                            <Button
                                                size="sm" variant="outline"
                                                onClick={() => setTxPage(txLastPage)}
                                                disabled={txPage >= txLastPage}
                                            >
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
                                {adjustMutation.isPending ? "Submitting..." : "Submit Adjustment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppShell>
        </ProtectedRoute>
    )
}