// Color type options
export const colorTypes = [
  { name: "Gradient", value: "gradient" },
  { name: "Solid", value: "solid" },
  { name: "Pastel", value: "pastel" },
  { name: "Neon", value: "neon" },
  { name: "Monochrome", value: "monochrome" },
]

// Gradient presets
export const gradientPresets = [
  { name: "Blue Purple", value: "from-blue-600 via-purple-600 to-indigo-700", type: "gradient" },
  { name: "Pink Orange", value: "from-pink-500 via-red-500 to-orange-500", type: "gradient" },
  { name: "Green Teal", value: "from-green-500 via-teal-500 to-cyan-600", type: "gradient" },
  { name: "Purple Pink", value: "from-purple-600 via-pink-500 to-rose-600", type: "gradient" },
  { name: "Dark Blue", value: "from-slate-700 via-blue-800 to-indigo-900", type: "gradient" },
  { name: "Gold Amber", value: "from-yellow-500 via-amber-500 to-orange-600", type: "gradient" },
  { name: "Emerald Ocean", value: "from-emerald-600 via-teal-600 to-blue-700", type: "gradient" },
  { name: "Sunset", value: "from-orange-600 via-rose-600 to-purple-700", type: "gradient" },
  { name: "Ocean Breeze", value: "from-cyan-400 via-blue-500 to-indigo-600", type: "gradient" },
  { name: "Forest", value: "from-green-600 via-emerald-600 to-teal-700", type: "gradient" },
]

// Solid color presets
export const solidColors = [
  { name: "Royal Blue", value: "bg-blue-600", type: "solid" },
  { name: "Crimson Red", value: "bg-red-600", type: "solid" },
  { name: "Emerald Green", value: "bg-emerald-600", type: "solid" },
  { name: "Deep Purple", value: "bg-purple-600", type: "solid" },
  { name: "Amber Gold", value: "bg-amber-600", type: "solid" },
  { name: "Teal", value: "bg-teal-600", type: "solid" },
  { name: "Indigo", value: "bg-indigo-600", type: "solid" },
  { name: "Rose", value: "bg-rose-600", type: "solid" },
  { name: "Sky Blue", value: "bg-sky-600", type: "solid" },
  { name: "Violet", value: "bg-violet-600", type: "solid" },
]

// Pastel color presets
export const pastelColors = [
  { name: "Soft Pink", value: "from-pink-200 via-rose-200 to-pink-300", type: "pastel" },
  { name: "Baby Blue", value: "from-blue-200 via-sky-200 to-cyan-200", type: "pastel" },
  { name: "Mint Green", value: "from-green-200 via-emerald-200 to-teal-200", type: "pastel" },
  { name: "Lavender", value: "from-purple-200 via-violet-200 to-fuchsia-200", type: "pastel" },
  { name: "Peach", value: "from-orange-200 via-amber-200 to-yellow-200", type: "pastel" },
  { name: "Lilac", value: "from-indigo-200 via-purple-200 to-pink-200", type: "pastel" },
  { name: "Seafoam", value: "from-teal-200 via-cyan-200 to-blue-200", type: "pastel" },
  { name: "Sunset Pastel", value: "from-rose-200 via-pink-200 to-orange-200", type: "pastel" },
]

// Neon color presets
export const neonColors = [
  { name: "Electric Blue", value: "from-cyan-400 via-blue-500 to-cyan-400", type: "neon" },
  { name: "Hot Pink", value: "from-fuchsia-500 via-pink-500 to-rose-500", type: "neon" },
  { name: "Lime Green", value: "from-lime-400 via-green-500 to-emerald-400", type: "neon" },
  { name: "Neon Purple", value: "from-purple-500 via-fuchsia-500 to-purple-600", type: "neon" },
  { name: "Orange Glow", value: "from-orange-400 via-red-500 to-pink-500", type: "neon" },
  { name: "Cyber Yellow", value: "from-yellow-400 via-amber-400 to-yellow-500", type: "neon" },
  { name: "Acid Green", value: "from-lime-500 via-green-400 to-cyan-400", type: "neon" },
  { name: "Magenta", value: "from-pink-500 via-fuchsia-600 to-purple-500", type: "neon" },
]

// Monochrome color presets
export const monochromeColors = [
  { name: "Pure Black", value: "bg-black", type: "monochrome" },
  { name: "Charcoal", value: "bg-gray-800", type: "monochrome" },
  { name: "Slate", value: "bg-slate-700", type: "monochrome" },
  { name: "Steel", value: "bg-gray-600", type: "monochrome" },
  { name: "Silver", value: "from-gray-300 via-gray-400 to-gray-500", type: "monochrome" },
  { name: "Ash", value: "from-gray-400 via-slate-500 to-gray-600", type: "monochrome" },
  { name: "Smoke", value: "from-gray-500 via-slate-600 to-gray-700", type: "monochrome" },
  { name: "Obsidian", value: "from-gray-800 via-slate-900 to-black", type: "monochrome" },
]

// Card patterns
export const cardPatterns = [
  { name: "Circles", value: "circles" },
  { name: "Waves", value: "waves" },
  { name: "Grid", value: "grid" },
  { name: "Dots", value: "dots" },
  { name: "Diagonal Lines", value: "diagonal" },
  { name: "Hexagons", value: "hexagon" },
  { name: "Triangles", value: "triangles" },
  { name: "Stars", value: "stars" },
  { name: "None", value: "none" },
]

// Border radius options
export const borderRadiusOptions = [
  { name: "Small", value: "rounded-lg" },
  { name: "Medium", value: "rounded-xl" },
  { name: "Large", value: "rounded-2xl" },
  { name: "Extra Large", value: "rounded-3xl" },
]

// QR position options
export const qrPositions = [
  { name: "Top Right", value: "top-right" },
  { name: "Top Left", value: "top-left" },
  { name: "Bottom Right", value: "bottom-right" },
  { name: "Bottom Left", value: "bottom-left" },
  { name: "Center Right", value: "center-right" },
  { name: "Hidden", value: "hidden" },
]

// QR styles
export const qrStyles = [
  { name: "Default", value: "default" },
  { name: "Rounded", value: "rounded" },
  { name: "With Border", value: "bordered" },
  { name: "Shadow", value: "shadow" },
]

