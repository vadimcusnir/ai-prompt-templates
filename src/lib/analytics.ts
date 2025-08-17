// Analytics and monitoring system for AI-PROMPT-TEMPLATES

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface UserBehavior {
  pageViews: number;
  neuronsViewed: string[];
  searchQueries: string[];
  timeSpent: number;
  lastActivity: Date;
}

// Event types for consistent tracking
export const EVENT_TYPES = {
  // Page interactions
  PAGE_VIEW: 'page_view',
  PAGE_LOAD: 'page_load',
  
  // Search behavior
  SEARCH_QUERY: 'search_query',
  SEARCH_RESULT_CLICK: 'search_result_click',
  
  // Neuron interactions
  NEURON_PREVIEW: 'neuron_preview',
  NEURON_UNLOCK: 'neuron_unlock',
  NEURON_DOWNLOAD: 'neuron_download',
  
  // User actions
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Checkout flow
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_ABANDONED: 'checkout_abandoned',
  
  // Subscription events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  
  // Content access
  CONTENT_ACCESS_GRANTED: 'content_access_granted',
  CONTENT_ACCESS_DENIED: 'content_access_denied',
  
  // Error tracking
  ERROR_OCCURRED: 'error_occurred',
  RATE_LIMIT_HIT: 'rate_limit_hit',
  
  // Performance metrics
  PERFORMANCE_METRIC: 'performance_metric',
  API_RESPONSE_TIME: 'api_response_time',
} as const;

// Analytics service class
class AnalyticsService {
  private isInitialized = false;
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initialize() {
    try {
      // Initialize analytics providers
      await this.initializeProviders();
      this.isInitialized = true;
      
      // Process queued events
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async initializeProviders() {
    // Initialize Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    // Initialize other providers as needed
    // Mixpanel, Amplitude, etc.
  }

  private processQueue() {
    if (!this.isInitialized) return;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  private async sendEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) {
      this.queue.push(event);
      return;
    }

    try {
      // Send to Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.event, {
          ...event.properties,
          user_id: this.userId,
          session_id: this.sessionId,
          timestamp: event.timestamp || Date.now(),
        });
      }

      // Send to internal analytics API
      await this.sendToInternalAPI(event);

      // Send to other providers
      await this.sendToOtherProviders(event);

    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private async sendToInternalAPI(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          userId: this.userId,
          sessionId: this.sessionId,
          timestamp: event.timestamp || Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      console.error('Failed to send to internal API:', error);
    }
  }

  private async sendToOtherProviders(event: AnalyticsEvent) {
    // Implement other analytics providers
    // Mixpanel, Amplitude, etc.
  }

  // Public methods
  public setUserId(userId: string) {
    this.userId = userId;
    
    // Update GA user ID
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  }

  public trackEvent(eventName: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      event: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.sendEvent(event);
  }

  public trackPageView(page: string, properties: Record<string, any> = {}) {
    this.trackEvent(EVENT_TYPES.PAGE_VIEW, {
      page,
      title: document.title,
      url: window.location.href,
      referrer: document.referrer,
      ...properties,
    });
  }

  public trackSearch(query: string, resultsCount: number, filters?: Record<string, any>) {
    this.trackEvent(EVENT_TYPES.SEARCH_QUERY, {
      query,
      results_count: resultsCount,
      filters,
      page: window.location.pathname,
    });
  }

  public trackNeuronInteraction(
    neuronId: string,
    neuronSlug: string,
    action: 'preview' | 'unlock' | 'download',
    properties: Record<string, any> = {}
  ) {
    const eventMap = {
      preview: EVENT_TYPES.NEURON_PREVIEW,
      unlock: EVENT_TYPES.NEURON_UNLOCK,
      download: EVENT_TYPES.NEURON_DOWNLOAD,
    };

    this.trackEvent(eventMap[action], {
      neuron_id: neuronId,
      neuron_slug: neuronSlug,
      action,
      ...properties,
    });
  }

  public trackCheckout(
    type: 'neuron' | 'bundle' | 'subscription',
    itemId: string,
    amount: number,
    currency: string = 'EUR',
    properties: Record<string, any> = {}
  ) {
    this.trackEvent(EVENT_TYPES.CHECKOUT_STARTED, {
      type,
      item_id: itemId,
      amount,
      currency,
      ...properties,
    });
  }

  public trackError(
    error: Error,
    context: string,
    properties: Record<string, any> = {}
  ) {
    this.trackEvent(EVENT_TYPES.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      context,
      url: window.location.href,
      user_agent: navigator.userAgent,
      ...properties,
    });
  }

  public trackPerformance(metric: string, value: number, properties: Record<string, any> = {}) {
    this.trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
      metric,
      value,
      ...properties,
    });
  }

  public trackRateLimit(action: string, limit: number, window: number) {
    this.trackEvent(EVENT_TYPES.RATE_LIMIT_HIT, {
      action,
      limit,
      window,
      url: window.location.href,
    });
  }

  // User behavior tracking
  public startSessionTimer() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - startTime;
      this.trackEvent('session_ended', {
        duration: sessionDuration,
        page: window.location.pathname,
      });
    });
  }

  public trackUserEngagement(action: string, properties: Record<string, any> = {}) {
    this.trackEvent('user_engagement', {
      action,
      timestamp: Date.now(),
      ...properties,
    });
  }
}

