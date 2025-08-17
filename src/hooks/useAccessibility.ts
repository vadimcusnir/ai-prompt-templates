'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface AccessibilityConfig {
  enableScreenReader?: boolean
  enableKeyboardNavigation?: boolean
  enableFocusManagement?: boolean
  enableARIA?: boolean
  enableHighContrast?: boolean
  enableReducedMotion?: boolean
  enableLargeText?: boolean
}

interface AccessibilityState {
  isScreenReaderActive: boolean
  isKeyboardNavigating: boolean
  isHighContrast: boolean
  isReducedMotion: boolean
  isLargeText: boolean
  currentFocus: string | null
  focusHistory: string[]
}

interface UseAccessibilityReturn {
  // State
  isScreenReaderActive: boolean
  isKeyboardNavigating: boolean
  isHighContrast: boolean
  isReducedMotion: boolean
  isLargeText: boolean
  currentFocus: string | null
  
  // Actions
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  setFocus: (elementId: string) => void
  trapFocus: (containerId: string) => void
  releaseFocus: () => void
  navigateWithKeyboard: (direction: 'next' | 'previous') => void
  
  // Utilities
  isElementVisible: (elementId: string) => boolean
  isElementFocusable: (elementId: string) => boolean
  getFocusableElements: (containerId?: string) => HTMLElement[]
  createFocusTrap: (containerId: string) => () => void
  addARIALabel: (elementId: string, label: string) => void
  removeARIALabel: (elementId: string) => void
  setARIAExpanded: (elementId: string, expanded: boolean) => void
  setARIAHidden: (elementId: string, hidden: boolean) => void
  setARIACurrent: (elementId: string, current: boolean) => void
  setARIASelected: (elementId: string, selected: boolean) => void
  setARIARequired: (elementId: string, required: boolean) => void
  setARIAInvalid: (elementId: string, invalid: boolean) => void
  setARIADescribedBy: (elementId: string, describedBy: string) => void
  setARIALabelledBy: (elementId: string, labelledBy: string) => void
  setARIAControls: (elementId: string, controls: string) => void
  setARIAOwns: (elementId: string, owns: string) => void
  setARIALive: (elementId: string, live: 'off' | 'polite' | 'assertive') => void
  setARIAAtomic: (elementId: string, atomic: boolean) => void
  setARIARelevant: (elementId: string, relevant: 'additions' | 'removals' | 'text' | 'all') => void
  setARIABusy: (elementId: string, busy: boolean) => void
  setARIADisabled: (elementId: string, disabled: boolean) => void
  setARIAReadOnly: (elementId: string, readOnly: boolean) => void
  setARIARequired: (elementId: string, required: boolean) => void
  setARIAInvalid: (elementId: string, invalid: boolean) => void
  setARIAPressed: (elementId: string, pressed: boolean) => void
  setARIAExpanded: (elementId: string, expanded: boolean) => void
  setARIAChecked: (elementId: string, checked: boolean) => void
  setARIAValueNow: (elementId: string, value: number) => void
  setARIAValueMin: (elementId: string, value: number) => void
  setARIAValueMax: (elementId: string, value: number) => void
  setARIAValueText: (elementId: string, value: string) => void
  setARIASort: (elementId: string, sort: 'ascending' | 'descending' | 'none' | 'other') => void
  setARIASetSize: (elementId: string, size: number) => void
  setARIAPosInSet: (elementId: string, position: number) => void
  setARIAColIndex: (elementId: string, index: number) => void
  setARIARowIndex: (elementId: string, index: number) => void
  setARIAColSpan: (elementId: string, span: number) => void
  setARIARowSpan: (elementId: string, span: number) => void
  setARIAColCount: (elementId: string, count: number) => void
  setARIARowCount: (elementId: string, count: number) => void
  setARIATableIndex: (elementId: string, index: number) => void
  setARIATableHeader: (elementId: string, header: boolean) => void
  setARIATableFooter: (elementId: string, footer: boolean) => void
  setARIATableBody: (elementId: string, body: boolean) => void
  setARIATableRow: (elementId: string, row: boolean) => void
  setARIATableCell: (elementId: string, cell: boolean) => void
  setARIATableColumnHeader: (elementId: string, header: boolean) => void
  setARIATableRowHeader: (elementId: string, header: boolean) => void
  setARIATableColumnGroup: (elementId: string, group: boolean) => void
  setARIATableRowGroup: (elementId: string, group: boolean) => void
  setARIATableCaption: (elementId: string, caption: boolean) => void
  setARIATableSummary: (elementId: string, summary: string) => void
  setARIATableDescription: (elementId: string, description: string) => void
  setARIATableIndex: (elementId: string, index: number) => void
  setARIATableHeader: (elementId: string, header: boolean) => void
  setARIATableFooter: (elementId: string, footer: boolean) => void
  setARIATableBody: (elementId: string, body: boolean) => void
  setARIATableRow: (elementId: string, row: boolean) => void
  setARIATableCell: (elementId: string, cell: boolean) => void
  setARIATableColumnHeader: (elementId: string, header: boolean) => void
  setARIATableRowHeader: (elementId: string, header: boolean) => void
  setARIATableColumnGroup: (elementId: string, group: boolean) => void
  setARIATableRowGroup: (elementId: string, group: boolean) => void
  setARIATableCaption: (elementId: string, caption: boolean) => void
  setARIATableSummary: (elementId: string, summary: string) => void
  setARIATableDescription: (elementId: string, description: string) => void
}

