"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Policy, deletePolicyById, updatePolicyById, createPolicy } from "@/service/policyApi"
import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, Search, Eye, Trash, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { usePolicies } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

export default function UniStaffPoliciesPage() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Policy | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // ✅ USE REACT QUERY for policies
  const { data: policies = [], isLoading: loading } = usePolicies()

  // edit form state for policy detail modal
  const [editPolicyName, setEditPolicyName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editMajorId, setEditMajorId] = useState<number | undefined>(undefined)
  const [editMajorName, setEditMajorName] = useState<string | undefined>(undefined)
  const [editMaxClubJoin, setEditMaxClubJoin] = useState<number | undefined>(undefined)
  // const [editRewardMultiplier, setEditRewardMultiplier] = useState<number | undefined>(undefined)
  const [editActive, setEditActive] = useState<boolean>(true)
  const [saving, setSaving] = useState(false)

  // create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [createPolicyName, setCreatePolicyName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createMajorId, setCreateMajorId] = useState<number | undefined>(undefined)
  const [createMajorName, setCreateMajorName] = useState<string | undefined>(undefined)
  const [createMaxClubJoin, setCreateMaxClubJoin] = useState<number | undefined>(undefined)
  // const [createRewardMultiplier, setCreateRewardMultiplier] = useState<number | undefined>(undefined)
  const [creating, setCreating] = useState(false)

  const reloadPolicies = () => {
    queryClient.invalidateQueries({ queryKey: ["policies"] })
  }

  const filtered = useMemo(() => {
    if (!query) return policies
    const q = query.toLowerCase()
    return policies.filter((p) =>
      (p.policyName || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.majorName || "").toLowerCase().includes(q))
  }, [policies, query])

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

  const openDetail = (p: Policy) => {
    setSelected(p)
    // populate edit fields
    setEditPolicyName(p.policyName || "")
    setEditDescription(p.description || "")
    // if backend uses policy id as majorId, default to policy id when majorId is missing
    setEditMajorId(p.majorId ?? p.id ?? undefined)
    setEditMajorName(p.majorName)
    setEditMaxClubJoin(p.maxClubJoin ?? undefined)
    // setEditRewardMultiplier(p.rewardMultiplier ?? undefined)
    setEditActive(p.active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      // only send the minimal body required by backend
      // const payload = {
      //   policyName: editPolicyName,
      //   description: editDescription,
      //   // ensure majorId is present; default to the policy id when editMajorId is empty
      //   majorId: editMajorId ?? selected.id,
      //   maxClubJoin: editMaxClubJoin,
      //   rewardMultiplier: editRewardMultiplier,
      // }
      const payload: Partial<Policy> = {
        policyName: editPolicyName,
        description: editDescription,
        // Giữ lại logic cũ của bạn (?? selected.id)
        majorId: editMajorId ?? selected.id,
        majorName: editMajorName, // Gửi cả majorName nếu có
        maxClubJoin: editMaxClubJoin,
        active: editActive, // Thêm 'active'
      }

      // const res: any = await updatePolicyById(selected.id, payload)
      // if (res && (res.success || res.updated || res.data)) {
      //   toast({ title: (res && res.message) || 'Cập nhật thành công', description: '' })
      //   // update local selected so modal reflects saved values
      //   const updated = (res && res.data) ? res.data : { ...selected, ...payload }
      //   setSelected(updated as Policy)
      //   // refresh list with React Query
      //   reloadPolicies()
      // } else {
      //   toast({ title: 'Thất bại', description: (res && res.message) || 'Cập nhật policy thất bại.' })
      // }
      // [MODIFIED] updatePolicyById giờ trả về Policy
      const res: Policy = await updatePolicyById(selected.id, payload)

      // Nếu 'await' thành công (không ném lỗi), thì đã cập nhật
      toast({ title: "Cập nhật thành công", description: `Đã cập nhật policy: ${res.policyName}` })

      // update local selected so modal reflects saved values
      setSelected(res) // Cập nhật state với dữ liệu mới từ server

      // refresh list with React Query
      reloadPolicies()
    } catch (err) {
      console.error('Update policy failed:', err)
      toast({ title: 'Lỗi', description: 'Có lỗi khi cập nhật policy.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Policy Management</h1>
              <p className="text-muted-foreground">View and manage all policies</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 h-full">
                  <CardContent className="p-2 h-full flex flex-col justify-center">
                    <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">Total Policies</div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-500 rounded-md">
                        <FileText className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-blue-900 dark:text-blue-100">{policies.length}</div>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">Policies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search policies"
                  value={query}
                  onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                  className="max-w-sm bg-white dark:bg-slate-800 rounded-md px-3 py-2 shadow-sm border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button onClick={() => { setQuery("") }} variant="ghost">Clear</Button>
                <Button size="sm" className="ml-2" onClick={() => setCreateOpen(true)} title="Create policy">
                  Create policy
                  <Plus className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Policy List</CardTitle>
              <CardDescription>Showing {filtered.length} of {policies.length} policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[3rem] text-center">ID</TableHead>
                        <TableHead>Policy Name</TableHead>
                        <TableHead>Major</TableHead>
                        <TableHead className="w-[9rem] text-center">Max Club Join</TableHead>
                        <TableHead className="w-[8rem] text-center">Status</TableHead>
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
                          <TableCell colSpan={6} className="p-6 text-center">No policies found</TableCell>
                        </TableRow>
                      ) : (
                        paginated.map((p, idx) => (
                          <TableRow
                            key={p.id}
                            className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'} hover:bg-slate-100 dark:hover:bg-slate-700`}
                          >
                            <TableCell className="text-sm text-muted-foreground text-center">{p.id}</TableCell>
                            <TableCell className="font-medium text-primary/90">{p.policyName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.majorName || "—"}</TableCell>
                            <TableCell className="text-sm text-center">{p.maxClubJoin ?? "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={p.active ? "default" : "destructive"}>{p.active ? "Active" : "Inactive"}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-center">
                                <Button size="sm" onClick={() => openDetail(p)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    const ok = confirm('Xác nhận xóa policy này?')
                                    if (!ok) return
                                    try {
                                      const res: any = await deletePolicyById(p.id)
                                      if (res && (res.success === true || res.deleted)) {
                                        toast({ title: res.message || 'Đã xóa', description: '' })
                                        if (selected?.id === p.id) setDialogOpen(false)
                                        await reloadPolicies()
                                        try { router.refresh() } catch (e) { /* ignore */ }
                                      } else {
                                        toast({ title: 'Thất bại', description: (res && res.message) || 'Xóa policy thất bại.' })
                                      }
                                    } catch (err) {
                                      console.error('Delete policy failed:', err)
                                      toast({ title: 'Lỗi', description: 'Có lỗi khi xóa policy.' })
                                    }
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
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
                    <div>policies</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
                    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                    <div className="px-2 text-sm">Page {filtered.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</div>
                    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)))} disabled={(page + 1) * pageSize >= filtered.length}>Next</Button>
                    <Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, Math.ceil(filtered.length / pageSize) - 1))} disabled={(page + 1) * pageSize >= filtered.length}>Last</Button>
                    <select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(0) }}>
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
                <DialogTitle>Policy Detail / Edit</DialogTitle>
                <DialogDescription>Modify policy fields and press Save to persist changes.</DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-3">
                <div>
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input id="policy-name" className="mt-2 border-slate-300" value={editPolicyName} onChange={(e) => setEditPolicyName((e.target as HTMLInputElement).value)} />
                </div>

                <div>
                  <Label htmlFor="policy-major">Major Name</Label>
                  <Input id="policy-major" className="mt-2 border-slate-300" value={editMajorName || ''} onChange={(e) => setEditMajorName((e.target as HTMLInputElement).value || undefined)} />
                </div>

                <div>
                  <Label htmlFor="policy-major-id">Major ID</Label>
                  <Input id="policy-major-id" className="mt-2 border-slate-300" type="number" value={editMajorId ?? ''} onChange={(e) => setEditMajorId(e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>

                <div>
                  <Label htmlFor="policy-desc">Description</Label>
                  <Textarea id="policy-desc" className="mt-2 border-slate-300" value={editDescription} onChange={(e) => setEditDescription((e.target as HTMLTextAreaElement).value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy-max">Max Club Join</Label>
                    <Input id="policy-max" className="mt-2 border-slate-300" type="number" value={editMaxClubJoin ?? ''} onChange={(e) => setEditMaxClubJoin(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="policy-active">Change status: </Label>
                  <input id="policy-active" title="Active" type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4" />
                  <Label htmlFor="policy-active">Active</Label>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Create Policy Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Policy</DialogTitle>
                <DialogDescription>Enter policy details and press Create.</DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-3">
                <div>
                  <Label htmlFor="create-policy-name">Policy Name</Label>
                  <Input id="create-policy-name" value={createPolicyName} onChange={(e) => setCreatePolicyName((e.target as HTMLInputElement).value)} />
                </div>
                <div>
                  <Label htmlFor="create-desc">Description</Label>
                  <Textarea id="create-desc" value={createDescription} onChange={(e) => setCreateDescription((e.target as HTMLTextAreaElement).value)} />
                </div>
                <div>
                  <Label htmlFor="create-major-id">Major ID</Label>
                  <Input id="create-major-id" type="number" value={createMajorId ?? ''} onChange={(e) => setCreateMajorId(e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-max">Max Club Join</Label>
                    <Input id="create-max" type="number" value={createMaxClubJoin ?? ''} onChange={(e) => setCreateMaxClubJoin(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </div>
                  {/* <div>
                    <Label htmlFor="create-reward">Reward Multiplier</Label>
                    <Input id="create-reward" type="number" value={createRewardMultiplier ?? ''} onChange={(e) => setCreateRewardMultiplier(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </div> */}
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    setCreating(true)
                    try {

                      // [MODIFIED] Cập nhật payload
                      const payload: Partial<Policy> = {
                        policyName: createPolicyName,
                        description: createDescription,
                        majorId: createMajorId,
                        maxClubJoin: createMaxClubJoin,
                        active: true, // Mặc định là active khi tạo mới (theo Swagger)
                      }

                      // [MODIFIED] createPolicy giờ trả về Policy
                      const res: Policy = await createPolicy(payload)

                      // Nếu 'await' thành công, 'res' là policy mới
                      toast({ title: "Tạo thành công", description: `Đã tạo policy: ${res.policyName}` })
                      setCreateOpen(false)
                      // reset fields
                      setCreatePolicyName("")
                      setCreateDescription("")
                      setCreateMajorId(undefined)
                      setCreateMaxClubJoin(undefined)
                      // reload list
                      await reloadPolicies()
                    } catch (err) {
                      console.error('Create policy failed:', err)
                      toast({ title: 'Lỗi', description: 'Có lỗi khi tạo policy.' })
                    } finally {
                      setCreating(false)
                    }
                  }} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