// Performance monitoring
class PerformanceMonitor {
  private analytics: AnalyticsService;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor API response times
    this.monitorAPIResponseTimes();
    
    // Monitor resource loading
    this.monitorResourceLoading();
  }

  private monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.analytics.trackPerformance('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.analytics.trackPerformance('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.analytics.trackPerformance('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private monitorAPIResponseTimes() {
    // Intercept fetch requests to measure response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.analytics.trackEvent(EVENT_TYPES.API_RESPONSE_TIME, {
          url: args[0] as string,
          method: args[1]?.method || 'GET',
          duration,
          status: response.status,
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.analytics.trackEvent(EVENT_TYPES.API_RESPONSE_TIME, {
          url: args[0] as string,
          method: args[1]?.method || 'GET',
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        throw error;
      }
    };
  }

  private monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.analytics.trackPerformance('resource_load', resourceEntry.duration, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize,
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }
}

// Error monitoring
class ErrorMonitor {
  private analytics: AnalyticsService;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.analytics.trackError(
        new Error(event.message),
        'global_error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.analytics.trackError(
        new Error(event.reason),
        'unhandled_promise_rejection',
        {
          reason: event.reason,
        }
      );
    });

    // React error boundary support
    if (window.ReactErrorBoundary) {
      window.ReactErrorBoundary.onError = (error: Error, errorInfo: any) => {
        this.analytics.trackError(error, 'react_error_boundary', {
          componentStack: errorInfo.componentStack,
        });
      };
    }
  }
}

// Create and export analytics instance
const analytics = new AnalyticsService();
const performanceMonitor = new PerformanceMonitor(analytics);
const errorMonitor = new ErrorMonitor(analytics);

// Export functions for easy use
export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  analytics.trackEvent(eventName, properties);
};

export const trackPageView = (page: string, properties: Record<string, any> = {}) => {
  analytics.trackPageView(page, properties);
};

export const trackSearch = (query: string, resultsCount: number, filters?: Record<string, any>) => {
  analytics.trackSearch(query, resultsCount, filters);
};

export const trackNeuronInteraction = (
  neuronId: string,
  neuronSlug: string,
  action: 'preview' | 'unlock' | 'download',
  properties: Record<string, any> = {}
) => {
  analytics.trackNeuronInteraction(neuronId, neuronSlug, action, properties);
};

export const trackCheckout = (
  type: 'neuron' | 'bundle' | 'subscription',
  itemId: string,
  amount: number,
  currency: string = 'EUR',
  properties: Record<string, any> = {}
) => {
  analytics.trackCheckout(type, itemId, amount, currency, properties);
};

export const trackError = (error: Error, context: string, properties: Record<string, any> = {}) => {
  analytics.trackError(error, context, properties);
};

export const setUserId = (userId: string) => {
  analytics.setUserId(userId);
};

export const startSessionTimer = () => {
  analytics.startSessionTimer();
};

// Export the main analytics instance
export { analytics as default };
