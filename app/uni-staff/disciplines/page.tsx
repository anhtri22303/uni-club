"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PenaltyRule, deletePenaltyRule, updatePenaltyRule, createPenaltyRule, PenaltyLevel } from "@/service/disciplineApi"
import { usePenaltyRules } from "@/hooks/use-query-hooks"
import { useMemo, useState, useEffect } from "react" // Đã thêm useEffect
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// Thêm Filter, RefreshCcw vào imports
import { Search, Eye, Trash, Plus, Frown, X, Filter, RefreshCcw, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
// Thêm Popover và Select components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Mapping màu sắc cho Penalty Level
const LevelColorMap: Record<PenaltyLevel | string, "default" | "secondary" | "destructive" | "outline" | "minor" | "normal" | "major" | "severe" | ""> = {
  "MINOR": "minor",
  "NORMAL": "normal",
  "MAJOR": "major",
  "SEVERE": "severe",
}

// Định nghĩa trọng số cho Level để sắp xếp
const LevelWeight: Record<string, number> = {
  "MINOR": 1,
  "NORMAL": 2,
  "MAJOR": 3,
  "SEVERE": 4
}

export default function UniStaffDisciplinePage() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<PenaltyRule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const { data: rules = [], isLoading: loading, isFetching } = usePenaltyRules() // Lấy thêm isFetching

  // --- STATES FOR FILTER & SORT ---
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedPoints, setSelectedPoints] = useState<string>("all")
  const [sortOption, setSortOption] = useState<string>("default")

  // --- EDIT & CREATE STATE (Giữ nguyên) ---
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLevel, setEditLevel] = useState<PenaltyLevel | string>("")
  const [editPenaltyPoints, setEditPenaltyPoints] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createLevel, setCreateLevel] = useState<PenaltyLevel | string>("")
  const [createPenaltyPoints, setCreatePenaltyPoints] = useState<number>(0)
  const [creating, setCreating] = useState(false)

  // --- HÀM XỬ LÝ CLICK VÀO DESCRIPTION ---
  const handleViewDescription = (r: PenaltyRule) => {
    setSelected(r) // Sử dụng lại state selected để lưu dòng đang chọn
    setViewDialogOpen(true)
  }
  const reloadRules = () => {
    queryClient.invalidateQueries({ queryKey: ["penaltyRules"] })
    toast({ title: "Refreshed", description: "Rule list updated." })
  }

  // Lấy danh sách các mức điểm phạt duy nhất để tạo dropdown filter
  const uniquePoints = useMemo(() => {
    const points = new Set(rules.map(r => r.penaltyPoints).filter(p => p !== undefined && p !== null))
    // Sắp xếp số tăng dần
    return Array.from(points).sort((a, b) => (a as number) - (b as number))
  }, [rules])

  // --- FILTER & SORT LOGIC ---
  const filteredAndSorted = useMemo(() => {
    let result = [...rules]

    // 1. Search Logic (Name or Description)
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      result = result.filter((r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      )
    }

    // 2. Filter by Level
    if (selectedLevel !== "all") {
      result = result.filter(r => r.level === selectedLevel)
    }

    // 3. Filter by Points
    if (selectedPoints !== "all") {
      // selectedPoints là string, r.penaltyPoints là number
      result = result.filter(r => String(r.penaltyPoints) === selectedPoints)
    }

    // 4. Sort Logic
    return result.sort((a, b) => {
      // Default: ID DESC (mới nhất lên đầu - giả sử ID tăng dần) hoặc Name
      if (sortOption === 'default') return (a.id || 0) - (b.id || 0)

      // Sort by Level (Weighted)
      if (sortOption === 'level_asc') return (LevelWeight[a.level] || 0) - (LevelWeight[b.level] || 0)
      if (sortOption === 'level_desc') return (LevelWeight[b.level] || 0) - (LevelWeight[a.level] || 0)

      // Sort by Points
      if (sortOption === 'points_asc') return (a.penaltyPoints || 0) - (b.penaltyPoints || 0)
      if (sortOption === 'points_desc') return (b.penaltyPoints || 0) - (a.penaltyPoints || 0)

      return 0
    })
  }, [rules, query, selectedLevel, selectedPoints, sortOption])

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Reset về trang 0 khi thay đổi filter
  useEffect(() => { setPage(0) }, [query, selectedLevel, selectedPoints])

  const clearFilters = () => {
    setSelectedLevel("all")
    setSelectedPoints("all")
    setSortOption("default")
    setQuery("")
  }

  const paginated = useMemo(() => {
    const start = page * pageSize
    return filteredAndSorted.slice(start, start + pageSize)
  }, [filteredAndSorted, page, pageSize])

  // ... (Giữ nguyên các hàm openDetail, handleSave, handleCreate)
  const openDetail = (r: PenaltyRule) => {
    setSelected(r)
    setEditName(r.name || "")
    setEditDescription(r.description || "")
    setEditLevel(r.level || "")
    setEditPenaltyPoints(r.penaltyPoints ?? 0)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selected) return;
    if (!editName.trim()) { toast({ title: 'Error', description: 'Name required', variant: 'destructive' }); return; }
    if (!editLevel.trim()) { toast({ title: 'Error', description: 'Level required', variant: 'destructive' }); return; }

    setSaving(true)
    try {
      const payload = { name: editName, description: editDescription, level: editLevel, penaltyPoints: editPenaltyPoints }
      await updatePenaltyRule(selected.id, payload)
      toast({ title: "Updated", description: `Rule updated: ${editName}` })
      await queryClient.invalidateQueries({ queryKey: ["penaltyRules"] })

      const updatedRule = rules.find(r => r.id === selected.id)
      if (updatedRule) setSelected({ ...updatedRule, ...payload })
      else setDialogOpen(false)
    } catch (err) {
      toast({ title: 'Error', description: 'Update failed', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleCreate = async () => {
    if (!createName.trim() || !createLevel.trim()) {
      toast({ title: 'Error', description: 'Fields required', variant: 'destructive' }); return;
    }
    setCreating(true)
    try {
      const payload = { name: createName, description: createDescription, level: createLevel, penaltyPoints: createPenaltyPoints }
      await createPenaltyRule(payload)
      toast({ title: "Created", description: `Rule created: ${createName}` })
      setCreateOpen(false)
      setCreateName(""); setCreateDescription(""); setCreateLevel(""); setCreatePenaltyPoints(0)
      await queryClient.invalidateQueries({ queryKey: ["penaltyRules"] })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally { setCreating(false) }
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Penalty Rule Management</h1>
              <p className="text-muted-foreground">Manage and configure discipline penalty rules</p>
            </div>

            {/* Thẻ thống kê nhỏ */}
            <div className="hidden md:block">
              {/* Giữ nguyên Card thống kê hoặc custom lại cho gọn */}
              <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <Frown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-[10px] text-red-600/80 uppercase font-bold">Total Rules</div>
                    <div className="text-xl font-bold text-red-700 dark:text-red-400">{rules.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ACTION BAR (SEARCH & FILTER) */}
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-12 bg-white dark:bg-slate-950 border-slate-300"
                />
                {query && (
                  <Button variant="ghost" size="icon" onClick={() => setQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              {/* FILTER POPOVER */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto gap-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    <Filter className="h-4 w-4" />
                    Filters & Sort
                    {(selectedLevel !== "all" || selectedPoints !== "all" || sortOption !== "default") && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                        {(selectedLevel !== "all" ? 1 : 0) + (selectedPoints !== "all" ? 1 : 0) + (sortOption !== "default" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium leading-none">Filter Options</h4>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 py-1"
                        onClick={clearFilters}>
                        Clear all
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[300px] md:min-w-[500px]">
                      {/* Filter Level */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Severity Level</Label>
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                          <SelectTrigger className="border-slate-300"><SelectValue placeholder="All Levels" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="MINOR">MINOR (Nhẹ)</SelectItem>
                            <SelectItem value="NORMAL">NORMAL (Thường)</SelectItem>
                            <SelectItem value="MAJOR">MAJOR (Nặng)</SelectItem>
                            <SelectItem value="SEVERE">SEVERE (Nghiêm trọng)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter Points */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Minus Points</Label>
                        <Select value={selectedPoints} onValueChange={setSelectedPoints}>
                          <SelectTrigger className="border-slate-300"><SelectValue placeholder="All Points" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Points</SelectItem>
                            {uniquePoints.map((p) => (
                              <SelectItem key={p as number} value={String(p)}>{p} points</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort Options */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sort By</Label>
                        <Select value={sortOption} onValueChange={setSortOption}>
                          <SelectTrigger className="border-slate-300"><SelectValue placeholder="Default" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default (Newest)</SelectItem>
                            <SelectItem value="level_asc">Level: Minor → Severe</SelectItem>
                            <SelectItem value="level_desc">Level: Severe → Minor</SelectItem>
                            <SelectItem value="points_asc">Points: Low → High</SelectItem>
                            <SelectItem value="points_desc">Points: High → Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {isFetching && <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
              <Button variant="outline" size="icon" onClick={reloadRules} title="Refresh"><RefreshCcw className="h-4 w-4" /></Button>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create Rule
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Penalty Rule List</CardTitle>
              <CardDescription>Showing {paginated.length} of {filteredAndSorted.length} rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900">
                        <TableHead className="w-[3rem] text-center">ID</TableHead>
                        <TableHead className="pl-10">Rule Name</TableHead>
                        <TableHead className="pl-20">Descriptions</TableHead>
                        {/* <TableHead className="w-[8rem] text-center">Level</TableHead>
                        <TableHead className="w-[9rem] text-center">Minus points</TableHead> */}
                        {/* Cột Level có Tooltip */}
                        <TableHead className="w-[8rem] text-center">
                          <div className="flex items-center justify-center gap-1">
                            Level
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-[200px]">
                                  Severity of Violation:
                                  <br />
                                  MINOR: minor error
                                  <br />
                                  NORMAL: medium error
                                  <br />
                                  MAJOR: serious error
                                  <br />
                                  SEVERE: extremely serious error
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>

                        {/* Cột Minus points có Tooltip */}
                        <TableHead className="w-[9rem] text-center">
                          <div className="flex items-center justify-center gap-1">
                            Minus points
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-[200px]">
                                  Training points will be deducted for violating this rule.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead className="w-[6rem] text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={6} className="p-6 text-center">Loading...</TableCell></TableRow>
                      ) : filteredAndSorted.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="p-6 text-center text-muted-foreground">No penalty rules found matching filters</TableCell></TableRow>
                      ) : (
                        paginated.map((r, idx) => (
                          <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <TableCell className="text-sm text-muted-foreground text-center">{r.id}</TableCell>
                            <TableCell className="font-medium text-primary/90">{r.name}</TableCell>
                            {/* <TableCell className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">{r.description}</TableCell> */}
                            <TableCell
                              className="text-sm text-muted-foreground max-w-[300px] cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                              title="Click to view full description"
                              onClick={() => handleViewDescription(r)}
                            >
                              <div className="line-clamp-1"> {/* Dùng div bao ngoài để truncate hoạt động tốt hơn */}
                                {r.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={LevelColorMap[r.level] || "outline"}>{r.level}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-center">{r.penaltyPoints}</TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-center">
                                <Button size="sm" variant="ghost" onClick={() => openDetail(r)} title="Edit">
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                {/* ALERT DIALOG DELETE (Giữ nguyên logic cũ) */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" title="Delete">
                                      <Trash className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Delete rule: <strong>{r.name}</strong>?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction asChild>
                                        <Button variant="destructive" onClick={async () => {
                                          try {
                                            await deletePenaltyRule(r.id)
                                            toast({ title: 'Deleted', description: 'Rule deleted.' })
                                            reloadRules()
                                          } catch (e) { toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' }) }
                                        }}>Delete</Button>
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {filteredAndSorted.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {page + 1} of {Math.max(1, Math.ceil(filteredAndSorted.length / pageSize))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(filteredAndSorted.length / pageSize) - 1, p + 1))}
                        disabled={(page + 1) * pageSize >= filteredAndSorted.length}>Next</Button>
                      <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Include Dialogs for Create/Edit here (Giữ nguyên phần code Dialog ở cuối file gốc của bạn) */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Penalty Rule</DialogTitle></DialogHeader>
              {/* Form fields tương tự file gốc */}
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)}
                    className="border-slate-300 mt-2"
                  />
                </div>
                <div>
                  <Label>Level</Label>
                  <Select value={editLevel} onValueChange={setEditLevel}>
                    <SelectTrigger className="border-slate-300 mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINOR">MINOR</SelectItem>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                      <SelectItem value="MAJOR">MAJOR</SelectItem>
                      <SelectItem value="SEVERE">SEVERE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Points</Label>
                  <Input
                    type="text"                  // Đổi sang text để hiện dấu phẩy
                    inputMode="numeric"          // Gợi ý bàn phím số trên mobile
                    value={new Intl.NumberFormat('en-US').format(editPenaltyPoints)} // Format có dấu phẩy
                    onChange={(e) => {
                      // Chỉ giữ lại số (0-9), loại bỏ chữ, ký tự đặc biệt và dấu âm
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      // Chuyển về số, nếu rỗng thì về 0
                      setEditPenaltyPoints(rawValue ? parseInt(rawValue, 10) : 0);
                    }}
                    className="border-slate-300 mt-2 w-1/3"
                    placeholder="0"
                  />
                </div>
                <div><Label>Description</Label>
                  <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                    className="border-slate-300 mt-2"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Penalty Rule</DialogTitle></DialogHeader>
              {/* Form fields tương tự file gốc */}
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Name<span className="text-red-500 font-bold">*</span></Label>
                  <Input value={createName} onChange={e => setCreateName(e.target.value)}
                    className="border-slate-300 mt-2"
                  />
                </div>
                <div>
                  <Label>Level<span className="text-red-500 font-bold">*</span></Label>
                  <Select value={createLevel} onValueChange={setCreateLevel}>
                    <SelectTrigger className="border-slate-300 mt-2"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINOR">MINOR</SelectItem>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                      <SelectItem value="MAJOR">MAJOR</SelectItem>
                      <SelectItem value="SEVERE">SEVERE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Points<span className="text-red-500 font-bold">*</span></Label>
                  <Input
                    type="text"                  // Đổi sang text
                    inputMode="numeric"          // Gợi ý bàn phím số
                    value={new Intl.NumberFormat('en-US').format(createPenaltyPoints)} // Format hiển thị
                    onChange={(e) => {
                      // Regex /[^0-9]/g sẽ loại bỏ tất cả ký tự không phải số (bao gồm dấu -)
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      setCreatePenaltyPoints(rawValue ? parseInt(rawValue, 10) : 0);
                    }}
                    className="border-slate-300 mt-2 w-1/3"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Description<span className="text-red-500 font-bold">*</span></Label>
                  <Textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)}
                    className="border-slate-300 mt-2"
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* --- VIEW FULL DESCRIPTION --- */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl text-primary">
                  Discipline Description Details
                  {/* {selected?.name} */}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                    {selected?.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </AppShell>
    </ProtectedRoute>
  )
}