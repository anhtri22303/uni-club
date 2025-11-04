// Types and interfaces for the report editor

export interface EditorAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  action: () => void
  disabled?: boolean
}

export interface EditorActionWithValue extends Omit<EditorAction, 'action'> {
  action: (value: string) => void
  options?: { label: string; value: string }[]
}

export interface PageSettings {
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  paperSize: 'A4' | 'A5' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  lineSpacing: number
  showPageNumbers: boolean
  pageNumberPosition: 'top' | 'bottom'
  pageNumberAlignment: 'left' | 'center' | 'right'
  watermark?: string
  columns: number
}

export interface TableSettings {
  rows: number
  cols: number
  borderWidth: number
  borderColor: string
  backgroundColor?: string
}

export type FontFamily = 
  | 'Arial' 
  | 'Times New Roman' 
  | 'Calibri' 
  | 'Georgia' 
  | 'Verdana' 
  | 'Courier New'
  | 'Comic Sans MS'
  | 'Trebuchet MS'

export type FontSize = '8' | '9' | '10' | '11' | '12' | '14' | '16' | '18' | '20' | '22' | '24' | '26' | '28' | '36' | '48' | '72'

export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

export type ListType = 'bullet' | 'numbered' | 'alpha'

export type StyleType = 'normal' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'code'

