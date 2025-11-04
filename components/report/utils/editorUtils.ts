// Utility functions for editor operations

import { FontFamily, FontSize, TextAlignment, ListType, StyleType } from '../types'

/**
 * Execute a document command
 */
export const execCommand = (command: string, value?: string): boolean => {
  try {
    document.execCommand(command, false, value)
    return true
  } catch (error) {
    console.error(`Error executing command ${command}:`, error)
    return false
  }
}

/**
 * Get current selection
 */
export const getSelection = (): Selection | null => {
  return window.getSelection()
}

/**
 * Save selection range
 */
export const saveSelection = (): Range | null => {
  const selection = getSelection()
  if (selection && selection.rangeCount > 0) {
    return selection.getRangeAt(0)
  }
  return null
}

/**
 * Restore selection range
 */
export const restoreSelection = (range: Range): void => {
  const selection = getSelection()
  if (selection) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

/**
 * Format text - basic commands
 */
export const formatBold = () => execCommand('bold')
export const formatItalic = () => execCommand('italic')
export const formatUnderline = () => execCommand('underline')
export const formatStrikethrough = () => execCommand('strikethrough')
export const formatSuperscript = () => execCommand('superscript')
export const formatSubscript = () => execCommand('subscript')

/**
 * Undo/Redo
 */
export const undo = () => execCommand('undo')
export const redo = () => execCommand('redo')

/**
 * Change font family
 */
export const changeFontFamily = (font: FontFamily) => {
  execCommand('fontName', font)
}

/**
 * Change font size
 */
export const changeFontSize = (size: FontSize) => {
  // Use custom implementation for more control
  const selection = getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = `${size}pt`
    
    try {
      if (range.collapsed) {
        // No selection, insert a marker
        span.innerHTML = '&#8203;' // Zero-width space
        range.insertNode(span)
      } else {
        range.surroundContents(span)
      }
    } catch (error) {
      // Fallback to execCommand
      execCommand('fontSize', '7')
      const fontElements = document.getElementsByTagName('font')
      for (let i = 0; i < fontElements.length; i++) {
        if (fontElements[i].size === '7') {
          fontElements[i].removeAttribute('size')
          fontElements[i].style.fontSize = `${size}pt`
        }
      }
    }
  }
}

/**
 * Change text color
 */
export const changeTextColor = (color: string) => {
  execCommand('foreColor', color)
}

/**
 * Change background color (highlight)
 */
export const changeBackgroundColor = (color: string) => {
  execCommand('backColor', color)
}

/**
 * Text alignment
 */
export const alignText = (alignment: TextAlignment) => {
  const commands: Record<TextAlignment, string> = {
    left: 'justifyLeft',
    center: 'justifyCenter',
    right: 'justifyRight',
    justify: 'justifyFull'
  }
  execCommand(commands[alignment])
}

/**
 * Create list
 */
export const createList = (type: ListType) => {
  if (type === 'bullet') {
    execCommand('insertUnorderedList')
  } else if (type === 'numbered') {
    execCommand('insertOrderedList')
  }
  // Alpha list requires custom implementation
  else if (type === 'alpha') {
    const selection = getSelection()
    if (selection && selection.rangeCount > 0) {
      const ol = document.createElement('ol')
      ol.style.listStyleType = 'lower-alpha'
      try {
        const range = selection.getRangeAt(0)
        range.surroundContents(ol)
      } catch (error) {
        console.error('Error creating alpha list:', error)
      }
    }
  }
}

/**
 * Indent/Outdent
 */
export const indent = () => execCommand('indent')
export const outdent = () => execCommand('outdent')

/**
 * Apply style
 */
