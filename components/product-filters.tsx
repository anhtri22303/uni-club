"use client"

import * as React from "react"
import { Archive, ArrowDownUp, ArrowUpDown, Check, ChevronDown, Filter, Flame, Sparkles, Star, X, } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, } from "@/components/ui/command"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"

// --- Định nghĩa Types ---

// Định nghĩa các tùy chọn
type FilterOption = {
    value: string
    label: string
}

// Định nghĩa trạng thái của tất cả bộ lọc
export interface FilterState {
    inStock: boolean
    newArrivals: boolean
    useCases: Set<string> // Dùng Set để quản lý các giá trị duy nhất
    brands: Set<string>
    // Thêm các bộ lọc khác ở đây... (e.g., priceRange: [number, number])
}

// Định nghĩa trạng thái sắp xếp
export type SortState = "popular" | "hot_promo" | "price_asc" | "price_desc"

// --- Dữ liệu giả lập (bạn sẽ thay bằng API) ---
const allUseCases: FilterOption[] = [
    { value: "van_phong", label: "Văn phòng" },
    { value: "gaming", label: "Gaming" },
    { value: "do_hoa", label: "Đồ họa" },
    { value: "hoc_tap", label: "Học tập - Giải trí" },
]

const allBrands: FilterOption[] = [
    { value: "samsung", label: "Samsung" },
    { value: "lg", label: "LG" },
    { value: "dell", label: "Dell" },
    { value: "asus", label: "Asus" },
]

// --- Prop cho component ---
interface ProductFiltersProps {
    // Callback để thông báo cho component cha khi filter thay đổi
    onFilterChange: (filters: FilterState) => void
    // Callback để thông báo cho component cha khi sort thay đổi
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
                    <CommandInput placeholder={`Tìm ${title.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>Không tìm thấy.</CommandEmpty>
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
                                        Xóa bộ lọc
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
export function ProductFilters({ onFilterChange, onSortChange }: ProductFiltersProps) {
    const [filters, setFilters] = React.useState<FilterState>({
        inStock: false,
        newArrivals: false,
        useCases: new Set(),
        brands: new Set(),
    })

    const [sortBy, setSortBy] = React.useState<SortState>("popular")

    // Thông báo cho component cha mỗi khi state thay đổi
    React.useEffect(() => {
        onFilterChange(filters)
    }, [filters, onFilterChange])

    React.useEffect(() => {
        onSortChange(sortBy)
    }, [sortBy, onSortChange])

    // --- Hàm xử lý ---

    // Xử lý bật/tắt filter (Sẵn hàng, Hàng mới)
    const handleToggleChange = (key: "inStock" | "newArrivals") => (pressed: boolean) => {
        setFilters((prev) => ({ ...prev, [key]: pressed }))
    }

    // Xử lý chọn/bỏ chọn filter trong popover
    const handleMultiSelectChange = (key: "useCases" | "brands") => (value: string) => {
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
    const removeFilterTag = (key: "useCases" | "brands", value: string) => {
        // Chỉ cần gọi lại hàm này, nó sẽ tự động-bỏ chọn
        handleMultiSelectChange(key)(value)
    }

    // Xử lý bỏ tất cả filter
    const clearAllFilters = () => {
        setFilters({
            inStock: false,
            newArrivals: false,
            useCases: new Set(),
            brands: new Set(),
        })
    }

    // --- Tính toán phụ ---
    const activeUseCases = Array.from(filters.useCases).map(
        (val) => allUseCases.find((opt) => opt.value === val)?.label || val
    )
    const activeBrands = Array.from(filters.brands).map(
        (val) => allBrands.find((opt) => opt.value === val)?.label || val
    )
    const totalActiveFilters =
        (filters.inStock ? 1 : 0) +
        (filters.newArrivals ? 1 : 0) +
        filters.useCases.size +
        filters.brands.size

    return (
        <div className="space-y-6">
            {/* 1. Hàng Filter chính (CHỌN THEO TIÊU CHÍ) */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Chọn theo tiêu chí</h3>
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
                        <Archive className="mr-2 h-4 w-4" /> Sẵn hàng
                    </Toggle>

                    <Toggle
                        variant="outline"
                        pressed={filters.newArrivals}
                        onPressedChange={handleToggleChange("newArrivals")}
                        className="data-[state=on]:border-primary data-[state=on]:text-primary"
                    >
                        <Sparkles className="mr-2 h-4 w-4" /> Hàng mới về
                    </Toggle>

                    {/* Các popover filter */}
                    <FilterPopover
                        title="Nhu cầu sử dụng"
                        options={allUseCases}
                        selectedValues={filters.useCases}
                        onSelectChange={handleMultiSelectChange("useCases")}
                    />

                    <FilterPopover
                        title="Hãng sản xuất"
                        options={allBrands}
                        selectedValues={filters.brands}
                        onSelectChange={handleMultiSelectChange("brands")}
                    />
                    {/* Thêm các popover khác (Giá, Kích thước, v.v.) tại đây */}
                </div>
            </div>

            {/* 2. Hàng Filter đang chọn (ĐANG LỌC THEO) */}
            {totalActiveFilters > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Đang lọc theo</h3>
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
                        {filters.newArrivals && (
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
                        )}
                        {activeUseCases.map((label, i) => (
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
                        ))}
                        {activeBrands.map((label, i) => (
                            <Badge variant="outline" className="py-1" key={label}>
                                {label}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-4 w-4 rounded-full"
                                    onClick={() => removeFilterTag("brands", Array.from(filters.brands)[i])}
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
                <h3 className="text-lg font-semibold mb-3">Sắp xếp theo</h3>
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
                    <ToggleGroupItem value="hot_promo" aria-label="Sắp xếp theo khuyến mãi HOT">
                        <Flame className="mr-2 h-4 w-4" />
                        HOT Promotion
                    </ToggleGroupItem>
                    <ToggleGroupItem value="price_asc" aria-label="Sắp xếp theo giá thấp đến cao">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Low - High Price
                    </ToggleGroupItem>
                    <ToggleGroupItem value="price_desc" aria-label="Sắp xếp theo giá cao đến thấp">
                        <ArrowDownUp className="mr-2 h-4 w-4" />
                        High - Low Price
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>
    )
}