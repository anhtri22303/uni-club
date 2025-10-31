"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getTags, postTag, deleteTag, Tag } from "@/service/tagApi"
import { Search, Tag as TagIcon, Package, Award, Gift, Sparkles, TrendingUp, Calendar, Users, Shirt, Star, Plus, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Tag categories for better organization
const tagCategories = {
  "Product Type": ["event", "club", "reward", "gift", "voucher", "souvenir", "collectible"],
  "Status": ["new", "hot", "trending", "favorite", "best_seller", "exclusive", "limited", "limited_time"],
  "Physical Items": ["shirt", "cap", "bottle", "bag", "sticker", "badge", "lanyard", "poster", "physical"],
  "Event Theme": ["festival", "music", "sport", "tech", "volunteer", "art", "catday", "green_day", "innovation", "anniversary"],
  "Access Level": ["member", "public", "vip", "guest", "staff", "leader_reward", "participant", "winner"],
  "Partnership": ["sponsor", "collab", "campaign", "promo", "brand_partner", "donation"],
  "Attributes": ["premium", "durable", "handmade", "lightweight", "useful", "decorative"],
  "Season": ["spring", "summer", "autumn", "winter", "newyear", "midautumn", "christmas", "year_end", "orientation"]
}

// Tag icon mapping
const getTagIcon = (tagName: string) => {
  if (["event", "festival", "anniversary", "orientation"].includes(tagName)) return Calendar
  if (["club", "member", "staff", "leader_reward"].includes(tagName)) return Users
  if (["shirt", "cap", "bottle", "bag", "physical"].includes(tagName)) return Shirt
  if (["gift", "reward", "voucher"].includes(tagName)) return Gift
  if (["new", "hot", "trending", "exclusive"].includes(tagName)) return Sparkles
  if (["best_seller", "favorite", "premium"].includes(tagName)) return Star
  if (["winner", "participant", "vip"].includes(tagName)) return Award
  return TagIcon
}

// Tag color mapping
const getTagColor = (tagName: string): string => {
  // Status tags
  if (tagName === "new") return "bg-emerald-100 text-emerald-700 border-emerald-300"
  if (tagName === "hot") return "bg-red-100 text-red-700 border-red-300"
  if (tagName === "trending") return "bg-orange-100 text-orange-700 border-orange-300"
  if (tagName === "favorite") return "bg-pink-100 text-pink-700 border-pink-300"
  if (tagName === "best_seller") return "bg-purple-100 text-purple-700 border-purple-300"
  if (tagName === "exclusive") return "bg-indigo-100 text-indigo-700 border-indigo-300"
  if (tagName === "limited" || tagName === "limited_time") return "bg-yellow-100 text-yellow-700 border-yellow-300"
  
  // Product types
  if (["event", "club", "reward"].includes(tagName)) return "bg-blue-100 text-blue-700 border-blue-300"
  if (["gift", "voucher", "souvenir", "collectible"].includes(tagName)) return "bg-cyan-100 text-cyan-700 border-cyan-300"
  
  // Physical items
  if (["shirt", "cap", "bottle", "bag", "sticker", "badge", "lanyard", "poster", "physical"].includes(tagName)) {
    return "bg-slate-100 text-slate-700 border-slate-300"
  }
  
  // Event themes
  if (["festival", "music", "sport", "tech", "volunteer", "art"].includes(tagName)) {
    return "bg-violet-100 text-violet-700 border-violet-300"
  }
  if (["catday", "green_day", "innovation", "anniversary"].includes(tagName)) {
    return "bg-teal-100 text-teal-700 border-teal-300"
  }
  
  // Access levels
  if (["member", "public", "guest", "staff"].includes(tagName)) {
    return "bg-gray-100 text-gray-700 border-gray-300"
  }
  if (["vip", "leader_reward", "winner"].includes(tagName)) {
    return "bg-amber-100 text-amber-700 border-amber-300"
  }
  if (tagName === "participant") return "bg-lime-100 text-lime-700 border-lime-300"
  
  // Partnership
  if (["sponsor", "collab", "campaign", "promo", "brand_partner", "donation"].includes(tagName)) {
    return "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300"
  }
  
  // Attributes
  if (["premium", "durable", "handmade"].includes(tagName)) {
    return "bg-rose-100 text-rose-700 border-rose-300"
  }
  if (["lightweight", "useful", "decorative"].includes(tagName)) {
    return "bg-sky-100 text-sky-700 border-sky-300"
  }
  
  // Seasons
  if (tagName === "spring") return "bg-green-100 text-green-700 border-green-300"
  if (tagName === "summer") return "bg-yellow-100 text-yellow-700 border-yellow-300"
  if (tagName === "autumn") return "bg-orange-100 text-orange-700 border-orange-300"
  if (tagName === "winter") return "bg-blue-100 text-blue-700 border-blue-300"
  if (["newyear", "midautumn", "christmas", "year_end"].includes(tagName)) {
    return "bg-red-100 text-red-700 border-red-300"
  }
  
  // Default
  return "bg-gray-100 text-gray-700 border-gray-300"
}

export default function AdminTagsPage() {
  const { toast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [newTagName, setNewTagName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null)

  const fetchTags = async () => {
    try {
      setLoading(true)
      const data = await getTags()
      setTags(data)
    } catch (error) {
      console.error("Failed to fetch tags:", error)
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [toast])

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Validation Error",
        description: "Tag name cannot be empty",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)
      const newTag = await postTag(newTagName.trim())
      
      // Add the new tag to the list
      setTags(prevTags => [...prevTags, newTag])
      
      // Clear the input
      setNewTagName("")
      
      // Show success message
      toast({
        title: "Success",
        description: `Tag "${newTag.name}" created successfully`,
      })
    } catch (error: any) {
      console.error("Failed to create tag:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create tag",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTag = async (tagId: number, tagName: string) => {
    try {
      setDeletingTagId(tagId)
      await deleteTag(tagId)
      
      // Remove the tag from the list
      setTags(prevTags => prevTags.filter(tag => tag.tagId !== tagId))
      
      // Show success message
      toast({
        title: "Success",
        description: `Tag "${tagName}" deleted successfully`,
      })
    } catch (error: any) {
      console.error("Failed to delete tag:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete tag",
        variant: "destructive"
      })
    } finally {
      setDeletingTagId(null)
    }
  }

  // Filter tags by search query
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.tagId.toString().includes(searchQuery)
  )

  // Group tags by category
  const groupedTags = Object.entries(tagCategories).map(([category, tagNames]) => {
    const categoryTags = filteredTags.filter(tag => tagNames.includes(tag.name))
    return { category, tags: categoryTags }
  }).filter(group => group.tags.length > 0)

  // Uncategorized tags
  const categorizedTagNames = Object.values(tagCategories).flat()
  const uncategorizedTags = filteredTags.filter(tag => !categorizedTagNames.includes(tag.name))

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Tag Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
              View and manage product tags for classification and filtering
            </p>
          </div>

          {/* Stats Card */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate">Total Tags</CardTitle>
                <TagIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{tags.length}</div>
                <p className="text-xs text-muted-foreground truncate">
                  Available for products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate">Categories</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{Object.keys(tagCategories).length}</div>
                <p className="text-xs text-muted-foreground truncate">
                  Tag categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate">Filtered Results</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{filteredTags.length}</div>
                <p className="text-xs text-muted-foreground truncate">
                  Matching tags
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Create Tag Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl truncate">Create New Tag</CardTitle>
              <CardDescription className="text-sm truncate">Add a new tag to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCreating) {
                      handleCreateTag()
                    }
                  }}
                  disabled={isCreating}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCreateTag}
                  disabled={isCreating || !newTagName.trim()}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl truncate">Search Tags</CardTitle>
              <CardDescription className="text-sm truncate">Filter tags by name or ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by tag name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[...Array(20)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags by Category */}
          {!loading && groupedTags.map(({ category, tags: categoryTags }) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Package className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{category}</span>
                </CardTitle>
                <CardDescription className="text-sm truncate">
                  {categoryTags.length} tag{categoryTags.length !== 1 ? "s" : ""} in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag) => {
                    const Icon = getTagIcon(tag.name)
                    const isDeleting = deletingTagId === tag.tagId
                    return (
                      <Badge
                        key={tag.tagId}
                        variant="outline"
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${getTagColor(tag.name)} ${isDeleting ? 'opacity-50' : 'hover:pr-8'} max-w-full`}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{tag.name}</span>
                        <span className="ml-1 text-xs opacity-70 flex-shrink-0">#{tag.tagId}</span>
                        <button
                          onClick={() => handleDeleteTag(tag.tagId, tag.name)}
                          disabled={isDeleting}
                          className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded-sm flex-shrink-0"
                          title="Delete tag"
                        >
                          <X className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Uncategorized Tags */}
          {!loading && uncategorizedTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <TagIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Other Tags</span>
                </CardTitle>
                <CardDescription className="text-sm truncate">
                  {uncategorizedTags.length} uncategorized tag{uncategorizedTags.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {uncategorizedTags.map((tag) => {
                    const Icon = getTagIcon(tag.name)
                    const isDeleting = deletingTagId === tag.tagId
                    return (
                      <Badge
                        key={tag.tagId}
                        variant="outline"
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${getTagColor(tag.name)} ${isDeleting ? 'opacity-50' : 'hover:pr-8'} max-w-full`}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{tag.name}</span>
                        <span className="ml-1 text-xs opacity-70 flex-shrink-0">#{tag.tagId}</span>
                        <button
                          onClick={() => handleDeleteTag(tag.tagId, tag.name)}
                          disabled={isDeleting}
                          className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded-sm flex-shrink-0"
                          title="Delete tag"
                        >
                          <X className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {!loading && filteredTags.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tags found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search query
                </p>
              </CardContent>
            </Card>
          )}

          {/* All Tags List (for reference) */}
          {!loading && !searchQuery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl truncate">All Tags (Alphabetical)</CardTitle>
                <CardDescription className="text-sm truncate">Complete list of {tags.length} tags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => {
                    const Icon = getTagIcon(tag.name)
                    return (
                      <div
                        key={tag.tagId}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${getTagColor(tag.name)}`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{tag.name}</div>
                          <div className="text-xs opacity-70 truncate">ID: {tag.tagId}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

