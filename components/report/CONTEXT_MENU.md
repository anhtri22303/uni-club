# Context Menu Documentation

A smart right-click context menu that shows different options based on what you click (text, image, table, or link).

## 🎯 Overview

The Context Menu provides quick access to formatting and editing commands based on the element you right-click:
- **Text**: Copy, cut, paste, format, align, insert link
- **Image**: Copy, properties, delete
- **Table**: Insert/delete rows/columns, cell formatting
- **Link**: Copy, edit, remove, open in new tab

## 📁 Files

```
components/report/
├── ContextMenu.tsx              # Main context menu component
└── utils/
    └── contextMenuUtils.ts      # Element detection utilities
```

## 🚀 Usage

### Basic Integration

```tsx
import { ContextMenu } from '@/components/report'

function MyEditor() {
  const editorRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <ContextMenu editorRef={editorRef} />
      <div ref={editorRef} contentEditable>
        {/* Your editable content */}
      </div>
    </>
  )
}
```

## 📋 Context Menu Items

### 🔤 Text Context (Default)

When right-clicking on regular text:

| Command | Icon | Keyboard | Description |
|---------|------|----------|-------------|
| Cut | ✂️ | Ctrl+X | Cut selected text |
| Copy | 📋 | Ctrl+C | Copy selected text |
| Paste | 📄 | Ctrl+V | Paste from clipboard |
| **Format** (Submenu) | **B** | | Text formatting options |
| → Bold | **B** | Ctrl+B | Make text bold |
| → Italic | *I* | Ctrl+I | Make text italic |
| → Underline | U | Ctrl+U | Underline text |
| → Clear Formatting | ✖️ | | Remove all formatting |
| **Styles** (Submenu) | H1 | | Apply text styles |
| → Normal Text | | | Default paragraph style |
| → Heading 1 | H1 | | Large heading (24pt) |
| → Heading 2 | H2 | | Medium heading (18pt) |
| → Heading 3 | H3 | | Small heading (14pt) |
| → Code | `<>` | | Monospace code style |
| → Quote | "" | | Italic quote with border |
| **Align** (Submenu) | ≡ | | Text alignment |
| → Left | ≡ | | Align text left |
| → Center | ≡ | | Center text |
| → Right | ≡ | | Align text right |
| → Justify | ≡ | | Justify text |
| Insert Link | 🔗 | | Create hyperlink |

---

### 🔗 Link Context

When right-clicking on a hyperlink:

| Command | Description |
|---------|-------------|
| Copy Link | Copy the link URL |
| Edit Link | Change the link URL |
| Remove Link | Remove hyperlink, keep text |
| Open in New Tab | Open link in new browser tab |

---

### 🖼️ Image Context

When right-clicking on an image:

| Command | Description |
|---------|-------------|
| Copy Image | Copy the image |
| Image Properties | Edit width, alt text |
| Delete Image | Remove the image |

**Image Properties Dialog:**
- **Width**: Set image width (px or %)
- **Alt Text**: Set alternative text for accessibility

---

### 📊 Table Context

When right-clicking inside a table cell:

| Command | Icon | Description |
|---------|------|-------------|
| **Insert Row** (Submenu) | ➕ | Add table rows |
| → Insert Row Above | ⬆️ | Add row above current |
| → Insert Row Below | ⬇️ | Add row below current |
| **Insert Column** (Submenu) | ➕ | Add table columns |
| → Insert Column Left | ⬅️ | Add column to the left |
| → Insert Column Right | ➡️ | Add column to the right |
| Cell Background | 🎨 | Change cell background color |
| Delete Row | ➖ | Remove current row |
| Delete Column | ➖ | Remove current column |
| Delete Table | 🗑️ | Remove entire table |

---

## 🔧 Technical Details

### Element Detection

The context menu automatically detects what element was clicked:

```typescript
export type ContextType = 'text' | 'image' | 'table' | 'link'

// Detection hierarchy (checked in order):
1. Is it an <img> tag? → 'image'
2. Is it inside a <td> or <th>? → 'table'
3. Is it an <a> tag or inside one? → 'link'
4. Default → 'text'
```

