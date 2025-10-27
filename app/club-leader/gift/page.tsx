"use client"

import type React from "react"

// ...existing code...
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, Package, Calendar, Clock, CheckCircle, XCircle, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"

import { useEffect, useState } from "react"
import { getProduct, addProduct, Product } from "@/service/productApi"

// ---- Compact status badge overlay ----
const StatusBadge = ({ status }: { status: string }) => {
  const base = "truncate max-w-[7.5rem] text-xs px-2 py-1 rounded-md absolute right-2 top-2 z-10"
  if (status === "coming_soon")
    return <Badge variant="outline" className={`${base} text-blue-600 border-blue-600`}><Clock className="h-3 w-3 mr-1" />Coming Soon</Badge>
  if (status === "now")
    return <Badge variant="outline" className={`${base} text-green-600 border-green-600`}><CheckCircle className="h-3 w-3 mr-1" />Now</Badge>
  if (status === "finish")
    return <Badge variant="outline" className={`${base} text-red-600 border-red-600`}><XCircle className="h-3 w-3 mr-1" />Finished</Badge>
  return null
}

// --- Minimal Pager ---
const MinimalPager = ({ current, total, onPrev, onNext }: { current: number, total: number, onPrev: () => void, onNext: () => void }) =>
  total > 1 ? (
    <div className="flex items-center justify-center gap-3 mt-4">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[2rem] text-center text-sm font-medium">{current}</div>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  ) : null

export default function ClubLeaderGiftPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Product>({ clubId: 6, name: "", description: "", pricePoints: 0, stockQuantity: 0 })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = require("@/hooks/use-toast")

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const data = await getProduct({ page: 0, size: 100 })
        setProducts(data)
      } catch (err) {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "clubId" || name === "pricePoints" || name === "stockQuantity" ? Number(value) : value,
    }))
  }

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const res = await addProduct(form)
      if (res.success) {
        toast({ title: "Product created", description: "Product added successfully!", variant: "success" })
        setOpen(false)
        setForm({ clubId: 6, name: "", description: "", pricePoints: 0, stockQuantity: 0 })
        // reload products
        const data = await getProduct({ page: 0, size: 100 })
        setProducts(data)
      } else {
        toast({ title: "Error", description: res.message || "Failed to create product", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gift Products</h1>
            <p className="text-muted-foreground">Manage club merchandise and event-related products</p>
          </div>
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              onClick={() => {
                // Get clubId from localStorage
                if (typeof window !== "undefined") {
                  try {
                    const auth = localStorage.getItem("uniclub-auth")
                    if (auth) {
                      const parsed = JSON.parse(auth)
                      if (parsed.clubId) {
                        setForm((prev) => ({ ...prev, clubId: parsed.clubId }))
                      }
                    }
                  } catch {}
                }
                setOpen(true)
              }}
              className="bg-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 text-white border-none"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input name="clubId" type="number" value={form.clubId} disabled placeholder="Club ID" min={1} />
                <Input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" />
                <Input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
                <Input name="pricePoints" type="number" value={form.pricePoints} onChange={handleChange} placeholder="Price Points" min={0} />
                <Input name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} placeholder="Stock Quantity" min={0} />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-12">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <Card key={p.id} className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                      {/* No image field in API, use placeholder */}
                      <img src={"/placeholder.svg"} alt={p.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">{p.name}</CardTitle>
                        <CardDescription className="mt-1 text-xs line-clamp-2">{p.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px] max-w-[6rem] truncate">Club ID: {p.clubId}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 flex flex-col gap-2 grow">
                    <div className="flex items-center justify-between text-xs"><span className="font-semibold">{p.pricePoints} pts</span><span className="text-muted-foreground">Stock: {p.stockQuantity}</span></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
