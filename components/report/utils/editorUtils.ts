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
 * Note: These are kept for compatibility but the main history system
 * is now in historyManager.ts which uses local storage with 25-slot circular buffer
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
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  
  if (range.collapsed) {
    // No selection - do nothing or insert a colored space
    return
  }

  try {
    // Extract the selected content
    const selectedContent = range.extractContents()
    
    // Create a span with the color
    const span = document.createElement('span')
    span.style.color = color
    span.appendChild(selectedContent)
    
    // Insert the span back
    range.insertNode(span)
    
    // Restore selection to include the new span
    range.selectNodeContents(span)
    selection.removeAllRanges()
    selection.addRange(range)
  } catch (error) {
    console.error('Error changing text color:', error)
    // Fallback to execCommand
    execCommand('foreColor', color)
  }
}

/**
 * Change background color (highlight)
 */
export const changeBackgroundColor = (color: string) => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  
  if (range.collapsed) {
    // No selection - do nothing
    return
  }

  try {
    // Extract the selected content
    const selectedContent = range.extractContents()
    
    // Create a span with the background color
    const span = document.createElement('span')
    span.style.backgroundColor = color
    span.appendChild(selectedContent)
    
    // Insert the span back
    range.insertNode(span)
    
    // Restore selection to include the new span
    range.selectNodeContents(span)
    selection.removeAllRanges()
    selection.addRange(range)
  } catch (error) {
    console.error('Error changing background color:', error)
    // Fallback to execCommand
    execCommand('backColor', color)
  }
}

/**
 * Text alignment
 */
export const alignText = (alignment: TextAlignment) => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  
  // Check if an image is selected
  const selectedElement = range.commonAncestorContainer
  let imgElement: HTMLImageElement | null = null
  
  if (selectedElement.nodeType === Node.ELEMENT_NODE) {
    imgElement = (selectedElement as HTMLElement).querySelector('img')
    if (!imgElement && (selectedElement as HTMLElement).tagName === 'IMG') {
      imgElement = selectedElement as HTMLImageElement
    }
  } else if (selectedElement.parentElement?.tagName === 'IMG') {
    imgElement = selectedElement.parentElement as HTMLImageElement
  }
  
  // If image is selected, apply alignment to the image
  if (imgElement) {
    imgElement.style.display = 'block'
    imgElement.style.margin = '10px auto'
    
    switch (alignment) {
      case 'left':
        imgElement.style.marginLeft = '0'
        imgElement.style.marginRight = 'auto'
        break
      case 'center':
        imgElement.style.marginLeft = 'auto'
        imgElement.style.marginRight = 'auto'
        break
      case 'right':
        imgElement.style.marginLeft = 'auto'
        imgElement.style.marginRight = '0'
        break
      case 'justify':
        imgElement.style.marginLeft = '0'
        imgElement.style.marginRight = 'auto'
        break
    }
    return
  }
  
  // Otherwise, apply text alignment
  const commands: Record<TextAlignment, string> = {
    left: 'justifyLeft',
    center: 'justifyCenter',
    right: 'justifyRight',
    justify: 'justifyFull'
  }
  execCommand(commands[alignment])
}

/**
 * Apply line spacing to selected text
 */
export const applyLineSpacing = (spacing: number) => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  
  if (range.collapsed) {
    // No selection - apply to current paragraph
    let node: Node | null = range.startContainer
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode
    }
    
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      element.style.lineHeight = spacing.toString()
    }
    return
  }

  try {
    // Get all selected content
    const selectedContent = range.extractContents()
    
    // Create a wrapper div with line-height
    const wrapper = document.createElement('div')
    wrapper.style.lineHeight = spacing.toString()
    wrapper.appendChild(selectedContent)
    
    // Insert the wrapper back
    range.insertNode(wrapper)
    
    // Restore selection
    range.selectNodeContents(wrapper)
    selection.removeAllRanges()
    selection.addRange(range)
  } catch (error) {
    console.error('Error applying line spacing:', error)
  }
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
 * Copy/Cut/Paste - Using sessionStorage clipboard
 */
import * as ClipboardManager from '@/lib/clipboardManager'

export const copy = (): boolean => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const range = selection.getRangeAt(0)
  if (range.collapsed) return false

  try {
    // Get selected content as HTML
    const container = document.createElement('div')
    container.appendChild(range.cloneContents())
    const html = container.innerHTML
    const text = selection.toString()

    // Store in sessionStorage clipboard
    ClipboardManager.setClipboard(html, text, 'copy')

    // Also try native clipboard API
    navigator.clipboard?.writeText(text).catch(() => {})

    return true
  } catch (error) {
    console.error('Error copying:', error)
    return false
  }
}

export const cut = (): boolean => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const range = selection.getRangeAt(0)
  if (range.collapsed) return false

  try {
    // Get selected content as HTML
    const container = document.createElement('div')
    container.appendChild(range.cloneContents())
    const html = container.innerHTML
    const text = selection.toString()

    // Store in sessionStorage clipboard
    ClipboardManager.setClipboard(html, text, 'cut')

    // Delete the selected content
    range.deleteContents()

    // Also try native clipboard API
    navigator.clipboard?.writeText(text).catch(() => {})

    return true
  } catch (error) {
    console.error('Error cutting:', error)
    return false
  }
}