export const applyStyle = (style: StyleType) => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  
  const styleConfigs: Record<StyleType, Partial<CSSStyleDeclaration>> = {
    normal: {
      fontSize: '12pt',
      fontWeight: 'normal',
      fontStyle: 'normal',
      lineHeight: '1.5'
    },
    heading1: {
      fontSize: '24pt',
      fontWeight: 'bold',
      marginTop: '12pt',
      marginBottom: '6pt'
    },
    heading2: {
      fontSize: '18pt',
      fontWeight: 'bold',
      marginTop: '10pt',
      marginBottom: '5pt'
    },
    heading3: {
      fontSize: '14pt',
      fontWeight: 'bold',
      marginTop: '8pt',
      marginBottom: '4pt'
    },
    quote: {
      fontSize: '12pt',
      fontStyle: 'italic',
      borderLeft: '3px solid #ccc',
      paddingLeft: '12pt',
      marginLeft: '12pt',
      color: '#666'
    },
    code: {
      fontFamily: 'Courier New, monospace',
      fontSize: '11pt',
      backgroundColor: '#f5f5f5',
      padding: '2px 4px',
      borderRadius: '3px'
    }
  }

  const styleConfig = styleConfigs[style]
  const span = document.createElement(style.startsWith('heading') ? 'div' : 'span')
  
  Object.entries(styleConfig).forEach(([key, value]) => {
    ;(span.style as any)[key] = value
  })

  try {
    if (!range.collapsed) {
      range.surroundContents(span)
    }
  } catch (error) {
    console.error('Error applying style:', error)
  }
}

/**
 * Insert horizontal line
 */
export const insertHorizontalLine = () => {
  execCommand('insertHorizontalRule')
}

/**
 * Insert link
 */
export const insertLink = (url: string, text?: string) => {
  if (text) {
    execCommand('insertHTML', `<a href="${url}" target="_blank">${text}</a>`)
  } else {
    execCommand('createLink', url)
  }
}

/**
 * Remove formatting
 */
export const removeFormatting = () => {
  execCommand('removeFormat')
}

/**
 * Copy/Cut/Paste
 */
export const copy = () => execCommand('copy')
export const cut = () => execCommand('cut')
export const paste = () => execCommand('paste')

/**
 * Select all
 */
export const selectAll = () => execCommand('selectAll')

/**
 * Insert image
 */
export const insertImage = (url: string, alt?: string) => {
  const img = `<img src="${url}" alt="${alt || ''}" style="max-width: 100%; height: auto;" />`
  execCommand('insertHTML', img)
}

/**
 * Insert table
 */
export const insertTable = (rows: number, cols: number) => {
  let tableHTML = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">'
  
  for (let i = 0; i < rows; i++) {
    tableHTML += '<tr>'
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td>&nbsp;</td>'
    }
    tableHTML += '</tr>'
  }
  
  tableHTML += '</table><p>&nbsp;</p>'
  execCommand('insertHTML', tableHTML)
}

/**
 * Find and replace
 */
export const findText = (searchText: string, caseSensitive: boolean = false): boolean => {
  if (!searchText) return false
  
  const flags = caseSensitive ? 'g' : 'gi'
  return window.find(searchText, caseSensitive, false, true, false, true, false)
}

export const replaceText = (searchText: string, replaceWith: string, replaceAll: boolean = false) => {
  const selection = getSelection()
  if (!selection) return

  const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement
  if (!editorElement) return

  if (replaceAll) {
    const regex = new RegExp(searchText, 'g')
    editorElement.innerHTML = editorElement.innerHTML.replace(regex, replaceWith)
  } else {
    // Replace current selection
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(replaceWith))
    }
  }
}

/**
 * Insert page break
 */
export const insertPageBreak = () => {
  const pageBreak = '<div style="page-break-after: always;"></div>'
  execCommand('insertHTML', pageBreak)
}

/**
 * Insert date/time
 */
export const insertDateTime = (format: 'date' | 'time' | 'datetime' = 'datetime') => {
  const now = new Date()
  let formatted = ''
  
  switch (format) {
    case 'date':
      formatted = now.toLocaleDateString()
      break
    case 'time':
      formatted = now.toLocaleTimeString()
      break
    case 'datetime':
      formatted = now.toLocaleString()
      break
  }
  
  execCommand('insertText', formatted)
}

/**
 * Clear content
 */
export const clearContent = (element: HTMLElement) => {
  element.innerHTML = ''
}

/**
 * Get content as HTML
 */
export const getContentHTML = (element: HTMLElement): string => {
  return element.innerHTML
}

/**
 * Set content from HTML
 */
export const setContentHTML = (element: HTMLElement, html: string) => {
  element.innerHTML = html
}

/**
 * Print document
 */
export const printDocument = () => {
  window.print()
}

