'use client'

import { MONEY_BACK_GUARANTEE } from '@/lib/plans'

export default function MoneyBackGuarantee() {
  if (!MONEY_BACK_GUARANTEE.enabled) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {MONEY_BACK_GUARANTEE.days}-Day Money-Back Guarantee
          </h3>
          <p className="text-blue-700 mb-4">
            We&apos;re confident you&apos;ll love our cognitive frameworks. If you&apos;re not completely satisfied, 
            we&apos;ll give you a full refund within {MONEY_BACK_GUARANTEE.days} days, no questions asked.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MONEY_BACK_GUARANTEE.conditions.map((condition, index) => (
              <div key={index} className="flex items-center text-sm text-blue-700">
                <span className="text-blue-500 mr-2">✓</span>
                {condition}
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600 font-medium">
                Risk-free trial • Cancel anytime
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-500">Trusted by</span>
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-6 h-6 bg-blue-200 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-blue-600 font-semibold">{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
