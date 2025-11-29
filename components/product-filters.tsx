"use client"

// import * as React from "react"
import React from "react"
import { ArrowDownUp, ArrowUpDown, Check, ChevronDown, Filter, Flame, Sparkles, Star, Store, X, } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, } from "@/components/ui/command"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { Tag as ProductTag } from "@/service/tagApi"

// --- Định nghĩa Types ---

// Định nghĩa các tùy chọn
type FilterOption = {
    value: string
    label: string
}

// Định nghĩa trạng thái của tất cả bộ lọc (ĐÃ CẬP NHẬT)
export interface FilterState {
    inStock: boolean
    selectedTags: Set<string> // Đổi tên từ useCases, lưu trữ TÊN tag
}

// Định nghĩa trạng thái sắp xếp
export type SortState = "popular" | "hot_promo" | "price_asc" | "price_desc"

// --- Prop cho component (ĐÃ CẬP NHẬT) ---
interface ProductFiltersProps {
    availableTags: ProductTag[] // Nhận tag từ API
    onFilterChange: (filters: FilterState) => void
    onSortChange: (sort: SortState) => void
}

// --- Component con: Popover lọc đa lựa chọn ---
interface FilterPopoverProps {
    title: string
    options: FilterOption[]
    selectedValues: Set<string>
    onSelectChange: (value: string) => void
}

function FilterPopover({ title, options, selectedValues, onSelectChange }: FilterPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`border-dashed data-[state=open]:bg-accent ${selectedValues.size > 0 ? "border-primary text-primary" : ""}`}
                >
                    {title}
                    {selectedValues.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                {selectedValues.size}
                            </Badge>
                        </>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0">
                <Command>
                    <CommandInput placeholder={`Find ${title.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>Not found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => onSelectChange(option.value)}
                                    >
                                        <div
                                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                }`}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span>{option.label}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => selectedValues.forEach((val) => onSelectChange(val))} // Bỏ chọn tất cả
                                        className="justify-center text-center"
                                    >
                                        Clear filter
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// --- Component chính ---
export function ProductFilters({ onFilterChange, onSortChange, availableTags = [], }: ProductFiltersProps) {
    const [filters, setFilters] = React.useState<FilterState>({
        inStock: false,
        selectedTags: new Set(),
    })

    const [sortBy, setSortBy] = React.useState<SortState>("popular")

    // Chuyển đổi ProductTag[] từ API thành FilterOption[]
    // QUAN TRỌNG: value = tag.name, vì Product.tags là mảng string (tên)
    const tagOptions: FilterOption[] = React.useMemo(
        () =>
            availableTags.map((tag) => ({
                value: tag.name,
                label: tag.name,
            })),
        [availableTags]
    )
    // Thông báo cho component cha mỗi khi state thay đổi
    React.useEffect(() => {
        onFilterChange(filters)
    }, [filters, onFilterChange])

    React.useEffect(() => {
        onSortChange(sortBy)
    }, [sortBy, onSortChange])

    // --- Hàm xử lý ---
    // Xử lý bật/tắt filter (Sẵn hàng)
    const handleToggleChange = (key: "inStock") => (pressed: boolean) => {
        setFilters((prev) => ({ ...prev, [key]: pressed }))
    }

    // Xử lý chọn/bỏ chọn filter trong popover
    const handleMultiSelectChange = (key: "selectedTags") => (value: string) => {
        setFilters((prev) => {
            const newSet = new Set(prev[key])
            if (newSet.has(value)) {
                newSet.delete(value)
            } else {
                newSet.add(value)
            }
            return { ...prev, [key]: newSet }
        })
    }

    // Xử lý bỏ 1 tag filter
    const removeFilterTag = (key: "selectedTags", value: string) => {
        handleMultiSelectChange(key)(value)
    }

    // Xử lý bỏ tất cả filter
    const clearAllFilters = () => {
        setFilters({
            inStock: false,
            selectedTags: new Set(),
        })
    }

    // --- Tính toán phụ (ĐÃ CẬP NHẬT) ---
    const activeTags = Array.from(filters.selectedTags)
    const totalActiveFilters = (filters.inStock ? 1 : 0) + filters.selectedTags.size

    return (
        <div className="space-y-5">
            {/* 1. QUICK FILTERS & TAGS - Compact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quick Filters */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Quick Filters</h3>
                    <div className="flex flex-wrap gap-2">
                        <Toggle
                            variant="outline"
                            pressed={filters.inStock}
                            onPressedChange={handleToggleChange("inStock")}
                            className="data-[state=on]:bg-blue-50 data-[state=on]:border-blue-500 data-[state=on]:text-blue-700 dark:data-[state=on]:bg-blue-900/30 dark:data-[state=on]:text-blue-300 transition-all"
                        >
                            <Store className="mr-2 h-4 w-4" /> 
                            In Stock
                        </Toggle>
                    </div>
                </div>

                {/* Tag Filters */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Filter by Tags</h3>
                    <FilterPopover
                        title="Select Tags"
                        options={tagOptions}
                        selectedValues={filters.selectedTags}
                        onSelectChange={handleMultiSelectChange("selectedTags")}
                    />
                </div>
            </div>

            {/* 2. ACTIVE FILTERS - Show selected filters as badges */}
            {totalActiveFilters > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            Active Filters ({totalActiveFilters})
                        </span>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            onClick={clearAllFilters}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear All
                        </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.inStock && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                                <Store className="h-3 w-3 mr-1" />
                                In Stock
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-3 w-3 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                                    onClick={() => handleToggleChange("inStock")(false)}
                                >
                                    <X className="h-2.5 w-2.5" />
                                </Button>
                            </Badge>
                        )}
                        {activeTags.map((tag) => (
                            <Badge 
                                key={tag}
                                className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                            >
                                {tag}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-3 w-3 p-0 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full"
                                    onClick={() => removeFilterTag("selectedTags", tag)}
                                >
                                    <X className="h-2.5 w-2.5" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. SORT OPTIONS - Compact Toggle Group */}
            <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Sort By</h3>
                <ToggleGroup
                    type="single"
                    value={sortBy}
                    onValueChange={(value: SortState) => value && setSortBy(value)}
                    className="justify-start gap-2 flex-wrap"
                >
                    <ToggleGroupItem 
                        value="popular" 
                        aria-label="Sort by popularity"
                        className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700 data-[state=on]:border-amber-400 dark:data-[state=on]:bg-amber-900/30 dark:data-[state=on]:text-amber-300"
                    >
                        <Star className="mr-1.5 h-3.5 w-3.5" />
                        Popular
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                        value="hot_promo" 
                        aria-label="Sort by HOT promotions"
                        className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 data-[state=on]:border-orange-400 dark:data-[state=on]:bg-orange-900/30 dark:data-[state=on]:text-orange-300"
                    >
                        <Flame className="mr-1.5 h-3.5 w-3.5" />
                        Hot Promo
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                        value="price_asc" 
                        aria-label="Sort by price low to high"
                        className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-400 dark:data-[state=on]:bg-green-900/30 dark:data-[state=on]:text-green-300"
                    >
                        <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
                        Price: Low-High
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                        value="price_desc" 
                        aria-label="Sort by price high to low"
                        className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700 data-[state=on]:border-red-400 dark:data-[state=on]:bg-red-900/30 dark:data-[state=on]:text-red-300"
                    >
                        <ArrowDownUp className="mr-1.5 h-3.5 w-3.5" />
                        Price: High-Low
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>
    )
}