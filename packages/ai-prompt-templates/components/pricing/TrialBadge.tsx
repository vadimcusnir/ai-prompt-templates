'use client'

import { TrialConfig } from '@/lib/plans'

interface TrialBadgeProps {
  trial: TrialConfig
  planName: string
}

export default function TrialBadge({ trial, planName }: TrialBadgeProps) {
  if (!trial.enabled) return null

  return (
    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🎯</span>
          <div>
            <div className="font-bold">{trial.days} Days Free Trial</div>
            {trial.noCreditCard && (
              <div className="text-xs opacity-90">No Credit Card Required</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Trial Features Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-20">
        <div className="text-sm text-gray-700">
          <div className="font-semibold text-gray-900 mb-2">Trial Includes:</div>
          <ul className="space-y-1">
            {trial.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            Cancel anytime during trial period
          </div>
        </div>
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
      </div>
    </div>
  )
}
