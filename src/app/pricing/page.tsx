'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

import { 
  SUBSCRIPTION_PLANS, 
  BUNDLES, 
  type PlanTier,
  formatPrice,
  calculateAnnualSavings,
  isPlanAccessible,
  isCurrentPlan
} from '@/lib/plans'

export default function PricingPage() {
  const { user, userTier, loading } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null)
  const [selectedBundle, setSelectedBundle] = useState<keyof typeof BUNDLES | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Verifică dacă planul este accesibil pentru upgrade
  const canAccessPlan = (plan: PlanTier): boolean => isPlanAccessible(userTier, plan)

  // Verifică dacă este planul curent
  const isUserCurrentPlan = (plan: PlanTier): boolean => isCurrentPlan(userTier, plan)

  // Handle subscription upgrade
  const handleSubscribe = async (plan: PlanTier) => {
    if (!user) {
      router.push('/auth')
      return
    }

    if (plan === 'free') return
    if (isUserCurrentPlan(plan)) return

    setSelectedPlan(plan)
    setCheckoutLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingCycle,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.url) {
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

  // Handle bundle purchase
  const handleBuyBundle = async (bundleKey: keyof typeof BUNDLES) => {
    if (!user) {
      router.push('/auth')
      return
    }

    setSelectedBundle(bundleKey)
    setCheckoutLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundle: bundleKey,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.url) {
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
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(Object.keys(SUBSCRIPTION_PLANS) as PlanTier[]).map((planKey) => {
              const plan = SUBSCRIPTION_PLANS[planKey]
              const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                             const isAccessible = canAccessPlan(planKey)
               const isCurrent = isUserCurrentPlan(planKey)
              
              return (
                <div
                  key={planKey}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                    isCurrent 
                      ? 'border-blue-500 ring-4 ring-blue-100' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${planKey === 'elite' ? 'ring-4 ring-purple-100 border-purple-500' : ''}`}
                >
                  {/* Elite Badge */}
                  {planKey === 'elite' && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrent && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
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
                      <p className="text-gray-600 mb-4">
                        {plan.description}
                      </p>
                      
                      {/* Access Percentage */}
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-blue-600">
                          {plan.percentAccess}%
                        </span>
                        <span className="text-gray-600 ml-2">access to library</span>
                      </div>

                      {/* Price */}
                      {plan.monthlyPrice > 0 ? (
                        <div>
                          <div className="text-4xl font-bold text-gray-900">
                            {formatPrice(price)}
                          </div>
                          <div className="text-gray-600">
                            per {billingCycle === 'monthly' ? 'month' : 'year'}
                          </div>
                                                     {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                             <div className="text-sm text-green-600 mt-1">
                               Save €{calculateAnnualSavings(plan.monthlyPrice)} per year
                             </div>
                           )}
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
                      onClick={() => handleSubscribe(planKey)}
                      disabled={!isAccessible || isCurrent || checkoutLoading}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : !isAccessible
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : planKey === 'elite'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isCurrent 
                        ? 'Current Plan' 
                        : !isAccessible 
                          ? 'Downgrade Not Available'
                          : checkoutLoading && selectedPlan === planKey
                            ? 'Processing...'
                            : plan.monthlyPrice > 0
                              ? `Subscribe to ${plan.name}`
                              : 'Get Started Free'
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bundles Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            One-Time Bundles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(Object.keys(BUNDLES) as Array<keyof typeof BUNDLES>).map((bundleKey) => {
              const bundle = BUNDLES[bundleKey]
              
              return (
                <div
                  key={bundleKey}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transition-all duration-200 hover:shadow-xl hover:border-gray-300"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {bundle.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {bundle.description}
                    </p>
                    
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {formatPrice(bundle.price)}
                    </div>
                    <div className="text-gray-600">
                      {bundle.items} framework-uri
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {bundle.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-3 mt-0.5">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => handleBuyBundle(bundleKey)}
                    disabled={checkoutLoading}
                    className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {checkoutLoading && selectedBundle === bundleKey
                      ? 'Processing...'
                      : `Buy ${bundle.name}`
                    }
                  </button>
                </div>
              )
            })}
          </div>
        </div>

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
  )
}