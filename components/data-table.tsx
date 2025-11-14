"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useState } from "react"
import { Filter, X } from "lucide-react"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
}

interface FilterOption {
  key: string
  label: string
  type: "select" | "range" | "date"
  options?: { value: string; label: string }[]
  min?: number
  max?: number
}

interface DataTableProps<T> {
  title?: string
  data: T[]
  columns: Column<T>[]
  searchKey?: keyof T
  searchPlaceholder?: string
  filters?: FilterOption[]
  enablePagination?: boolean
  initialPageSize?: number
  pageSizeOptions?: number[]
}

export function DataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search...",
  filters = [],
  enablePagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)

  const filteredData = data.filter((item) => {
    // Search filter
    if (searchKey && searchTerm) {
      const searchValue = String(item[searchKey]).toLowerCase()
      if (!searchValue.includes(searchTerm.toLowerCase())) {
        return false
      }
    }

    // Advanced filters
    for (const [filterKey, filterValue] of Object.entries(activeFilters)) {
      if (!filterValue) continue

      const filter = filters.find((f) => f.key === filterKey)
      if (!filter) continue

      const itemValue = item[filterKey]

      if (filter.type === "select") {
        if (filterValue !== "all" && itemValue !== filterValue) {
          return false
        }
      } else if (filter.type === "range") {
        const [min, max] = filterValue.split("-").map(Number)
        const numValue = Number(itemValue)
        if (min !== undefined && numValue < min) return false
        if (max !== undefined && numValue > max) return false
      } else if (filter.type === "date") {
        // Simple date filtering - can be enhanced for date ranges
        const itemDate = new Date(itemValue).toDateString()
        const filterDate = new Date(filterValue).toDateString()
        if (itemDate !== filterDate) return false
      }
    }

    return true
  })

  const { currentPage, pageSize, totalPages, totalItems, paginatedData, setCurrentPage, setPageSize } = usePagination({
    data: filteredData,
    initialPageSize,
  })

  const displayData = enablePagination ? paginatedData : filteredData

  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
    if (enablePagination) {
      setCurrentPage(1)
    }
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
    if (enablePagination) {
      setCurrentPage(1)
    }
  }

  const hasActiveFilters = Object.values(activeFilters).some((value) => value && value !== "all") || searchTerm

  return (
    <Card>
      {title && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {filters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {Object.values(activeFilters).filter((v) => v && v !== "all").length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {searchKey && (
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (enablePagination) {
                    setCurrentPage(1)
                  }
                }}
                className="max-w-sm"
              />
            )}

            {showFilters && filters.length > 0 && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                {/* <div className="flex items-center justify-between"> */}
                {/* <h4 className="text-sm font-medium">Filters</h4> */}
                {/* {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div> */}
                
                {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"> */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-3">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>

                      {filter.type === "select" && filter.options && (
                        <Select
                          value={activeFilters[filter.key] || "all"}
                          onValueChange={(value) => handleFilterChange(filter.key, value)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {filter.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {filter.type === "range" && (
                        <Select
                          value={activeFilters[filter.key] || "all"}
                          onValueChange={(value) => handleFilterChange(filter.key, value)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="0-10">0-10</SelectItem>
                            <SelectItem value="11-50">11-50</SelectItem>
                            <SelectItem value="51-100">51-100</SelectItem>
                            <SelectItem value="101-999">100+</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {filter.type === "date" && (
                        <Input
                          type="date"
                          value={activeFilters[filter.key] || ""}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs bg-white">
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? "No results match your filters" : "No data available"}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {enablePagination && filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={pageSizeOptions}
          />
        )}
      </CardContent>
    </Card>
  )
}
