'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { 
  type PlanTier,
  formatPrice,
  calculateAnnualSavings,
  isPlanAccessible,
  isCurrentPlan,
  getTrialInfo
} from '@/lib/plans'

import {
  TrialBadge,
  MoneyBackGuarantee,
  EnterpriseContact,
  UsageExamples,
  CustomerTestimonials,
  IntegrationDetails,
  SupportAndSLA
} from '@/components/pricing'

// Tipuri pentru planurile din DB
interface PlanFromDB {
  code: string
  name: string
  percent: number
  monthly: number
  annual: number
  features: string[]
}

interface PlansResponse {
  plans: PlanFromDB[]
  libraryTotal: {
    total_eur: number
    cap_eur: number
  }
}

// Extend Window interface pentru gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: Record<string, any>
    ) => void
  }
}

// Skeleton Loading Component
function PricingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 animate-pulse">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

// Error Display Component
function PricingError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Eroare la încărcarea planurilor
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Încearcă din nou
      </button>
    </div>
  )
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null)
  const [plansFromDB, setPlansFromDB] = useState<PlanFromDB[]>([])
  const [libraryTotal, setLibraryTotal] = useState<{ total_eur: number; cap_eur: number } | null>(null)
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Fetch planurile din DB conform canon-ului
  const fetchPlans = async () => {
    try {
      setPlansLoading(true)
      setPlansError(null)
      
      console.log('🔍 Fetching pricing plans...')
      
      // Timeout pentru fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secunde
      
      const response = await fetch('/api/pricing', { 
        signal: controller.signal 
      })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data: PlansResponse = await response.json()
        console.log('✅ Plans fetched:', data.plans?.length || 0)
        setPlansFromDB(data.plans)
        setLibraryTotal(data.libraryTotal)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setPlansError('Request timeout - falling back to display mode')
        console.log('⏱️ Fetch timeout, using fallback mode')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută'
        setPlansError(errorMessage)
        console.error('❌ Error fetching plans:', error)
      }
    } finally {
      setPlansLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔍 Pricing page mounted, fetching plans...')
    fetchPlans()
  }, [])

  // Verifică dacă planul este accesibil pentru upgrade (simplificat)
  const canAccessPlan = (plan: PlanTier): boolean => true

  // Verifică dacă este planul curent (simplificat)
  const isUserCurrentPlan = (plan: PlanTier): boolean => false

  // Debounced billing cycle change
  const handleBillingCycleChange = (cycle: 'monthly' | 'annual') => {
    setBillingCycle(cycle)
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'billing_cycle_change', {
        event_category: 'pricing',
        event_label: cycle,
        value: cycle === 'annual' ? 1 : 0
      })
    }
  }

  // Handle subscription upgrade
  const handleSubscribe = async (plan: PlanTier) => {
    // Redirect to auth for now
    router.push('/auth')
    return

    if (plan === 'free') return
    if (isUserCurrentPlan(plan)) return

    setSelectedPlan(plan)
    setCheckoutLoading(true)
    setError('')

    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        event_category: 'pricing',
        event_label: plan,
        value: plansFromDB.find(p => p.code === plan)?.monthly || 0,
        currency: 'EUR'
      })
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: plan,
          userId: 'guest',
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        
        // Analytics tracking for errors
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'checkout_error', {
            event_category: 'pricing',
            event_label: plan,
            value: data.error
          })
        }
      } else if (data.url) {
        // Analytics tracking for success
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'checkout_success', {
            event_category: 'pricing',
            event_label: plan,
            value: plansFromDB.find(p => p.code === plan)?.monthly || 0,
            currency: 'EUR'
          })
        }
        
        window.location.href = data.url
      } else {
        setError('Failed to create checkout session')
      }
    } catch (err) {
      setError('An error occurred while processing your request')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <>
      {/* Structured Data pentru SEO */}
      {!plansLoading && !plansError && plansFromDB.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "AI Prompt Templates Cognitive Frameworks",
              "description": "Advanced AI prompts for cognitive depth and meaning engineering",
              "offers": plansFromDB
                .filter((plan) => plan.code !== 'admin')
                .map((plan) => ({
                  "@type": "Offer",
                  "name": `${plan.name} Plan`,
                  "description": `${plan.percent}% access to cognitive frameworks library`,
                  "price": plan.monthly > 0 ? plan.monthly / 100 : 0,
                  "priceCurrency": "EUR",
                  "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": plan.monthly > 0 ? plan.monthly / 100 : 0,
                    "priceCurrency": "EUR",
                    "unitText": "MONTH"
                  }
                }))
            })
          }}
        />
      )}
      
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Cognitive Journey
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock advanced AI frameworks designed for cognitive depth and meaning engineering. 
              All prices follow our digital root 2 algorithm for perfect harmony.
            </p>
            
            {/* Trust Indicators */}
            <div className="mt-8 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Digital Root 2 Pricing
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Cap Global: €9,974
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Evergreen Access Pool
              </div>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-12">
            <div 
              className="bg-white rounded-lg p-1 shadow-sm border"
              role="radiogroup"
              aria-label="Billing cycle selection"
            >
              <button
                onClick={() => handleBillingCycleChange('monthly')}
                disabled={plansLoading}
                aria-pressed={billingCycle === 'monthly'}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                } ${plansLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Monthly
              </button>
              <button
                onClick={() => handleBillingCycleChange('annual')}
                disabled={plansLoading}
                aria-pressed={billingCycle === 'annual'}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                } ${plansLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Annual
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Subscription Plans Grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Subscription Plans
            </h2>
            
            {plansLoading ? (
              <PricingSkeleton />
            ) : plansError ? (
              <PricingError error={plansError} onRetry={fetchPlans} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plansFromDB
                  .filter((plan) => plan.code !== 'free') // Afișează toate planurile
                  .map((plan) => {
                  const price = billingCycle === 'monthly' ? plan.monthly : plan.annual
                  const isAccessible = canAccessPlan(plan.code as PlanTier)
                  const isCurrent = isUserCurrentPlan(plan.code as PlanTier)
                
                return (
                  <div
                    key={plan.code}
                    className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl group ${
                      isCurrent 
                        ? 'border-blue-500 ring-4 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.code === 'elite' ? 'ring-4 ring-purple-100 border-purple-500' : ''}`}
                  >
                    {/* Trial Badge */}
                    <TrialBadge 
                      trial={getTrialInfo(plan.code as PlanTier) || { enabled: false, days: 0, features: [], noCreditCard: false }}
                      planName={plan.name}
                    />

                    {/* Elite Badge */}
                    {plan.code === 'elite' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrent && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="p-8">
                      {/* Plan Header */}
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {plan.name}
                        </h3>
                        
                        {/* Access Percentage */}
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-blue-600">
                            {plan.percent}%
                          </span>
                          <span className="text-gray-600 ml-2">access to library</span>
                        </div>

                        {/* Price */}
                        {plan.monthly > 0 ? (
                          <div>
                            <div className="text-4xl font-bold text-gray-900">
                              {formatPrice(price)}
                            </div>
                            <div className="text-gray-600">
                              per {billingCycle === 'monthly' ? 'month' : 'year'}
                            </div>
                            {billingCycle === 'annual' && plan.monthly > 0 && (
                              <div className="text-sm text-green-600 mt-1">
                                Save €{calculateAnnualSavings(plan.monthly)} per year
                              </div>
                            )}
                            {/* Badge "root-2" conform canon-ului */}
                            <div className="text-xs text-purple-600 mt-2 font-medium">
                              ✓ Digital Root 2
                            </div>
                          </div>
                        ) : (
                          <div className="text-4xl font-bold text-green-600">
                            Free
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-3 mt-0.5">✓</span>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSubscribe(plan.code as PlanTier)}
                        disabled={!isAccessible || isCurrent || checkoutLoading}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                          isCurrent
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : !isAccessible
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : plan.code === 'elite'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isCurrent 
                          ? 'Current Plan' 
                          : !isAccessible 
                            ? 'Downgrade Not Available'
                            : checkoutLoading && selectedPlan === plan.code
                              ? 'Processing...'
                              : plan.monthly > 0
                                ? `Subscribe to ${plan.name}`
                                : 'Get Started Free'
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
              </div>
            )}
          </div>

          {/* Cap Global Banner conform canon-ului */}
          {libraryTotal && libraryTotal.total_eur > libraryTotal.cap_eur && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg mb-8 text-center">
              <div className="flex items-center justify-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="font-semibold">Cap Global Depășit</span>
              </div>
              <p className="text-sm mt-1">
                Librăria a depășit capul de €{libraryTotal.cap_eur.toLocaleString()}. 
                Noi conținuturi vor fi adăugate după ce se va face loc.
              </p>
            </div>
          )}

          {/* Plan Comparison Matrix */}
          {!plansLoading && !plansError && plansFromDB.length > 0 && (
            <div className="mb-20">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
                Plan Comparison Matrix
              </h2>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                        {plansFromDB
                          .filter((plan) => plan.code !== 'free')
                          .map((plan) => (
                            <th key={plan.code} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                              {plan.name}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Library Access</td>
                        {plansFromDB
                          .filter((plan) => plan.code !== 'free')
                          .map((plan) => (
                            <td key={plan.code} className="px-6 py-4 text-center text-sm text-gray-600">
                              {plan.percent}%
                            </td>
                          ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Monthly Price</td>
                        {plansFromDB
                          .filter((plan) => plan.code !== 'free')
                          .map((plan) => (
                            <td key={plan.code} className="px-6 py-4 text-center text-sm text-gray-600">
                              {plan.monthly > 0 ? formatPrice(plan.monthly) : 'Free'}
                            </td>
                          ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Price</td>
                        {plansFromDB
                          .filter((plan) => plan.code !== 'free')
                          .map((plan) => (
                            <td key={plan.code} className="px-6 py-4 text-center text-sm text-gray-600">
                              {plan.annual > 0 ? formatPrice(plan.annual) : 'Free'}
                            </td>
                          ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Digital Root 2</td>
                        {plansFromDB
                          .filter((plan) => plan.code !== 'free')
                          .map((plan) => (
                            <td key={plan.code} className="px-6 py-4 text-center">
                              {plan.monthly > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  ✓ Yes
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Features Count</td>
                        {plansFromDB
                          .filter((plan) => plan.code !== 'free')
                          .map((plan) => (
                            <td key={plan.code} className="px-6 py-4 text-center text-sm text-gray-600">
                              {plan.features.length}
                            </td>
                          ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 text-center">
              {error}
            </div>
          )}

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How does the access percentage work?
                </h3>
                <p className="text-gray-600">
                  Each plan gives you access to a rotating selection of frameworks from our library. 
                  The percentage indicates how much of the library you can access at any given time.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What is Digital Root 2 pricing?
                </h3>
                <p className="text-gray-600">
                  All our prices follow the digital root 2 algorithm, ensuring perfect mathematical harmony. 
                  For example: €29 (2+9=11, 1+1=2).
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I upgrade my plan later?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade to any higher tier at any time. The new access level will be activated immediately.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards, debit cards, and digital wallets through our secure Stripe integration.
                </p>
              </div>
            </div>
          </div>

          {/* Money-Back Guarantee */}
          <MoneyBackGuarantee />

          {/* Enterprise Contact */}
          <EnterpriseContact />

          {/* Usage Examples */}
          <UsageExamples />

          {/* Customer Testimonials */}
          <CustomerTestimonials />

          {/* Integration Details */}
          <IntegrationDetails />

          {/* Support & SLA Information */}
          <SupportAndSLA />

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Cognitive Capabilities?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of professionals who are already using AI-Prompt-Templates to unlock their full potential.
            </p>
            <button
              onClick={() => router.push('/library')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Exploring Frameworks
            </button>
          </div>
        </div>
      </div>
    </>
  )
}