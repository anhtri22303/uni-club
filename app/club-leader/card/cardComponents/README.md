# Card Components

This folder contains the modular components for the Card Designer feature. The original `page.tsx` file (1601 lines) has been refactored into smaller, maintainable components.

## 📁 File Structure

```
cardComponents/
├── README.md                   # This file
├── index.ts                    # Central export file
│
├── types.ts                    # TypeScript interfaces
├── constants.ts                # Color presets, patterns, styles
├── utils.ts                    # Utility functions
│
├── PatternRenderer.tsx         # Renders card background patterns
├── GradientPreview.tsx         # Preview component for color swatches
│
├── CardPreview.tsx             # Main card preview component
├── ChatAssistant.tsx           # AI chat assistant UI
├── useChatAssistant.ts         # Custom hook for chat logic
│
├── CustomizationTabs.tsx       # Main tabs wrapper component
├── ColorsTab.tsx               # Colors customization tab
├── StyleTab.tsx                # Style customization tab
├── QRTab.tsx                   # QR code customization tab
└── ImagesTab.tsx               # Images customization tab
```

## 🎯 Components Overview

### Core Components

#### `CardPreview.tsx`
- Displays the customizable membership card
- Shows QR code, logo, patterns, and card content
- Uses `forwardRef` for html2canvas integration
- **Props**: cardData, all customization states, onToggleQR

#### `ChatAssistant.tsx`
- AI-powered design assistant UI
- Quick suggestion buttons
- Scrollable message history
- **Props**: messages, inputValue, isLoading, isOpen, event handlers

#### `CustomizationTabs.tsx`
- Wrapper for all customization tabs
- Contains Colors, Style, QR, and Images tabs
- Passes props to child tab components

### Tab Components

#### `ColorsTab.tsx`
- Color type selector (Gradient, Solid, Pastel, Neon, Monochrome)
- Color palette grid
- Card opacity slider
- **Props**: colorType, gradient, cardOpacity, change handlers

#### `StyleTab.tsx`
- Pattern selector with visual previews
- Pattern opacity slider
- Border radius selector
- **Props**: pattern, borderRadius, patternOpacity, change handlers

#### `QRTab.tsx`
- QR code visibility toggle
- QR size slider
- QR style selector
- **Props**: showQR, qrSize, qrStyle, change handlers

#### `ImagesTab.tsx`
- Logo upload and visibility toggle
- Background image upload
- Image preview
- **Props**: showLogo, logoUrl, backgroundImage, upload handlers

### Utility Files

#### `types.ts`
- `ChatMessage`: Chat message interface
- `CardData`: Card information interface
- `CardDesign`: Complete card design state

#### `constants.ts`
- Color presets (gradients, solids, pastels, neons, monochromes)
- Pattern options
- Border radius options
- QR styles

#### `utils.ts`
- `getQrStyleClasses()`: Returns QR style CSS classes
- `getColorPresets()`: Returns color presets by type
- `getAllColors()`: Returns all color presets
- `handleColorSelection()`: Handles color selection logic
- `downloadCardAsImage()`: Downloads card as PNG
- `shareCardAsImage()`: Shares card using Web Share API

#### `useChatAssistant.ts`
- Custom React hook for AI chat functionality
- Handles message sending and receiving
- Applies AI-suggested changes to card
- Integrates with Groq API

### Helper Components

#### `PatternRenderer.tsx`
- Renders SVG patterns (circles, waves, grid, dots, etc.)
- Handles pattern opacity
- **Props**: pattern, opacity

#### `GradientPreview.tsx`
- Shows color preview swatch
- Handles both gradients and solid colors
- **Props**: gradientClass

## 🚀 Usage

### In Main Page

```tsx
import {
  CardPreview,
  ChatAssistant,
  CustomizationTabs,
  gradientPresets,
  type CardData,
  downloadCardAsImage,
  shareCardAsImage,
  handleColorSelection,
} from "./cardComponents"
import { useChatAssistant } from "./cardComponents/useChatAssistant"

// Use components
<CardPreview ref={cardRef} {...props} />
<ChatAssistant {...chatProps} />
<CustomizationTabs {...customizationProps} />
```

### Adding New Color Presets

Edit `constants.ts`:

```tsx
export const newColorType = [
  { name: "Color Name", value: "from-color-x to-color-y", type: "newtype" },
  // ... more colors
]
```

Then update `getColorPresets()` in `utils.ts`.

### Adding New Patterns

1. Add to `constants.ts`:
```tsx
{ name: "New Pattern", value: "newpattern" }
```

2. Add rendering logic to `PatternRenderer.tsx`:
```tsx
case "newpattern":
  return <div>...</div>
```

## 📊 Benefits of Refactoring

### Before
-   Single file with 1601 lines
-   Hard to navigate and maintain
-   Difficult to test individual components
-   Long compile times
-   High cognitive load

### After
-    15 focused files (average ~100-200 lines each)
-    Clear separation of concerns
-    Easy to test individual components
-    Faster development and debugging
-    Reusable components
-    Better code organization

## 🎨 Component Hierarchy

```
page.tsx (main)
├── CardPreview
│   ├── PatternRenderer
│   └── Card content
│
├── ChatAssistant
│   └── useChatAssistant hook
│
└── CustomizationTabs
    ├── ColorsTab
    │   └── GradientPreview
    ├── StyleTab
    ├── QRTab
    └── ImagesTab
```

## 🔧 State Management

State is managed in the main `page.tsx` file and passed down as props. The `useChatAssistant` hook handles chat-specific state and logic.

### Main State Variables
- `colorType`, `gradient`, `cardColorClass`
- `pattern`, `borderRadius`
- `showQR`, `qrSize`, `qrStyle`
- `showLogo`, `logoUrl`, `backgroundImage`
- `patternOpacity`, `cardOpacity`
- `clubId`

## 🧪 Testing

Each component can now be tested independently:

```tsx
import { ColorsTab } from './cardComponents'

test('ColorsTab renders correctly', () => {
  render(<ColorsTab {...mockProps} />)
  // assertions
})
```

## 📝 Future Improvements

- [ ] Add unit tests for each component
- [ ] Create Storybook stories
- [ ] Add more pattern options
- [ ] Implement theme system
- [ ] Add animation presets
- [ ] Export/import design templates

## 👨‍💻 Development

To modify the card designer:
1. Identify the component that needs changes
2. Edit the specific component file
3. Check the main `page.tsx` if props need updating
4. Test in development mode
5. Verify build: `npm run build`

## 📚 Related Files

- `/app/club-leader/card/page.tsx` - Main page component
- `/components/ui/*` - Shadcn UI components
- `/hooks/use-toast.ts` - Toast notifications

---

**Note**: This refactoring reduced the main page from 1601 lines to ~400 lines, making it much more maintainable and developer-friendly! 🎉

