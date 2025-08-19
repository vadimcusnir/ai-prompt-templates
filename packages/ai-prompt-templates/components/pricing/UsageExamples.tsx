'use client'

import { useState } from 'react'
import { UsageExample, PlanTier, getUsageExamples } from '@/lib/plans'

interface UsageExamplesProps {
  selectedPlan?: PlanTier
}

export default function UsageExamples({ selectedPlan }: UsageExamplesProps) {
  const [activePlan, setActivePlan] = useState<PlanTier>(selectedPlan || 'explorer')
  const [selectedExample, setSelectedExample] = useState<UsageExample | null>(null)

  const plans: PlanTier[] = ['free', 'explorer', 'architect', 'initiate', 'master', 'elite']
  const examples = getUsageExamples(activePlan)

  if (examples.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          See AI-Prompt-Templates in Action
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover how each plan empowers you to create, customize, and deploy cognitive frameworks 
          that transform your AI interactions.
        </p>
      </div>

      {/* Plan Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          {plans.map((plan) => {
            const planExamples = getUsageExamples(plan)
            if (planExamples.length === 0) return null
            
            return (
              <button
                key={plan}
                onClick={() => setActivePlan(plan)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePlan === plan
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {planExamples.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples.map((example, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => setSelectedExample(example)}
          >
            {/* Screenshot Placeholder */}
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-32 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="text-center">
                <span className="text-4xl mb-2 block">📱</span>
                <span className="text-xs text-gray-600">Screenshot</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {example.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {example.description}
              </p>
              
              <div className="flex items-center justify-between pt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  example.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-800'
                    : example.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {example.difficulty.charAt(0).toUpperCase() + example.difficulty.slice(1)}
                </span>
                
                <span className="text-xs text-gray-500">
                  {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} Plan
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Example Modal */}
      {selectedExample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedExample.title}
                </h3>
                <button
                  onClick={() => setSelectedExample(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              {/* Full Screenshot */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-64 mb-6 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📱</span>
                  <span className="text-lg text-gray-600">Full Screenshot View</span>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedExample.screenshot}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedExample.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Plan</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedExample.plan.charAt(0).toUpperCase() + selectedExample.plan.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Difficulty</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedExample.difficulty === 'beginner' 
                        ? 'bg-green-100 text-green-800'
                        : selectedExample.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedExample.difficulty.charAt(0).toUpperCase() + selectedExample.difficulty.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Interactive interface</li>
                      <li>• Real-time preview</li>
                      <li>• Export options</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedExample(null)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Close Example
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