export const paste = (): boolean => {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return false

  try {
    // Get clipboard data from sessionStorage
    const clipboardData = ClipboardManager.getClipboard()
    
    if (!clipboardData) {
      // Try native clipboard API as fallback
      navigator.clipboard?.readText().then(text => {
        if (text) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          const textNode = document.createTextNode(text)
          range.insertNode(textNode)
        }
      }).catch(() => {})
      return false
    }

    const range = selection.getRangeAt(0)
    range.deleteContents()

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = clipboardData.html
    
    // Insert all child nodes
    const fragment = document.createDocumentFragment()
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    
    range.insertNode(fragment)

    // If it was a cut operation, clear clipboard after first paste
    if (clipboardData.operation === 'cut') {
      ClipboardManager.clearClipboard()
    }

    return true
  } catch (error) {
    console.error('Error pasting:', error)
    return false
  }
}

/**
 * Select all
 */
export const selectAll = () => execCommand('selectAll')

/**
 * Insert image
 */
export const insertImage = (url: string, alt?: string) => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  range.deleteContents()

  const img = document.createElement('img')
  img.src = url
  img.alt = alt || ''
  img.style.maxWidth = '100%'
  img.style.height = 'auto'
  img.style.display = 'block'
  img.style.margin = '10px auto'

  range.insertNode(img)
  
  // Move cursor after the image
  range.setStartAfter(img)
  range.setEndAfter(img)
  selection.removeAllRanges()
  selection.addRange(range)

  // Add a line break after image for easier editing
  const br = document.createElement('br')
  range.insertNode(br)
  range.setStartAfter(br)
  range.setEndAfter(br)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * Insert table
 */
export const insertTable = (rows: number, cols: number) => {
  let tableHTML = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #d1d5db;">'
  
  for (let i = 0; i < rows; i++) {
    tableHTML += '<tr>'
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td style="border: 1px solid #d1d5db; padding: 8px;">&nbsp;</td>'
    }
    tableHTML += '</tr>'
  }
  
  tableHTML += '</table><p>&nbsp;</p>'
  execCommand('insertHTML', tableHTML)
}

/**
 * Find and replace
 */
export const findText = (searchText: string, caseSensitive: boolean = false): number => {
  if (!searchText) return 0
  
  // Find all page-content elements (where the actual content is)
  const pageContents = document.querySelectorAll('.page-content[contenteditable="true"]')
  if (pageContents.length === 0) return 0

  // Clear previous highlights
  clearSearchHighlights()

  let totalMatches = 0
  
  // Search in each page
  pageContents.forEach(pageContent => {
    const text = (pageContent as HTMLElement).innerText
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi')
    const matches = text.match(regex)
    
    if (matches && matches.length > 0) {
      totalMatches += matches.length
      // Highlight all matches in this page
      highlightMatches(pageContent as HTMLElement, searchText, caseSensitive)
    }
  })
  
  return totalMatches
}

/**
 * Clear all search highlights (exported for external use)
 */
export const clearSearchHighlights = () => {
  // Clear highlights from all pages
  const pageContents = document.querySelectorAll('.page-content[contenteditable="true"]')
  pageContents.forEach(pageContent => {
    clearHighlights(pageContent as HTMLElement)
  })
}

/**
 * Clear all search highlights
 */
const clearHighlights = (element: HTMLElement) => {
  const highlights = element.querySelectorAll('mark[data-search-highlight="true"]')
  highlights.forEach(mark => {
    const parent = mark.parentNode
    if (parent && mark.textContent !== null) {
      const textNode = document.createTextNode(mark.textContent)
      parent.replaceChild(textNode, mark)
    }
  })
  // Normalize to merge adjacent text nodes
  element.normalize()
}

/**
 * Highlight all matches in the document
 */
const highlightMatches = (element: HTMLElement, searchText: string, caseSensitive: boolean = false) => {
  const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedSearch, caseSensitive ? 'g' : 'gi')
  
  const walkAndHighlight = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const text = node.textContent
      
      // Check if there are matches in this text node
      if (regex.test(text)) {
        regex.lastIndex = 0 // Reset regex
        
        const fragment = document.createDocumentFragment()
        let lastIndex = 0
        let match: RegExpExecArray | null
        
        while ((match = regex.exec(text)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
          }
          
          // Add highlighted match with strong styling
          const mark = document.createElement('mark')
          mark.setAttribute('data-search-highlight', 'true')
          mark.style.cssText = `
            background-color: #ffeb3b !important;
            color: #000000 !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
            font-weight: 500 !important;
            display: inline !important;
            position: relative !important;
            z-index: 1000 !important;
          `.replace(/\s+/g, ' ').trim()
          mark.textContent = match[0]
          fragment.appendChild(mark)
          
          lastIndex = match.index + match[0].length
        }
        
        // Add remaining text after last match
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
        }
        
        // Replace the text node with the fragment
        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node)
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      // Skip script, style, and already highlighted elements
      if (element.tagName !== 'SCRIPT' && 
          element.tagName !== 'STYLE' && 
          element.tagName !== 'MARK' &&
          !element.hasAttribute('data-search-highlight')) {
        // Convert to array to avoid issues with live NodeList during modification
        const childNodes = Array.from(node.childNodes)
        childNodes.forEach(child => walkAndHighlight(child))
      }
    }
  }
  
  walkAndHighlight(element)
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

