'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useLocalStorageCache } from './useCache'

interface Locale {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  dateFormat: string
  timeFormat: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
}

interface Translation {
  [key: string]: string | Translation | ((params: Record<string, any>) => string)
}

interface I18nConfig {
  defaultLocale: string
  fallbackLocale: string
  supportedLocales: string[]
  loadLocaleData: (locale: string) => Promise<Translation>
  pluralRules?: Intl.PluralRules
  numberFormats?: Intl.NumberFormat[]
  dateFormats?: Intl.DateTimeFormat[]
}

interface UseI18nReturn {
  // State
  locale: string
  direction: 'ltr' | 'rtl'
  isLoading: boolean
  
  // Actions
  setLocale: (locale: string) => Promise<void>
  t: (key: string, params?: Record<string, any>, count?: number) => string
  n: (value: number, options?: Intl.NumberFormatOptions) => string
  d: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string
  c: (value: number, currency: string, options?: Intl.NumberFormatOptions) => string
  
  // Utilities
  getSupportedLocales: () => Locale[]
  getCurrentLocale: () => Locale | null
  isRTL: () => boolean
  formatPlural: (count: number, forms: string[]) => string
  interpolate: (template: string, params: Record<string, any>) => string
}

// Default locales configuration
const defaultLocales: Locale[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    }
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: 'RON'
    }
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: '€'
    }
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: '€'
    }
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: '€'
    }
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: 'د.ك'
    }
  }
]

// Pluralization rules for different languages
const pluralRules: Record<string, (count: number) => number> = {
  en: (count) => count === 1 ? 0 : 1,
  ro: (count) => count === 1 ? 0 : count === 0 || (count % 100 >= 1 && count % 100 <= 19) ? 1 : 2,
  es: (count) => count === 1 ? 0 : 1,
  fr: (count) => count === 0 || count === 1 ? 0 : 1,
  de: (count) => count === 1 ? 0 : 1,
  ar: (count) => count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count % 100 >= 3 && count % 100 <= 10 ? 3 : 4
}

// Default translations
const defaultTranslations: Record<string, Translation> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success!',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      next: 'Next',
      previous: 'Previous',
      first: 'First',
      last: 'Last',
      of: 'of',
      items: 'items',
      noResults: 'No results found',
      loadingMore: 'Loading more...',
      retry: 'Retry',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      forward: 'Forward',
      refresh: 'Refresh',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      country: 'Country',
      postalCode: 'Postal Code',
      submit: 'Submit',
      reset: 'Reset',
      clear: 'Clear',
      apply: 'Apply',
      select: 'Select',
      choose: 'Choose',
      upload: 'Upload',
      download: 'Download',
      share: 'Share',
      copy: 'Copy',
      paste: 'Paste',
      cut: 'Cut',
      undo: 'Undo',
      redo: 'Redo',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit Fullscreen',
      help: 'Help',
      about: 'About',
      contact: 'Contact',
      support: 'Support',
      feedback: 'Feedback',
      report: 'Report',
      block: 'Block',
      unblock: 'Unblock',
      follow: 'Follow',
      unfollow: 'Unfollow',
      like: 'Like',
      unlike: 'Unlike',
      comment: 'Comment',
      reply: 'Reply',
      share: 'Share',
      bookmark: 'Bookmark',
      unbookmark: 'Unbookmark',
      subscribe: 'Subscribe',
      unsubscribe: 'Unsubscribe',
      notifications: 'Notifications',
      privacy: 'Privacy',
      terms: 'Terms',
      conditions: 'Conditions',
      cookies: 'Cookies',
      accessibility: 'Accessibility',
      language: 'Language',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      auto: 'Auto',
      on: 'On',
      off: 'Off',
      enabled: 'Enabled',
      disabled: 'Disabled',
      active: 'Active',
      inactive: 'Inactive',
      visible: 'Visible',
      hidden: 'Hidden',
      public: 'Public',
      private: 'Private',
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived',
      deleted: 'Deleted',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      inProgress: 'In Progress',
      scheduled: 'Scheduled',
      overdue: 'Overdue',
      urgent: 'Urgent',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
      info: 'Info',
      warning: 'Warning',
      error: 'Error',
      debug: 'Debug',
      trace: 'Trace',
      fatal: 'Fatal'
    }
  }
}

