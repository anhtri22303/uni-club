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
        <div className="space-y-6">
            {/* 1. Hàng Filter chính (CHỌN THEO TIÊU CHÍ) */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Select by criteria</h3>
                <div className="flex flex-wrap gap-3">
                    {/* <Button variant="outline" className="border-primary text-primary">
                    <Filter className="mr-2 h-4 w-4" /> Bộ lọc ({totalActiveFilters})
                    </Button> */}
                    <Toggle
                        variant="outline"
                        pressed={filters.inStock}
                        onPressedChange={handleToggleChange("inStock")}
                        className="data-[state=on]:border-primary data-[state=on]:text-primary"
                    >
                        <Store className="mr-2 h-4 w-4" /> Available
                    </Toggle>

                    {/* Popover filter cho Tags (dữ liệu thật) */}
                    <FilterPopover
                        title="Filter by Tags"
                        options={tagOptions}
                        selectedValues={filters.selectedTags}
                        onSelectChange={handleMultiSelectChange("selectedTags")}
                    />

                    {/* Thêm các popover khác (Giá, Kích thước, v.v.) tại đây */}
                </div>
            </div>

            {/* 2. Hàng Filter đang chọn (ĐANG LỌC THEO) */}
            {totalActiveFilters > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Filtering by</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.inStock && (
                            <Badge variant="outline" className="py-1">
                                Sẵn hàng
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-4 w-4 rounded-full"
                                    onClick={() => handleToggleChange("inStock")(false)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}
                        {/* {filters.newArrivals && (
                            <Badge variant="outline" className="py-1">
                                Hàng mới về
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-4 w-4 rounded-full"
                                    onClick={() => handleToggleChange("newArrivals")(false)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )} */}
                        {/* {activeUseCases.map((label, i) => (
                            <Badge variant="outline" className="py-1" key={label}>
                                {label}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-4 w-4 rounded-full"
                                    onClick={() => removeFilterTag("useCases", Array.from(filters.useCases)[i])}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))} */}
                        {/* Hiển thị các tag đang chọn */}
                        {activeTags.map((tag) => (
                            <Badge variant="outline" className="py-1" key={tag}>
                                {tag}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-4 w-4 rounded-full"
                                    onClick={() => removeFilterTag("selectedTags", tag)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}

                        <Button variant="link" className="px-1 text-sm" onClick={clearAllFilters}>
                            Bỏ chọn tất cả
                        </Button>
                    </div>
                </div>
            )}

            {/* 3. Hàng Sắp xếp (SẮP XẾP THEO) */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Sort by</h3>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={sortBy}
                    onValueChange={(value: SortState) => value && setSortBy(value)} // Đảm bảo value không rỗng
                    className="flex-wrap justify-start"
                >
                    <ToggleGroupItem value="popular" aria-label="Sort by popularity">
                        <Star className="mr-2 h-4 w-4" />
                        Popular
                    </ToggleGroupItem>
                    <ToggleGroupItem value="hot_promo" aria-label="Sort by HOT promotions">
                        <Flame className="mr-2 h-4 w-4" />
                        HOT Promotion
                    </ToggleGroupItem>
                    <ToggleGroupItem value="price_asc" aria-label="Sort by price low to high">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Low - High Price
                    </ToggleGroupItem>
                    <ToggleGroupItem value="price_desc" aria-label="Sort by price high to low">
                        <ArrowDownUp className="mr-2 h-4 w-4" />
                        High - Low Price
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>
    )
}