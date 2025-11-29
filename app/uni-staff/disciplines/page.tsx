"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Cập nhật imports từ disciplineApi.ts
import { PenaltyRule, deletePenaltyRule, updatePenaltyRule, createPenaltyRule, PenaltyLevel } from "@/service/disciplineApi"
// Import custom hook cho Penalty Rules
import { usePenaltyRules } from "@/hooks/use-query-hooks"
import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, Search, Eye, Trash, Plus, Frown, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"


// Mapping màu sắc cho Penalty Level
const LevelColorMap: Record<PenaltyLevel | string, "default" | "secondary" | "destructive" | "outline" | "minor" | "normal" | "major" | "severe" | ""> = {
  "MINOR": "minor",
  "NORMAL": "normal",
  "MAJOR": "major",
  "SEVERE": "severe",
}

export default function UniStaffDisciplinePage() {
  const [query, setQuery] = useState("")
  // Thay thế Policy bằng PenaltyRule
  const [selected, setSelected] = useState<PenaltyRule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // USE REACT QUERY for penalty rules (Cần tạo hook usePenaltyRules trong use-query-hooks)
  const { data: rules = [], isLoading: loading } = usePenaltyRules()

  // edit form state for rule detail modal
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLevel, setEditLevel] = useState<PenaltyLevel | string>("")
  const [editPenaltyPoints, setEditPenaltyPoints] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  // create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createLevel, setCreateLevel] = useState<PenaltyLevel | string>("")
  const [createPenaltyPoints, setCreatePenaltyPoints] = useState<number>(0)
  const [creating, setCreating] = useState(false)

  const reloadRules = () => {
    queryClient.invalidateQueries({ queryKey: ["penaltyRules"] })
  }

  const filtered = useMemo(() => {
    if (!query) return rules
    const q = query.toLowerCase()
    return rules.filter((r) =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.level || "").toLowerCase().includes(q))
  }, [rules, query])

  // Minimal pagination state
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Ensure page is clamped when filtered data or pageSize change - auto-adjust on data change
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1)
  if (page > lastPage && filtered.length > 0) {
    setPage(lastPage)
  }

  const paginated = useMemo(() => {
    const start = page * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const openDetail = (r: PenaltyRule) => {
    setSelected(r)
    // populate edit fields
    setEditName(r.name || "")
    setEditDescription(r.description || "")
    setEditLevel(r.level || "")
    setEditPenaltyPoints(r.penaltyPoints ?? 0)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selected) return;
    if (!editName.trim()) {
      toast({ title: 'Validation Error', description: 'Rule Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!editLevel.trim()) {
      toast({ title: 'Validation Error', description: 'Violation Level cannot be empty.', variant: 'destructive' });
      return;
    }
    // Chấp nhận 0 nhưng không chấp nhận giá trị null/undefined hoặc số âm
    if (editPenaltyPoints === null || editPenaltyPoints < 0) {
      toast({ title: 'Validation Error', description: 'Penalty Points must be a non-negative number.', variant: 'destructive' });
      return;
    }

    setSaving(true)
    try {
      const payload = {
        name: editName,
        description: editDescription,
        level: editLevel,
        penaltyPoints: editPenaltyPoints,
      }

      await updatePenaltyRule(selected.id, payload)

      toast({ title: "Update successful", description: `Rule updated: ${editName}` })

      // refresh list with React Query
      await reloadRules()

      // Tìm và cập nhật lại selected object để modal phản ánh giá trị mới
      const updatedRule = rules.find(r => r.id === selected.id)
      if (updatedRule) {
        setSelected({ ...updatedRule, ...payload })
      } else {
        // Nếu không tìm thấy, đóng dialog để người dùng thấy list đã reload
        setDialogOpen(false)
      }

    } catch (err) {
      console.error('Update penalty rule failed:', err)
      toast({ title: 'Error', description: 'Error updating penalty rule.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast({ title: 'Validation Error', description: 'Rule Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!createLevel.trim()) {
      toast({ title: 'Validation Error', description: 'Violation Level cannot be empty.', variant: 'destructive' });
      return;
    }
    // Chấp nhận 0 nhưng không chấp nhận giá trị null/undefined hoặc số âm
    if (createPenaltyPoints === null || createPenaltyPoints < 0) {
      toast({ title: 'Validation Error', description: 'Penalty Points must be a non-negative number.', variant: 'destructive' });
      return;
    }

    setCreating(true)
    try {
      const payload = {
        name: createName,
        description: createDescription,
        level: createLevel,
        penaltyPoints: createPenaltyPoints,
      }

      console.log("Data to be sent:", payload)

      await createPenaltyRule(payload)

      toast({ title: "Create success", description: `Rule created: ${createName}` })
      setCreateOpen(false)

      // reset fields
      setCreateName("")
      setCreateDescription("")
      setCreateLevel("")
      setCreatePenaltyPoints(0)

      // reload list
      await reloadRules()
    } catch (err: any) {
      console.error('Create penalty rule failed:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Error creating penalty rule.'
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Penalty Rule Management</h1>
              <p className="text-muted-foreground">Manage and configure discipline penalty rules</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 h-full">
                  <CardContent className="p-2 h-full flex flex-col justify-center">
                    <div className="text-[12px] font-medium text-red-700 dark:text-red-300 mb-1">Total Rules</div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-red-500 rounded-md">
                        <Frown className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-red-900 dark:text-red-100">{rules.length}</div>
                        <p className="text-[10px] text-red-600 dark:text-red-400">Rules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                  <Input
                    placeholder="Search rules"
                    value={query}
                    onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                    // Thêm 'pr-12' và điều chỉnh width
                    className="w-[250px] pr-12 bg-white dark:bg-slate-800 rounded-md px-3 py-2 shadow-sm border border-gray-200 
                    dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />

                  {/* Nút X (Clear) nằm đè lên Input */}
                  {query && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>

                {/* XÓA: Nút <Button ...>Clear Search</Button> cũ ở đây */}

                <Button size="sm" className="ml-2" onClick={() => setCreateOpen(true)} title="Create penalty rule">
                  Create Rule
                  <Plus className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Penalty Rule List</CardTitle>
              <CardDescription>Showing {filtered.length} of {rules.length} rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[3rem] text-center">ID</TableHead>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[8rem] text-center">Level</TableHead>
                        <TableHead className="w-[9rem] text-center">Minus points</TableHead>
                        <TableHead className="w-[6rem] text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="p-6 text-center">Loading...</TableCell>
                        </TableRow>
                      ) : filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="p-6 text-center">No penalty rules found</TableCell>
                        </TableRow>
                      ) : (
                        paginated.map((r, idx) => (
                          <TableRow
                            key={r.id}
                            className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'} 
                            hover:bg-slate-100 dark:hover:bg-slate-700`}
                          >
                            <TableCell className="text-sm text-muted-foreground text-center">{r.id}</TableCell>
                            <TableCell className="font-medium text-primary/90">{r.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground line-clamp-1">{r.description}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={LevelColorMap[r.level] || "outline"}>{r.level}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-center">{r.penaltyPoints}</TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-center">
                                <Button size="sm" onClick={() => openDetail(r)} title="View/Edit">
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" title="Delete">
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. The following penalty rule will be permanently deleted:
                                        <br />
                                        <strong className="mt-2 block">{r.name} ({r.penaltyPoints} points)</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>

                                      <AlertDialogAction asChild>
                                        <Button
                                          variant="destructive"
                                          onClick={async () => {
                                            try {
                                              await deletePenaltyRule(r.id)
                                              toast({ title: 'Deleted', description: `Rule ${r.name} deleted successfully.` })
                                              if (selected?.id === r.id) setDialogOpen(false)
                                              await reloadRules()
                                              try { router.refresh() } catch (e) { /* ignore */ }
                                            } catch (err) {
                                              console.error('Delete penalty rule failed:', err)
                                              toast({ title: 'Error', description: 'Error deleting penalty rule.', variant: 'destructive' })
                                            }
                                          }}
                                        >
                                          Continue
                                        </Button>
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
                {/* Pagination controls */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div>Showing</div>
                    <div className="font-medium">{filtered.length === 0 ? 0 : page * pageSize + 1}</div>
                    <div>to</div>
                    <div className="font-medium">{Math.min((page + 1) * pageSize, filtered.length)}</div>
                    <div>of</div>
                    <div className="font-medium">{filtered.length}</div>
                    <div>rules</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
                    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                    <div className="px-2 text-sm">
                      Page {filtered.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
                    </div>
                    <Button size="sm" variant="outline"
                      onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)))}
                      disabled={(page + 1) * pageSize >= filtered.length}>
                      Next
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => setPage(Math.max(0, Math.ceil(filtered.length / pageSize) - 1))}
                      disabled={(page + 1) * pageSize >= filtered.length}>
                      Last
                    </Button>
                    <select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize}
                      onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(0) }}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Penalty Rule Detail / Edit</DialogTitle>
                {/* <DialogDescription>Modify rule fields and press Save to persist changes.</DialogDescription> */}
              </DialogHeader>

              <div className="mt-2 space-y-3">
                <div>
                  <Label htmlFor="rule-name">Rule Name<span className="text-red-500">*</span></Label>
                  <Input id="rule-name" className="mt-2 border-slate-300" value={editName} 
                  onChange={(e) => setEditName((e.target as HTMLInputElement).value)} />
                </div>

                <div>
                  <Label htmlFor="edit-level">Violation Level<span className="text-red-500">*</span></Label>
                  <Select
                    value={editLevel}
                    onValueChange={(value) => setEditLevel(value)}
                  >
                    <SelectTrigger className="mt-2 border-slate-300 ">
                      <SelectValue placeholder="Choose violation level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINOR">MINOR</SelectItem>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                      <SelectItem value="MAJOR">MAJOR</SelectItem>
                      <SelectItem value="SEVERE">SEVERE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rule-desc">Description</Label>
                  <Textarea id="rule-desc" className="mt-2 border-slate-300" value={editDescription}
                    onChange={(e) => setEditDescription((e.target as HTMLTextAreaElement).value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-points">Penalty Points<span className="text-red-500">*</span></Label>
                    <Input
                      id="rule-points"
                      className="mt-2 border-slate-300"
                      type="text" // Đã đổi sang text
                      inputMode="numeric" // Gợi ý bàn phím số
                      placeholder="0"
                      // Hiển thị giá trị có dấu phẩy
                      value={new Intl.NumberFormat('en-US').format(editPenaltyPoints)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const unformattedValue = value.replace(/[^0-9]/g, ''); // Xóa dấu phẩy và ký tự không phải số
                        setEditPenaltyPoints(parseInt(unformattedValue, 10) || 0); // Đảm bảo giá trị là 0 nếu rỗng
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Rule Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Penalty Rule</DialogTitle>
                {/* <DialogDescription>Enter rule details and press Create.</DialogDescription> */}
              </DialogHeader>

              <div className="mt-2 space-y-3">
                <div>
                  <Label htmlFor="create-rule-name">Rule Name<span className="text-red-500">*</span></Label>
                  <Input id="create-rule-name" className="mt-2 border-slate-300" value={createName}
                    onChange={(e) => setCreateName((e.target as HTMLInputElement).value)} />
                </div>

                <div>
                  <Label htmlFor="create-level">Violation Level<span className="text-red-500">*</span></Label>
                  <Select
                    value={createLevel}
                    onValueChange={(value) => setCreateLevel(value)}
                  >
                    <SelectTrigger className="mt-2 border-slate-300">
                      <SelectValue placeholder="Choose violation level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINOR">MINOR</SelectItem>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                      <SelectItem value="MAJOR">MAJOR</SelectItem>
                      <SelectItem value="SEVERE">SEVERE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="create-desc">Description</Label>
                  <Textarea id="create-desc" className="mt-2 border-slate-300" value={createDescription}
                    onChange={(e) => setCreateDescription((e.target as HTMLTextAreaElement).value)} />
                </div>

                <div>
                  <Label htmlFor="create-points">Penalty Points<span className="text-red-500">*</span></Label>
                  <Input
                    id="create-points"
                    className="mt-2 border-slate-300"
                    type="text" // Đã đổi sang text
                    inputMode="numeric" // Gợi ý bàn phím số
                    placeholder="0"
                    // Hiển thị giá trị có dấu phẩy
                    value={new Intl.NumberFormat('en-US').format(createPenaltyPoints)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const unformattedValue = value.replace(/[^0-9]/g, ''); // Xóa dấu phẩy và ký tự không phải số
                      setCreatePenaltyPoints(parseInt(unformattedValue, 10) || 0); // Đảm bảo giá trị là 0 nếu rỗng
                    }}
                  />
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>

                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}