export function useI18n(config?: Partial<I18nConfig>): UseI18nReturn {
  const [locale, setLocaleState] = useLocalStorageCache('i18n-locale', 'en')
  const [translations, setTranslations] = useState<Record<string, Translation>>(defaultTranslations)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<Locale | null>(
    defaultLocales.find(l => l.code === locale) || defaultLocales[0]
  )

  const {
    defaultLocale = 'en',
    fallbackLocale = 'en',
    supportedLocales = defaultLocales.map(l => l.code),
    loadLocaleData,
    pluralRules: customPluralRules,
    numberFormats,
    dateFormats
  } = config || {}

  // Load locale data
  const loadLocale = useCallback(async (localeCode: string) => {
    if (!supportedLocales.includes(localeCode)) {
      console.warn(`Locale ${localeCode} is not supported`)
      return
    }

    setIsLoading(true)
    try {
      let localeData: Translation

      if (loadLocaleData) {
        localeData = await loadLocaleData(localeCode)
      } else {
        // Use default translations or load from public/locales
        localeData = defaultTranslations[localeCode] || defaultTranslations[fallbackLocale]
      }

      setTranslations(prev => ({
        ...prev,
        [localeCode]: localeData
      }))

      const localeInfo = defaultLocales.find(l => l.code === localeCode)
      if (localeInfo) {
        setCurrentLocale(localeInfo)
        setLocaleState(localeCode)
        
        // Update document direction
        document.documentElement.dir = localeInfo.direction
        document.documentElement.lang = localeCode
      }
    } catch (error) {
      console.error(`Failed to load locale ${localeCode}:`, error)
      // Fallback to default locale
      if (localeCode !== fallbackLocale) {
        await loadLocale(fallbackLocale)
      }
    } finally {
      setIsLoading(false)
    }
  }, [supportedLocales, loadLocaleData, fallbackLocale, setLocaleState])

  // Set locale
  const setLocale = useCallback(async (localeCode: string) => {
    await loadLocale(localeCode)
  }, [loadLocale])

  // Get translation
  const t = useCallback((key: string, params?: Record<string, any>, count?: number): string => {
    const keys = key.split('.')
    let translation: any = translations[locale] || translations[fallbackLocale]

    // Navigate to nested key
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k]
      } else {
        // Fallback to default locale
        translation = defaultTranslations[fallbackLocale]
        for (const fallbackKey of keys) {
          if (translation && typeof translation === 'object' && fallbackKey in translation) {
            translation = translation[fallbackKey]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }

    if (typeof translation === 'function') {
      return translation(params || {})
    }

    if (typeof translation === 'string') {
      let result = translation

      // Handle pluralization
      if (count !== undefined) {
        const pluralRule = customPluralRules || pluralRules[locale] || pluralRules[fallbackLocale]
        if (pluralRule) {
          const pluralIndex = pluralRule(count)
          const pluralForms = result.split('|')
          if (pluralForms[pluralIndex]) {
            result = pluralForms[pluralIndex]
          }
        }
      }

      // Interpolate parameters
      if (params) {
        result = interpolate(result, params)
      }

      return result
    }

    return key
  }, [locale, translations, fallbackLocale, customPluralRules])

  // Number formatting
  const n = useCallback((value: number, options?: Intl.NumberFormatOptions): string => {
    try {
      const formatter = new Intl.NumberFormat(locale, options)
      return formatter.format(value)
    } catch {
      return value.toString()
    }
  }, [locale])

  // Date formatting
  const d = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      const formatter = new Intl.DateTimeFormat(locale, options)
      return formatter.format(dateObj)
    } catch {
      return date.toString()
    }
  }, [locale])

  // Currency formatting
  const c = useCallback((value: number, currency: string, options?: Intl.NumberFormatOptions): string => {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        ...options
      })
      return formatter.format(value)
    } catch {
      return `${value} ${currency}`
    }
  }, [locale])

  // Get supported locales
  const getSupportedLocales = useCallback((): Locale[] => {
    return defaultLocales.filter(locale => supportedLocales.includes(locale.code))
  }, [supportedLocales])

  // Get current locale
  const getCurrentLocale = useCallback((): Locale | null => {
    return currentLocale
  }, [currentLocale])

  // Check if RTL
  const isRTL = useCallback((): boolean => {
    return currentLocale?.direction === 'rtl'
  }, [currentLocale])

  // Format plural
  const formatPlural = useCallback((count: number, forms: string[]): string => {
    const pluralRule = customPluralRules || pluralRules[locale] || pluralRules[fallbackLocale]
    if (pluralRule && forms.length > 0) {
      const pluralIndex = Math.min(pluralRule(count), forms.length - 1)
      return forms[pluralIndex]
    }
    return forms[0] || ''
  }, [locale, fallbackLocale, customPluralRules])

  // Interpolate template
  const interpolate = useCallback((template: string, params: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }, [])

  // Initialize locale
  useEffect(() => {
    loadLocale(locale)
  }, [locale, loadLocale])

  // Update document attributes when locale changes
  useEffect(() => {
    if (currentLocale) {
      document.documentElement.dir = currentLocale.direction
      document.documentElement.lang = currentLocale.code
    }
  }, [currentLocale])

  return {
    // State
    locale,
    direction: currentLocale?.direction || 'ltr',
    isLoading,
    
    // Actions
    setLocale,
    t,
    n,
    d,
    c,
    
    // Utilities
    getSupportedLocales,
    getCurrentLocale,
    isRTL,
    formatPlural,
    interpolate
  }
}

// Hook for component-specific translations
export function useTranslations(namespace: string) {
  const { t, locale, isLoading } = useI18n()
  
  const translate = useCallback((key: string, params?: Record<string, any>, count?: number) => {
    return t(`${namespace}.${key}`, params, count)
  }, [t, namespace])
  
  return {
    t: translate,
    locale,
    isLoading
  }
}

// Hook for number formatting
export function useNumberFormat() {
  const { n, locale } = useI18n()
  
  const formatNumber = useCallback((value: number, options?: Intl.NumberFormatOptions) => {
    return n(value, options)
  }, [n])
  
  const formatPercent = useCallback((value: number, options?: Intl.NumberFormatOptions) => {
    return n(value, { style: 'percent', ...options })
  }, [n])
  
  const formatCurrency = useCallback((value: number, currency: string, options?: Intl.NumberFormatOptions) => {
    return n(value, { style: 'currency', currency, ...options })
  }, [n])
  
  return {
    formatNumber,
    formatPercent,
    formatCurrency,
    locale
  }
}

// Hook for date formatting
export function useDateFormat() {
  const { d, locale } = useI18n()
  
  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return d(date, options)
  }, [d])
  
  const formatTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return d(date, { ...options, timeStyle: 'short' })
  }, [d])
  
  const formatDateTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return d(date, { ...options, dateStyle: 'medium', timeStyle: 'short' })
  }, [d])
  
  const formatRelative = useCallback((date: Date | string | number) => {
    const now = new Date()
    const targetDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }, [])
  
  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelative,
    locale
  }
}
