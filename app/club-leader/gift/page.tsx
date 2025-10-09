"use client"

import type React from "react"

import { useState } from "react"
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

// Mock data for club products
const clubProducts = [
  { id: "cp1", name: "Club T-Shirt", description: "Official club merchandise with logo", price: 25, stock: 50, category: "merchandise", image: "/club-tshirt.jpg" },
  { id: "cp2", name: "Club Hoodie", description: "Premium quality hoodie with embroidered logo", price: 45, stock: 30, category: "merchandise", image: "/club-hoodie.jpg" },
  { id: "cp3", name: "Club Mug", description: "Ceramic mug with club design", price: 15, stock: 100, category: "accessories", image: "/club-mug.jpg" },
  { id: "cp4", name: "Club Stickers Pack", description: "Set of 10 vinyl stickers", price: 8, stock: 200, category: "accessories", image: "/club-stickers.jpg" },
]

// Mock data for event products
const eventProducts = [
  { id: "ep1", name: "Spring Festival Poster", description: "Limited edition poster from Spring Festival 2024", price: 20, stock: 25, eventName: "Spring Festival 2024", eventDate: "2024-04-15", status: "coming_soon", saleStart: "2024-03-01", saleEnd: "2024-04-20", image: "/spring-festival-poster.jpg" },
  { id: "ep2", name: "Tech Conference Badge", description: "Commemorative badge from Tech Conference", price: 12, stock: 0, eventName: "Tech Conference 2024", eventDate: "2024-03-10", status: "now", saleStart: "2024-02-01", saleEnd: "2024-03-15", image: "/tech-conference-badge.jpg" },
  { id: "ep3", name: "Music Night Vinyl", description: "Special vinyl record from Music Night event", price: 35, stock: 15, eventName: "Music Night 2024", eventDate: "2024-02-20", status: "now", saleStart: "2024-01-15", saleEnd: "2024-03-01", image: "/music-vinyl-record.jpg" },
  { id: "ep4", name: "Art Exhibition Catalog", description: "Printed catalog from Art Exhibition", price: 18, stock: 5, eventName: "Art Exhibition 2023", eventDate: "2023-12-15", status: "finish", saleStart: "2023-11-01", saleEnd: "2024-01-15", image: "/art-exhibition-catalog.jpg" },
  { id: "ep5", name: "Sports Day Medal", description: "Participation medal from Sports Day", price: 22, stock: 0, eventName: "Sports Day 2023", eventDate: "2023-11-20", status: "finish", saleStart: "2023-10-01", saleEnd: "2023-12-31", image: "/sports-medal.jpg" },
]

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
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("club")
  const [eventFilter, setEventFilter] = useState("all")

  // Filtered data
  const filteredClubProducts = clubProducts.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredEventProducts = eventProducts.filter((p) => {
    const matches = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.eventName.toLowerCase().includes(searchTerm.toLowerCase())
    if (eventFilter === "all") return matches
    return matches && p.status === eventFilter
  })

  // Pagination hooks
  const { currentPage: clubPage, totalPages: clubPages, paginatedData: paginatedClub, setCurrentPage: setClubPage } = usePagination({ data: filteredClubProducts, initialPageSize: 3 })
  const { currentPage: eventPage, totalPages: eventPages, paginatedData: paginatedEvent, setCurrentPage: setEventPage } = usePagination({ data: filteredEventProducts, initialPageSize: 3 })

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gift Products</h1>
            <p className="text-muted-foreground">Manage club merchandise and event-related products</p>
          </div>

          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="club" className="flex items-center gap-2"><Package className="h-4 w-4" /> Club</TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Event</TabsTrigger>
            </TabsList>

            {/* CLUB with pagination */}
            <TabsContent value="club" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedClub.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No club products found</h3>
                  </div>
                ) : (
                  paginatedClub.map((p) => (
                    <Card key={p.id} className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                          <img src={p.image || "/placeholder.svg"} alt={p.name} className="object-cover w-full h-full" />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm truncate">{p.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2">{p.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="capitalize text-[10px] max-w-[6rem] truncate">{p.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2 flex flex-col gap-2 grow">
                        <div className="flex items-center justify-between text-xs"><span className="font-semibold">${p.price}</span><span className="text-muted-foreground">Stock: {p.stock}</span></div>
                        <Button className="w-full bg-transparent" variant="outline" size="sm"><Package className="h-3 w-3 mr-2" />Redeem</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <MinimalPager current={clubPage} total={clubPages} onPrev={() => setClubPage(clubPage - 1)} onNext={() => setClubPage(clubPage + 1)} />
            </TabsContent>

            {/* EVENT with pagination */}
            <TabsContent value="event" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedEvent.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No event products found</h3>
                  </div>
                ) : (
                  paginatedEvent.map((p) => (
                    <Card key={p.id} className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                          <StatusBadge status={p.status} />
                          <img src={p.image || "/placeholder.svg"} alt={p.name} className="object-cover w-full h-full" />
                        </div>
                        <div className="min-w-0"><CardTitle className="text-sm truncate">{p.name}</CardTitle><CardDescription className="mt-1 text-xs line-clamp-2">{p.description}</CardDescription></div>
                      </CardHeader>
                      <CardContent className="pt-2 flex flex-col gap-2 grow">
                        <div className="text-[11px] space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Event</span><span>{p.eventName}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(p.eventDate)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Sale</span><span>{formatDate(p.saleStart)} - {formatDate(p.saleEnd)}</span></div>
                        </div>
                        <div className="flex justify-between text-xs"><span className="font-semibold">${p.price}</span><span className="text-muted-foreground">Stock: {p.stock}</span></div>
                        <Button className="w-full bg-transparent" variant="outline" size="sm"><Gift className="h-3 w-3 mr-2" />Redeem</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <MinimalPager current={eventPage} total={eventPages} onPrev={() => setEventPage(eventPage - 1)} onNext={() => setEventPage(eventPage + 1)} />
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