// Screen reader announcement utility
class ScreenReaderAnnouncer {
  private container: HTMLElement | null = null

  constructor() {
    this.createContainer()
  }

  private createContainer(): void {
    if (typeof window === 'undefined') return

    this.container = document.createElement('div')
    this.container.setAttribute('aria-live', 'polite')
    this.container.setAttribute('aria-atomic', 'true')
    this.container.style.position = 'absolute'
    this.container.style.left = '-10000px'
    this.container.style.width = '1px'
    this.container.style.height = '1px'
    this.container.style.overflow = 'hidden'
    this.container.style.clip = 'rect(0, 0, 0, 0)'
    this.container.style.whiteSpace = 'nowrap'
    
    document.body.appendChild(this.container)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.container) return

    this.container.setAttribute('aria-live', priority)
    this.container.textContent = message

    // Clear the message after a short delay
    setTimeout(() => {
      if (this.container) {
        this.container.textContent = ''
      }
    }, 1000)
  }

  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      this.container = null
    }
  }
}

// Focus trap utility
class FocusTrap {
  private container: HTMLElement | null = null
  private focusableElements: HTMLElement[] = []
  private firstElement: HTMLElement | null = null
  private lastElement: HTMLElement | null = null

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)
    if (this.container) {
      this.setupFocusTrap()
    }
  }

  private setupFocusTrap(): void {
    if (!this.container) return

    this.focusableElements = this.getFocusableElements()
    if (this.focusableElements.length > 0) {
      this.firstElement = this.focusableElements[0]
      this.lastElement = this.focusableElements[this.focusableElements.length - 1]

      this.container.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.container) return []

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      'area[href]',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(this.container.querySelectorAll(selector)) as HTMLElement[]
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === this.firstElement) {
          event.preventDefault()
          this.lastElement?.focus()
        }
      } else {
        if (document.activeElement === this.lastElement) {
          event.preventDefault()
          this.firstElement?.focus()
        }
      }
    }
  }

  destroy(): void {
    if (this.container) {
      this.container.removeEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }
}

