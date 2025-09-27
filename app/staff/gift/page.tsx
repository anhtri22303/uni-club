"use client"

import type React from "react"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
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
import { Gift, Package, Calendar, Clock, CheckCircle, XCircle, Plus } from "lucide-react"

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
    id: "ep1",
    name: "Spring Festival Poster",
    description: "Limited edition poster from Spring Festival 2024",
    price: 400,
    stock: 25,
    eventName: "Spring Festival 2024",
    eventDate: "2024-04-15",
    status: "coming_soon",
    saleStart: "2024-03-01",
    saleEnd: "2024-04-20",
    image: "/spring-festival-poster.jpg",
  },
  {
    id: "ep2",
    name: "Tech Conference Badge",
    description: "Commemorative badge from Tech Conference",
    price: 250,
    stock: 0,
    eventName: "Tech Conference 2024",
    eventDate: "2024-03-10",
    status: "now",
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
    status: "now",
    saleStart: "2024-01-15",
    saleEnd: "2024-03-01",
    image: "/music-vinyl-record.jpg",
  },
  {
    id: "ep4",
    name: "Art Exhibition Catalog",
    description: "Printed catalog from Art Exhibition",
    price: 350,
    stock: 5,
    eventName: "Art Exhibition 2023",
    eventDate: "2023-12-15",
    status: "finish",
    saleStart: "2023-11-01",
    saleEnd: "2024-01-15",
    image: "/art-exhibition-catalog.jpg",
  },
  {
    id: "ep5",
    name: "Sports Day Medal",
    description: "Participation medal from Sports Day",
    price: 450,
    stock: 0,
    eventName: "Sports Day 2023",
    eventDate: "2023-11-20",
    status: "finish",
    saleStart: "2023-10-01",
    saleEnd: "2023-12-31",
    image: "/sports-medal.jpg",
  },
]

// ---- Compact status badge overlay (chống tràn, nằm trong ảnh) ----
const StatusBadge = ({ status }: { status: string }) => {
  const base = "absolute right-2 top-2 z-10 truncate max-w-[7.5rem] text-xs px-2 py-1 rounded-md"
  if (status === "coming_soon")
    return (
      <Badge variant="outline" className={`${base} text-blue-600 border-blue-600`}>
        <Clock className="h-3 w-3 mr-1" /> Coming Soon
      </Badge>
    )
  if (status === "now")
    return (
      <Badge variant="outline" className={`${base} text-green-600 border-green-600`}>
        <CheckCircle className="h-3 w-3 mr-1" /> Now
      </Badge>
    )
  if (status === "finish")
    return (
      <Badge variant="outline" className={`${base} text-red-600 border-red-600`}>
        <XCircle className="h-3 w-3 mr-1" /> Finished
      </Badge>
    )
  return null
}

export default function StaffGiftPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("club")
  const [eventFilter, setEventFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    eventName: "",
    eventDate: "",
    saleStart: "",
    saleEnd: "",
    status: "coming_soon",
  })

  const filteredClubProducts = clubProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredEventProducts = eventProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.eventName.toLowerCase().includes(searchTerm.toLowerCase())

    if (eventFilter === "all") return matchesSearch
    return matchesSearch && product.status === eventFilter
  })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      eventName: "",
      eventDate: "",
      saleStart: "",
      saleEnd: "",
      status: "coming_soon",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating product:", formData)
    setIsModalOpen(false)
    resetForm()
  }

  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gift Products</h1>
            <p className="text-muted-foreground">View and manage gift product inventory</p>
          </div>

          <div className="flex items-center justify-between">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New {activeTab === "club" ? "Club" : "Event"} Product</DialogTitle>
                  <DialogDescription>
                    Add a new {activeTab === "club" ? "club merchandise" : "event-related"} product to the inventory.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="col-span-3"
                        rows={2}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price (Points)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stock" className="text-right">
                        Stock
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>

                    {activeTab === "club" ? (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          Category
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="merchandise">Merchandise</SelectItem>
                            <SelectItem value="accessories">Accessories</SelectItem>
                            <SelectItem value="apparel">Apparel</SelectItem>
                            <SelectItem value="collectibles">Collectibles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="eventName" className="text-right">
                            Event Name
                          </Label>
                          <Input
                            id="eventName"
                            value={formData.eventName}
                            onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="eventDate" className="text-right">
                            Event Date
                          </Label>
                          <Input
                            id="eventDate"
                            type="date"
                            value={formData.eventDate}
                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="saleStart" className="text-right">
                            Sale Start
                          </Label>
                          <Input
                            id="saleStart"
                            type="date"
                            value={formData.saleStart}
                            onChange={(e) => setFormData({ ...formData, saleStart: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="saleEnd" className="text-right">
                            Sale End
                          </Label>
                          <Input
                            id="saleEnd"
                            type="date"
                            value={formData.saleEnd}
                            onChange={(e) => setFormData({ ...formData, saleEnd: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="status" className="text-right">
                            Status
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="coming_soon">Coming Soon</SelectItem>
                              <SelectItem value="now">Now</SelectItem>
                              <SelectItem value="finish">Finished</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Product</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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

            {/* CLUB - Compact card */}
            <TabsContent value="club" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClubProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No club products found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredClubProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm truncate">{product.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2">
                              {product.description}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className="capitalize text-[10px] whitespace-nowrap max-w-[6rem] truncate shrink-0"
                            title={product.category}
                          >
                            {product.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2 flex flex-col gap-2 grow">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold shrink-0">{product.price} point</span>
                          <span className="text-muted-foreground truncate">Stock: {product.stock}</span>
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
            </TabsContent>

            {/* EVENT - Compact card, badge overlay trong ảnh */}
            <TabsContent value="event" className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={eventFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventFilter("all")}
                >
                  All Events
                </Button>
                <Button
                  variant={eventFilter === "coming_soon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventFilter("coming_soon")}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  Coming Soon
                </Button>
                <Button
                  variant={eventFilter === "now" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventFilter("now")}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Now
                </Button>
                <Button
                  variant={eventFilter === "finish" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventFilter("finish")}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Finished
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEventProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No event products found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
                  </div>
                ) : (
                  filteredEventProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                          <StatusBadge status={product.status} />
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm truncate">{product.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2">
                              {product.description}
                            </CardDescription>
                          </div>
                          {/* Không render badge bên phải để tránh tràn; overlay đã có */}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2 flex flex-col gap-2 grow">
                        <div className="text-[11px] space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Event</span>
                            <span className="font-medium truncate min-w-0">{product.eventName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Date</span>
                            <span className="truncate min-w-0">{formatDate(product.eventDate)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Sale</span>
                            <span className="truncate min-w-0">
                              {formatDate(product.saleStart)} - {formatDate(product.saleEnd)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold shrink-0">{product.price} point</span>
                          <span className="text-muted-foreground truncate">Stock: {product.stock}</span>
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
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
