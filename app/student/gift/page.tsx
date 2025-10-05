"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, Package, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

// ========== DATA (points thay vì dollars) ==========
const clubProducts = [
  {
    id: "cp1",
    name: "Club T-Shirt",
    description: "Official club merchandise with logo",
    price: 500,
    stock: 50,
    category: "merchandise",
    image: "/club-tshirt.jpg",
  },
  {
    id: "cp2",
    name: "Club Hoodie",
    description: "Premium quality hoodie with embroidered logo",
    price: 900,
    stock: 30,
    category: "merchandise",
    image: "/club-hoodie.jpg",
  },
  {
    id: "cp3",
    name: "Club Mug",
    description: "Ceramic mug with club design",
    price: 300,
    stock: 100,
    category: "accessories",
    image: "/club-mug.jpg",
  },
  {
    id: "cp4",
    name: "Club Stickers Pack",
    description: "Set of 10 vinyl stickers",
    price: 150,
    stock: 200,
    category: "accessories",
    image: "/club-stickers.jpg",
  },
]

const eventProducts = [
  {
    id: "ep2",
    name: "Tech Conference Badge",
    description: "Commemorative badge from Tech Conference",
    price: 250,
    stock: 0,
    eventName: "Tech Conference 2024",
    eventDate: "2024-03-10",
    saleStart: "2024-02-01",
    saleEnd: "2024-03-15",
    image: "/tech-conference-badge.jpg",
  },
  {
    id: "ep3",
    name: "Music Night Vinyl",
    description: "Special vinyl record from Music Night event",
    price: 700,
    stock: 15,
    eventName: "Music Night 2024",
    eventDate: "2024-02-20",
    saleStart: "2024-01-15",
    saleEnd: "2024-03-01",
    image: "/music-vinyl-record.jpg",
  },
]

// ========== HOOK phân trang ==========
function usePagination<T>({ data, initialPageSize = 6 }: { data: T[]; initialPageSize?: number }) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = initialPageSize
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return { currentPage, totalPages, setCurrentPage, paginatedData }
}

// ========== Minimal Pager ==========
const MinimalPager = ({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) =>
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

// ========== COMPONENT ==========
export default function StudentGiftPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("club")

  const filteredClubProducts = clubProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredEventProducts = eventProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.eventName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  // pagination hooks
  const {
    currentPage: clubPage,
    totalPages: clubPages,
    setCurrentPage: setClubPage,
    paginatedData: paginatedClubs,
  } = usePagination({ data: filteredClubProducts, initialPageSize: 3 })

  const {
    currentPage: eventPage,
    totalPages: eventPages,
    setCurrentPage: setEventPage,
    paginatedData: paginatedEvents,
  } = usePagination({ data: filteredEventProducts, initialPageSize: 3 })

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gift Products</h1>
            <p className="text-muted-foreground">Browse and redeem available gift products</p>
          </div>

          <div className="flex items-center justify-between">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="club" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Club
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event
              </TabsTrigger>
            </TabsList>

            {/* CLUB */}
            <TabsContent value="club" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedClubs.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No club products found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms</p>
                  </div>
                ) : (
                  paginatedClubs.map((p) => (
                    <Card
                      key={p.id}
                      className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={p.image || "/placeholder.svg"}
                            alt={p.name}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm truncate">{p.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2">{p.description}</CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className="capitalize text-[10px] whitespace-nowrap max-w-[6rem] truncate shrink-0"
                            title={p.category}
                          >
                            {p.category}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-2 flex flex-col gap-2 grow">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold shrink-0">{p.price} point</span>
                          <span className="text-muted-foreground truncate">Stock: {p.stock}</span>
                        </div>

                        <div className="mt-auto">
                          <Button className="w-full bg-transparent" variant="outline" size="sm">
                            <Package className="h-3 w-3 mr-2" />
                            Redeem
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <MinimalPager
                current={clubPage}
                total={clubPages}
                onPrev={() => setClubPage(clubPage - 1)}
                onNext={() => setClubPage(clubPage + 1)}
              />
            </TabsContent>

            {/* EVENT */}
            <TabsContent value="event" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedEvents.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No event products found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms</p>
                  </div>
                ) : (
                  paginatedEvents.map((p) => (
                    <Card
                      key={p.id}
                      className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={p.image || "/placeholder.svg"}
                            alt={p.name}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm truncate">{p.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2">{p.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-2 flex flex-col gap-2 grow">
                        <div className="text-[11px] space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Event</span>
                            <span className="font-medium truncate min-w-0">{p.eventName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Date</span>
                            <span className="truncate min-w-0">{formatDate(p.eventDate)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Sale</span>
                            <span className="truncate min-w-0">
                              {formatDate(p.saleStart)} - {formatDate(p.saleEnd)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold shrink-0">{p.price} point</span>
                          <span className="text-muted-foreground truncate">Stock: {p.stock}</span>
                        </div>

                        <div className="mt-auto">
                          <Button className="w-full bg-transparent" variant="outline" size="sm">
                            <Gift className="h-3 w-3 mr-2" />
                            Redeem
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <MinimalPager
                current={eventPage}
                total={eventPages}
                onPrev={() => setEventPage(eventPage - 1)}
                onNext={() => setEventPage(eventPage + 1)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