### Smart Positioning

The context menu automatically adjusts its position to stay within the viewport:

```typescript
// Prevents menu from going off-screen
- Adjusts X position if menu would overflow right edge
- Adjusts Y position if menu would overflow bottom edge
- Maintains minimum 10px distance from edges
```

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest)
- **Required APIs**:
  - `window.getSelection()` - For text selection
  - `document.execCommand()` - For formatting commands
  - `navigator.clipboard` - For paste functionality

## 💡 Implementation Details

### Key Functions

```typescript
// Element Detection
detectElementType(element: HTMLElement): ContextType

// Position Calculation
getContextMenuPosition(x: number, y: number): { x: number; y: number }

// Element Getters
getTableCell(element: HTMLElement): HTMLTableCellElement | null
getImageElement(element: HTMLElement): HTMLImageElement | null
getLinkElement(element: HTMLElement): HTMLAnchorElement | null
```

### Event Handling

```typescript
// Context menu opens on right-click
document.addEventListener('contextmenu', handleContextMenu)

// Context menu closes on any click
document.addEventListener('click', handleClick)
```

## 🎨 Styling

The context menu uses shadcn/ui components:

- `DropdownMenu` - Main menu container
- `DropdownMenuItem` - Individual menu items
- `DropdownMenuSub` - Nested submenus
- `DropdownMenuSeparator` - Visual dividers

**Color Coding:**
- 🔴 Red text = Destructive actions (Delete)
- ⚪ Normal text = Standard actions
- 🔧 Icons = Visual command indicators

## 📝 Examples

### Example 1: Text Formatting

```
1. Right-click on text
2. Select "Format" → "Bold"
3. Text becomes bold
```

### Example 2: Table Modification

```
1. Right-click inside a table cell
2. Select "Insert Row" → "Insert Row Above"
3. New row appears above current cell
```

### Example 3: Image Properties

```
1. Right-click on an image
2. Select "Image Properties"
3. Enter width: "50%"
4. Enter alt text: "Company Logo"
5. Image updates with new properties
```

### Example 4: Link Management

```
1. Right-click on a link
2. Select "Edit Link"
3. Change URL to new destination
4. Link is updated
```

## ⚙️ Configuration

### Custom Context Types

You can extend the context menu by adding new types:

```typescript
// In contextMenuUtils.ts
export type ContextType = 'text' | 'image' | 'table' | 'link' | 'video' // Add new type

// In ContextMenu.tsx
{contextType === 'video' && (
  <>
    <DropdownMenuItem>Play Video</DropdownMenuItem>
    <DropdownMenuItem>Video Properties</DropdownMenuItem>
  </>
)}
```

## 🚨 Limitations

1. **Clipboard Access**: Paste requires clipboard permissions
2. **execCommand**: Some browsers may deprecate `document.execCommand()`
3. **Table Detection**: Only works with standard HTML tables
4. **Mobile**: Context menu is desktop-optimized (mobile uses long-press)

## 🔮 Future Enhancements

- [ ] Spell check suggestions for misspelled words
- [ ] Comment insertion and management
- [ ] Track changes preview
- [ ] Custom shortcuts configuration
- [ ] Multi-cell selection for tables
- [ ] Undo/Redo in context menu
- [ ] Emoji picker submenu
- [ ] Special characters submenu

## 🤝 Integration with Editor

The context menu works seamlessly with the Rich Text Editor toolbar:

- Toolbar: Proactive formatting (select tools before typing)
- Context Menu: Reactive formatting (format existing content)

Both use the same utility functions from `editorUtils.ts`.

---

**Related Components:**
- `RichTextEditorToolbar.tsx` - Main formatting toolbar
- `editorUtils.ts` - Shared formatting functions
- `TextEditingTab.tsx` - Text formatting tab

**Related Documentation:**
- [Rich Text Editor README](./README.md)
- [Editor Utilities](./utils/README.md)

