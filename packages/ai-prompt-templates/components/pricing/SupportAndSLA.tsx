'use client'

import { useState } from 'react'
import { PlanTier, getSupportInfo, getSLAInfo, SUBSCRIPTION_PLANS } from '@/lib/plans'

interface SupportAndSLAProps {
  selectedPlan?: PlanTier
}

export default function SupportAndSLA({ selectedPlan }: SupportAndSLAProps) {
  const [activePlan, setActivePlan] = useState<PlanTier>(selectedPlan || 'explorer')
  
  const plans: PlanTier[] = ['free', 'explorer', 'architect', 'initiate', 'master', 'elite']
  const support = getSupportInfo(activePlan)
  const sla = getSLAInfo(activePlan)
  const planConfig = SUBSCRIPTION_PLANS[activePlan]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'dedicated': return 'bg-purple-100 text-purple-800'
      case 'priority': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'dedicated': return '👑'
      case 'priority': return '⚡'
      default: return '📧'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Support & Service Level Agreements
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Every plan includes comprehensive support and clear service guarantees. 
          Choose the level that matches your business needs.
        </p>
      </div>

      {/* Plan Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          {plans.map((plan) => (
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
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Support Levels */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🛟</span>
            <h3 className="text-xl font-bold text-blue-900">Support Levels</h3>
          </div>
          
          <div className="space-y-4">
            {/* Priority Badge */}
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">Priority Level:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(support.priority)}`}>
                <span className="mr-2">{getPriorityIcon(support.priority)}</span>
                {support.priority.charAt(0).toUpperCase() + support.priority.slice(1)}
              </span>
            </div>

            {/* Support Channels */}
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-900">Available Channels:</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Email Support</span>
                  <span className={support.email ? 'text-green-600' : 'text-red-600'}>
                    {support.email ? '✓ Available' : '✗ Not Available'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Live Chat</span>
                  <span className={support.chat ? 'text-green-600' : 'text-red-600'}>
                    {support.chat ? '✓ Available' : '✗ Not Available'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Phone Support</span>
                  <span className={support.phone ? 'text-green-600' : 'text-red-600'}>
                    {support.phone ? '✓ Available' : '✗ Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">Response Time:</span>
                <span className="text-blue-900 font-semibold">{support.responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Information */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📋</span>
            <h3 className="text-xl font-bold text-green-900">Service Level Agreement</h3>
          </div>
          
          <div className="space-y-4">
            {/* Uptime */}
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">Uptime Guarantee:</span>
              <span className="text-green-900 font-semibold">{sla.uptime}</span>
            </div>

            {/* Response Time */}
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">Response Time:</span>
              <span className="text-green-900 font-semibold">{sla.responseTime}</span>
            </div>

            {/* Support Response */}
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">Support Hours:</span>
              <span className="text-green-900 font-semibold">{sla.supportResponse}</span>
            </div>

            {/* Compensation */}
            <div className="pt-4 border-t border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-medium">Compensation:</span>
                <span className="text-green-900 font-semibold text-sm">{sla.compensation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Support Comparison Across Plans
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                {plans.map((plan) => (
                  <th key={plan} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Email Support</td>
                {plans.map((plan) => {
                  const planSupport = getSupportInfo(plan)
                  return (
                    <td key={plan} className="px-4 py-3 text-center">
                      <span className={planSupport.email ? 'text-green-600' : 'text-red-600'}>
                        {planSupport.email ? '✓' : '✗'}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Live Chat</td>
                {plans.map((plan) => {
                  const planSupport = getSupportInfo(plan)
                  return (
                    <td key={plan} className="px-4 py-3 text-center">
                      <span className={planSupport.chat ? 'text-green-600' : 'text-red-600'}>
                        {planSupport.chat ? '✓' : '✗'}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Phone Support</td>
                {plans.map((plan) => {
                  const planSupport = getSupportInfo(plan)
                  return (
                    <td key={plan} className="px-4 py-3 text-center">
                      <span className={planSupport.phone ? 'text-green-600' : 'text-red-600'}>
                        {planSupport.phone ? '✓' : '✗'}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Response Time</td>
                {plans.map((plan) => {
                  const planSupport = getSupportInfo(plan)
                  return (
                    <td key={plan} className="px-4 py-3 text-center text-sm text-gray-600">
                      {planSupport.responseTime}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Uptime</td>
                {plans.map((plan) => {
                  const planSLA = getSLAInfo(plan)
                  return (
                    <td key={plan} className="px-4 py-3 text-center text-sm text-gray-600">
                      {planSLA.uptime}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Support CTA */}
      <div className="text-center mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Need Immediate Assistance?
        </h3>
        <p className="text-gray-600 mb-4">
          Our support team is here to help you get the most out of AI-Prompt-Templates.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Contact Support
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  )
}
