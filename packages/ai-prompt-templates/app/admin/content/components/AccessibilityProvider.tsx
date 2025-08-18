import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilityContextType {
  // High contrast mode
  highContrast: boolean
  toggleHighContrast: () => void
  
  // Font size
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void
  
  // Reduced motion
  reducedMotion: boolean
  toggleReducedMotion: () => void
  
  // Focus indicators
  showFocusIndicators: boolean
  toggleFocusIndicators: () => void
  
  // Screen reader announcements
  announceToScreenReader: (message: string) => void
  
  // Keyboard navigation
  enableKeyboardNavigation: boolean
  toggleKeyboardNavigation: () => void
  
  // Color blind support
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [showFocusIndicators, setShowFocusIndicators] = useState(true)
  const [enableKeyboardNavigation, setEnableKeyboardNavigation] = useState(true)
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none')

  // Screen reader announcements
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Toggle functions
  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('accessibility_highContrast', String(newValue))
    announceToScreenReader(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion
    setReducedMotion(newValue)
    localStorage.setItem('accessibility_reducedMotion', String(newValue))
    announceToScreenReader(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleFocusIndicators = () => {
    const newValue = !showFocusIndicators
    setShowFocusIndicators(newValue)
    localStorage.setItem('accessibility_showFocusIndicators', String(newValue))
    announceToScreenReader(`Focus indicators ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleKeyboardNavigation = () => {
    const newValue = !enableKeyboardNavigation
    setEnableKeyboardNavigation(newValue)
    localStorage.setItem('accessibility_enableKeyboardNavigation', String(newValue))
    announceToScreenReader(`Keyboard navigation ${newValue ? 'enabled' : 'disabled'}`)
  }

  // Load settings from localStorage
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('accessibility_highContrast')
    const savedFontSize = localStorage.getItem('accessibility_fontSize')
    const savedReducedMotion = localStorage.getItem('accessibility_reducedMotion')
    const savedShowFocusIndicators = localStorage.getItem('accessibility_showFocusIndicators')
    const savedEnableKeyboardNavigation = localStorage.getItem('accessibility_enableKeyboardNavigation')
    const savedColorBlindMode = localStorage.getItem('accessibility_colorBlindMode')

    if (savedHighContrast) setHighContrast(savedHighContrast === 'true')
    if (savedFontSize) setFontSize(savedFontSize as any)
    if (savedReducedMotion) setReducedMotion(savedReducedMotion === 'true')
    if (savedShowFocusIndicators) setShowFocusIndicators(savedShowFocusIndicators === 'true')
    if (savedEnableKeyboardNavigation) setEnableKeyboardNavigation(savedEnableKeyboardNavigation === 'true')
    if (savedColorBlindMode) setColorBlindMode(savedColorBlindMode as any)
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge')
    root.classList.add(`font-${fontSize}`)

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Focus indicators
    if (showFocusIndicators) {
      root.classList.add('show-focus-indicators')
    } else {
      root.classList.remove('show-focus-indicators')
    }

    // Color blind mode
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia')
    if (colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${colorBlindMode}`)
    }
  }, [highContrast, fontSize, reducedMotion, showFocusIndicators, colorBlindMode])

  // Keyboard navigation support
  useEffect(() => {
    if (!enableKeyboardNavigation) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Tab':
          // Enhanced tab navigation
          if (event.shiftKey) {
            // Handle shift+tab for backward navigation
          } else {
            // Handle tab for forward navigation
          }
          break
        case 'Escape':
          // Close modals, dropdowns, etc.
          announceToScreenReader('Escape key pressed')
          break
        case 'Enter':
        case ' ':
          // Activate focused elements
          break
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          // Navigate between elements
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardNavigation, announceToScreenReader])

  // Focus management
  useEffect(() => {
    if (!showFocusIndicators) return

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target) {
        target.classList.add('focused')
        announceToScreenReader(`${target.textContent || target.tagName} focused`)
      }
    }

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target) {
        target.classList.remove('focused')
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [showFocusIndicators, announceToScreenReader])

  const value: AccessibilityContextType = {
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize: (size) => {
      setFontSize(size)
      localStorage.setItem('accessibility_fontSize', size)
      announceToScreenReader(`Font size set to ${size}`)
    },
    reducedMotion,
    toggleReducedMotion,
    showFocusIndicators,
    toggleFocusIndicators,
    announceToScreenReader,
    enableKeyboardNavigation,
    toggleKeyboardNavigation,
    colorBlindMode,
    setColorBlindMode: (mode) => {
      setColorBlindMode(mode)
      localStorage.setItem('accessibility_colorBlindMode', mode)
      announceToScreenReader(`Color blind mode set to ${mode}`)
    }
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Accessibility toolbar component
export const AccessibilityToolbar: React.FC = () => {
  const {
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    toggleReducedMotion,
    showFocusIndicators,
    toggleFocusIndicators,
    colorBlindMode,
    setColorBlindMode
  } = useAccessibility()

  return (
    <div 
      className="accessibility-toolbar"
      role="toolbar"
      aria-label="Accessibility options"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        minWidth: '250px'
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
        Accessibility Options
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={toggleHighContrast}
            style={{ marginRight: '0.5rem' }}
          />
          High Contrast
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Font Size:
        </label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value as any)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xlarge">Extra Large</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={toggleReducedMotion}
            style={{ marginRight: '0.5rem' }}
          />
          Reduced Motion
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={showFocusIndicators}
            onChange={toggleFocusIndicators}
            style={{ marginRight: '0.5rem' }}
          />
          Show Focus Indicators
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Color Blind Support:
        </label>
        <select
          value={colorBlindMode}
          onChange={(e) => setColorBlindMode(e.target.value as any)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="none">None</option>
          <option value="protanopia">Protanopia (Red-Blind)</option>
          <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
          <option value="tritanopia">Tritanopia (Blue-Blind)</option>
        </select>
      </div>
    </div>
  )
}