export function useAccessibility(config: AccessibilityConfig = {}): UseAccessibilityReturn {
  const {
    enableScreenReader = true,
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
    enableARIA = true,
    enableHighContrast = true,
    enableReducedMotion = true,
    enableLargeText = true
  } = config

  const [state, setState] = useState<AccessibilityState>({
    isScreenReaderActive: false,
    isKeyboardNavigating: false,
    isHighContrast: false,
    isReducedMotion: false,
    isLargeText: false,
    currentFocus: null,
    focusHistory: []
  })

  const announcerRef = useRef<ScreenReaderAnnouncer | null>(null)
  const focusTrapRef = useRef<FocusTrap | null>(null)
  const focusHistoryRef = useRef<string[]>([])
  const keyboardNavigationRef = useRef(false)

  // Initialize accessibility features
  useEffect(() => {
    if (enableScreenReader && !announcerRef.current) {
      announcerRef.current = new ScreenReaderAnnouncer()
    }

    // Detect screen reader usage
    const detectScreenReader = () => {
      const isScreenReaderActive = 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.getAttribute('data-screen-reader') === 'true'
      
      setState(prev => ({ ...prev, isScreenReaderActive }))
    }

    // Detect high contrast mode
    const detectHighContrast = () => {
      const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      setState(prev => ({ ...prev, isHighContrast }))
    }

    // Detect reduced motion preference
    const detectReducedMotion = () => {
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setState(prev => ({ ...prev, isReducedMotion }))
    }

    // Detect large text preference
    const detectLargeText = () => {
      const isLargeText = window.matchMedia('(min-resolution: 2dppx)').matches
      setState(prev => ({ ...prev, isLargeText }))
    }

    detectScreenReader()
    detectHighContrast()
    detectReducedMotion()
    detectLargeText()

    // Set up media query listeners
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(min-resolution: 2dppx)')
    ]

    const listeners = mediaQueries.map(mq => {
      const listener = () => {
        detectScreenReader()
        detectHighContrast()
        detectReducedMotion()
        detectLargeText()
      }
      mq.addEventListener('change', listener)
      return { mq, listener }
    })

    return () => {
      listeners.forEach(({ mq, listener }) => {
        mq.removeEventListener('change', listener)
      })
    }
  }, [enableScreenReader])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcerRef.current) {
        announcerRef.current.destroy()
      }
      if (focusTrapRef.current) {
        focusTrapRef.current.destroy()
      }
    }
  }, [])

  // Announce to screen reader
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.announce(message, priority)
    }
  }, [])

  // Set focus to element
  const setFocus = useCallback((elementId: string) => {
    const element = document.getElementById(elementId)
    if (element && enableFocusManagement) {
      element.focus()
      setState(prev => ({
        ...prev,
        currentFocus: elementId,
        focusHistory: [...prev.focusHistory, elementId].slice(-10)
      }))
      focusHistoryRef.current = [...focusHistoryRef.current, elementId].slice(-10)
    }
  }, [enableFocusManagement])

  // Trap focus within container
  const trapFocus = useCallback((containerId: string) => {
    if (focusTrapRef.current) {
      focusTrapRef.current.destroy()
    }
    focusTrapRef.current = new FocusTrap(containerId)
  }, [])

  // Release focus trap
  const releaseFocus = useCallback(() => {
    if (focusTrapRef.current) {
      focusTrapRef.current.destroy()
      focusTrapRef.current = null
    }
  }, [])

  // Navigate with keyboard
  const navigateWithKeyboard = useCallback((direction: 'next' | 'previous') => {
    if (!enableKeyboardNavigation) return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
    let nextIndex: number

    if (direction === 'next') {
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
    }

    focusableElements[nextIndex]?.focus()
    setState(prev => ({
      ...prev,
      isKeyboardNavigating: true,
      currentFocus: focusableElements[nextIndex]?.id || null
    }))

    // Reset keyboard navigation flag after a delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isKeyboardNavigating: false }))
    }, 1000)
  }, [enableKeyboardNavigation])

  // Check if element is visible
  const isElementVisible = useCallback((elementId: string): boolean => {
    const element = document.getElementById(elementId)
    if (!element) return false

    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0
  }, [])

  // Check if element is focusable
  const isElementFocusable = useCallback((elementId: string): boolean => {
    const element = document.getElementById(elementId)
    if (!element) return false

    const tabIndex = element.getAttribute('tabindex')
    if (tabIndex === '-1') return false

    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') return false

    return true
  }, [])

  // Get focusable elements
  const getFocusableElements = useCallback((containerId?: string): HTMLElement[] => {
    const container = containerId ? document.getElementById(containerId) : document
    if (!container) return []

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      'area[href]',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[]
  }, [])

  // Create focus trap
  const createFocusTrap = useCallback((containerId: string) => {
    return () => {
      trapFocus(containerId)
    }
  }, [trapFocus])

  // ARIA attribute setters
  const addARIALabel = useCallback((elementId: string, label: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-label', label)
    }
  }, [enableARIA])

  const removeARIALabel = useCallback((elementId: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.removeAttribute('aria-label')
    }
  }, [enableARIA])

  const setARIAExpanded = useCallback((elementId: string, expanded: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString())
    }
  }, [enableARIA])

  const setARIAHidden = useCallback((elementId: string, hidden: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-hidden', hidden.toString())
    }
  }, [enableARIA])

  const setARIACurrent = useCallback((elementId: string, current: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-current', current ? 'true' : 'false')
    }
  }, [enableARIA])

  const setARIASelected = useCallback((elementId: string, selected: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-selected', selected.toString())
    }
  }, [enableARIA])

  const setARIARequired = useCallback((elementId: string, required: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-required', required.toString())
    }
  }, [enableARIA])

  const setARIAInvalid = useCallback((elementId: string, invalid: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-invalid', invalid.toString())
    }
  }, [enableARIA])

  const setARIADescribedBy = useCallback((elementId: string, describedBy: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-describedby', describedBy)
    }
  }, [enableARIA])

  const setARIALabelledBy = useCallback((elementId: string, labelledBy: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-labelledby', labelledBy)
    }
  }, [enableARIA])

  const setARIAControls = useCallback((elementId: string, controls: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-controls', controls)
    }
  }, [enableARIA])

  const setARIAOwns = useCallback((elementId: string, owns: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-owns', owns)
    }
  }, [enableARIA])

  const setARIALive = useCallback((elementId: string, live: 'off' | 'polite' | 'assertive') => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-live', live)
    }
  }, [enableARIA])

  const setARIAAtomic = useCallback((elementId: string, atomic: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-atomic', atomic.toString())
    }
  }, [enableARIA])

  const setARIARelevant = useCallback((elementId: string, relevant: 'additions' | 'removals' | 'text' | 'all') => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-relevant', relevant)
    }
  }, [enableARIA])

  const setARIABusy = useCallback((elementId: string, busy: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-busy', busy.toString())
    }
  }, [enableARIA])

  const setARIADisabled = useCallback((elementId: string, disabled: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-disabled', disabled.toString())
    }
  }, [enableARIA])

  const setARIAReadOnly = useCallback((elementId: string, readOnly: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-readonly', readOnly.toString())
    }
  }, [enableARIA])

  const setARIAPressed = useCallback((elementId: string, pressed: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-pressed', pressed.toString())
    }
  }, [enableARIA])

  const setARIAChecked = useCallback((elementId: string, checked: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-checked', checked.toString())
    }
  }, [enableARIA])

  const setARIAValueNow = useCallback((elementId: string, value: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-valuenow', value.toString())
    }
  }, [enableARIA])

  const setARIAValueMin = useCallback((elementId: string, value: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-valuemin', value.toString())
    }
  }, [enableARIA])

  const setARIAValueMax = useCallback((elementId: string, value: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-valuemax', value.toString())
    }
  }, [enableARIA])

  const setARIAValueText = useCallback((elementId: string, value: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-valuetext', value)
    }
  }, [enableARIA])

  const setARIASort = useCallback((elementId: string, sort: 'ascending' | 'descending' | 'none' | 'other') => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-sort', sort)
    }
  }, [enableARIA])

  const setARIASetSize = useCallback((elementId: string, size: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-setsize', size.toString())
    }
  }, [enableARIA])

  const setARIAPosInSet = useCallback((elementId: string, position: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-posinset', position.toString())
    }
  }, [enableARIA])

  const setARIAColIndex = useCallback((elementId: string, index: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-colindex', index.toString())
    }
  }, [enableARIA])

  const setARIARowIndex = useCallback((elementId: string, index: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-rowindex', index.toString())
    }
  }, [enableARIA])

  const setARIAColSpan = useCallback((elementId: string, span: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-colspan', span.toString())
    }
  }, [enableARIA])

  const setARIARowSpan = useCallback((elementId: string, span: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-rowspan', span.toString())
    }
  }, [enableARIA])

  const setARIAColCount = useCallback((elementId: string, count: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-colcount', count.toString())
    }
  }, [enableARIA])

  const setARIARowCount = useCallback((elementId: string, count: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-rowcount', count.toString())
    }
  }, [enableARIA])

  const setARIATableIndex = useCallback((elementId: string, index: number) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tableindex', index.toString())
    }
  }, [enableARIA])

  const setARIATableHeader = useCallback((elementId: string, header: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tableheader', header.toString())
    }
  }, [enableARIA])

  const setARIATableFooter = useCallback((elementId: string, footer: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablefooter', footer.toString())
    }
  }, [enableARIA])

  const setARIATableBody = useCallback((elementId: string, body: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablebody', body.toString())
    }
  }, [enableARIA])

  const setARIATableRow = useCallback((elementId: string, row: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablerow', row.toString())
    }
  }, [enableARIA])

  const setARIATableCell = useCallback((elementId: string, cell: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablecell', cell.toString())
    }
  }, [enableARIA])

  const setARIATableColumnHeader = useCallback((elementId: string, header: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablecolumnheader', header.toString())
    }
  }, [enableARIA])

  const setARIATableRowHeader = useCallback((elementId: string, header: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablerowheader', header.toString())
    }
  }, [enableARIA])

  const setARIATableColumnGroup = useCallback((elementId: string, group: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablecolumngroup', group.toString())
    }
  }, [enableARIA])

  const setARIATableRowGroup = useCallback((elementId: string, group: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablerowgroup', group.toString())
    }
  }, [enableARIA])

  const setARIATableCaption = useCallback((elementId: string, caption: boolean) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablecaption', caption.toString())
    }
  }, [enableARIA])

  const setARIATableSummary = useCallback((elementId: string, summary: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tablesummary', summary)
    }
  }, [enableARIA])

  const setARIATableDescription = useCallback((elementId: string, description: string) => {
    if (!enableARIA) return
    const element = document.getElementById(elementId)
    if (element) {
      element.setAttribute('aria-tabledescription', description)
    }
  }, [enableARIA])

  return {
    // State
    ...state,
    
    // Actions
    announceToScreenReader,
    setFocus,
    trapFocus,
    releaseFocus,
    navigateWithKeyboard,
    
    // Utilities
    isElementVisible,
    isElementFocusable,
    getFocusableElements,
    createFocusTrap,
    
    // ARIA setters
    addARIALabel,
    removeARIALabel,
    setARIAExpanded,
    setARIAHidden,
    setARIACurrent,
    setARIASelected,
    setARIARequired,
    setARIAInvalid,
    setARIADescribedBy,
    setARIALabelledBy,
    setARIAControls,
    setARIAOwns,
    setARIALive,
    setARIAAtomic,
    setARIARelevant,
    setARIABusy,
    setARIADisabled,
    setARIAReadOnly,
    setARIAPressed,
    setARIAChecked,
    setARIAValueNow,
    setARIAValueMin,
    setARIAValueMax,
    setARIAValueText,
    setARIASort,
    setARIASetSize,
    setARIAPosInSet,
    setARIAColIndex,
    setARIARowIndex,
    setARIAColSpan,
    setARIARowSpan,
    setARIAColCount,
    setARIARowCount,
    setARIATableIndex,
    setARIATableHeader,
    setARIATableFooter,
    setARIATableBody,
    setARIATableRow,
    setARIATableCell,
    setARIATableColumnHeader,
    setARIATableRowHeader,
    setARIATableColumnGroup,
    setARIATableRowGroup,
    setARIATableCaption,
    setARIATableSummary,
    setARIATableDescription
  }
}
