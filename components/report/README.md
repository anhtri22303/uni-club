# Rich Text Editor for Club Reports

A comprehensive Word-like text editor with 4 tabbed toolbars for creating and formatting club reports.

## 📁 File Structure

```
components/report/
├── RichTextEditorToolbar.tsx    # Main toolbar component with tabs
├── types.ts                      # TypeScript interfaces and types
├── index.ts                      # Export file
├── tabs/
│   ├── TextEditingTab.tsx       # Tab 1: Text editing & formatting
│   ├── PageLayoutTab.tsx        # Tab 2: Page layout & design
│   ├── InsertTab.tsx            # Tab 3: Insert elements
│   └── TableToolsTab.tsx        # Tab 4: Table tools & data
└── utils/
    └── editorUtils.ts           # Utility functions for editor operations
```

## 🎨 Features by Tab

### Tab 1: Editing & Formatting
**Icon:** Type (✎)

#### Basic Operations
- **Undo/Redo** - Ctrl+Z, Ctrl+Y
- **Copy/Cut/Paste** - Ctrl+C, Ctrl+X, Ctrl+V

#### Font Formatting
- **Font Family** - 8 options (Arial, Times New Roman, Calibri, etc.)
- **Font Size** - 12 preset sizes (8pt to 72pt)
- **Bold** - Ctrl+B
- **Italic** - Ctrl+I
- **Underline** - Ctrl+U
- **Strikethrough**
- **Subscript** - For chemical formulas (H₂O)
- **Superscript** - For exponents (x²)
- **Text Color** - 60 preset colors + custom color picker
- **Highlight Color** - Background color with presets + custom

#### Paragraph Formatting
- **Alignment** - Left, Center, Right, Justify
- **Lists** - Bullet points, Numbered lists
- **Indentation** - Increase/Decrease indent

#### Styles
- **Heading 1** - Large bold heading (24pt)
- **Heading 2** - Medium bold heading (18pt)
- **Heading 3** - Small bold heading (14pt)
- **Quote** - Italic with border
- **Code** - Monospace with background

#### Tools
- **Find & Replace** - Search text and replace all or one
- **Clear Formatting** - Remove all formatting from selection

---

### Tab 2: Page Layout & Design
**Icon:** FileText (📄)

#### Paper Settings
- **Paper Size** - A4, A5, Letter, Legal
- **Orientation** - Portrait, Landscape

#### Margins
- **Custom Margins** - Top, Bottom, Left, Right (in mm)
- **Quick Presets** - Normal, Narrow, Wide margins

#### Spacing & Layout
- **Line Spacing** - Single, 1.15, 1.5, Double, 2.5, 3.0
- **Page Break** - Insert page break to start new page
- **Columns** - 1, 2, 3, or 4 column layout

#### Page Numbers
- **Show/Hide** - Toggle page numbers
- **Position** - Top or Bottom
- **Alignment** - Left, Center, Right

#### Watermark
- **Presets** - DRAFT, CONFIDENTIAL, COPY, SAMPLE, DO NOT COPY, ORIGINAL
- **Custom** - Enter any custom watermark text
- **Remove** - Clear watermark

#### Actions
- **Print** - Print document (Ctrl+P)

---

### Tab 3: Insert
**Icon:** Plus (➕)

#### Table
- **Visual Grid Selector** - Hover and click to select size (up to 8x8)
- **Manual Entry** - Enter exact rows and columns
- **Insert** - Creates formatted table with borders

#### Images & Graphics
- **Insert Image** - From URL or upload from computer
- **Alt Text** - Add description for accessibility
- **Shapes** - (Placeholder for future implementation)
- **SmartArt** - (Placeholder for future implementation)
- **3D Models** - (Placeholder for future implementation)

#### Links
- **Hyperlink** - Insert clickable links
- **Display Text** - Custom text for link
- **URL** - Target web address

#### Text Elements
- **Text Box** - Insert bordered text container
- **Horizontal Line** - Insert separator line

#### Date & Time
- **Insert Date** - Current date
- **Insert Time** - Current time
- **Insert Date & Time** - Both together
- **Auto-Format** - Uses locale-specific formatting

---

### Tab 4: Table Tools
**Icon:** Table2 (⊞)

#### Structure Editing
- **Insert Row Above** - Add row above selected cell
- **Insert Row Below** - Add row below selected cell
- **Insert Column Left** - Add column to the left
- **Insert Column Right** - Add column to the right
- **Delete Row** - Remove selected row
- **Delete Column** - Remove selected column
- **Delete Table** - Remove entire table

#### Cell Operations
- **Merge Cells** - Combine multiple cells (requires selection API)
- **Split Cell** - Split merged cells back

#### Formatting
- **Borders** - Customize border color and width
- **Cell Background** - Color individual cells
- **Cell Padding** - Adjust spacing inside cells (px)

#### Alignment
- **Align Left** - Left-align cell content
- **Align Center** - Center cell content
- **Align Right** - Right-align cell content

#### Sorting
- **Sort A→Z** - Sort table by column (ascending)
- **Sort Z→A** - Sort table by column (descending)
- **Number Sorting** - Automatically detects numbers vs text

#### Calculations
- **SUM** - Calculate sum of column
- **AVERAGE** - Calculate average of column
- **Auto-detect** - Automatically parses numbers from text

---

## 💡 Usage Example

```tsx
import { RichTextEditorToolbar } from '@/components/report'
import { PageSettings } from '@/components/report/types'

function MyReportPage() {
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    paperSize: 'A4',
    orientation: 'portrait',
    lineSpacing: 1.5,
    showPageNumbers: true,
    pageNumberPosition: 'bottom',
    pageNumberAlignment: 'right',
    columns: 1
  })

  const handlePageSettingsChange = (settings: Partial<PageSettings>) => {
    setPageSettings(prev => ({ ...prev, ...settings }))
  }

  const handleSync = () => {
    // Sync editor content and re-paginate
    console.log('Content synced')
  }

  return (
    <RichTextEditorToolbar
      pageSettings={pageSettings}
      onPageSettingsChange={handlePageSettingsChange}
      onSync={handleSync}
    />
  )
}
```

## 🎯 Key Features

1. **Tab-based UI** - Organized like Microsoft Word
2. **Icon-driven** - Hover to see function names (tooltips)
3. **Responsive** - Works on mobile with collapsed labels
4. **Accessible** - ARIA labels and keyboard shortcuts
5. **Real-time** - All changes apply immediately
6. **Auto-sync** - Content syncs after formatting

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy |
| Ctrl+X | Cut |
| Ctrl+V | Paste |
| Ctrl+P | Print |

## 🔧 Technical Details

### Dependencies
- React 18+
- Lucide React (icons)
- shadcn/ui components
- TypeScript

### Browser Compatibility
- Modern browsers with `document.execCommand` support
- Chrome, Firefox, Safari, Edge (latest versions)

### Limitations
- Some advanced features (Shapes, SmartArt) are placeholders
- Merge cells requires additional selection API implementation
- Works best with contentEditable divs

## 📝 Notes

- All formatting applies to the current text selection
- Tables must be inserted into a contentEditable area
- Page settings trigger re-pagination automatically
- Watermarks are applied at the page level
- Line spacing affects all paragraphs in the page

## 🚀 Future Enhancements

- [ ] Implement shapes and drawing tools
- [ ] Add SmartArt and diagrams
- [ ] Support for 3D models
- [ ] Enhanced table merge/split with visual selection
- [ ] Spell check and grammar suggestions
- [ ] Mail merge functionality
- [ ] Equation editor
- [ ] Chart insertion from data
- [ ] Comments and track changes

