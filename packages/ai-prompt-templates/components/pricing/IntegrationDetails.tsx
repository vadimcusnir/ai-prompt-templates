'use client'

import { useState } from 'react'
import { INTEGRATION_DETAILS } from '@/lib/plans'

export default function IntegrationDetails() {
  const [activeTab, setActiveTab] = useState<'apis' | 'sdks' | 'platforms'>('apis')

  const tabs = [
    { id: 'apis', label: 'APIs', count: INTEGRATION_DETAILS.apis.length },
    { id: 'sdks', label: 'SDKs', count: INTEGRATION_DETAILS.sdks.length },
    { id: 'platforms', label: 'Platforms', count: INTEGRATION_DETAILS.platforms.length }
  ]

  const renderAPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {INTEGRATION_DETAILS.apis.map((api, index) => (
        <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-blue-900">{api.name}</h4>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              API
            </span>
          </div>
          
          <p className="text-blue-700 text-sm mb-4">{api.description}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-600 font-medium">Rate Limit:</span>
              <span className="text-blue-700">{api.rateLimit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600 font-medium">Auth:</span>
              <span className="text-blue-700">{api.authentication}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <a
              href={api.documentation}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              View Documentation
              <span className="ml-1">→</span>
            </a>
          </div>
        </div>
      ))}
    </div>
  )

  const renderSDKs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {INTEGRATION_DETAILS.sdks.map((sdk, index) => (
        <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-green-900">{sdk.name}</h4>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              SDK
            </span>
          </div>
          
          <p className="text-green-700 text-sm mb-4">{sdk.description}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600 font-medium">Package:</span>
              <span className="text-green-700 font-mono text-xs">{sdk.npm || sdk.pip}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <a
              href={`https://${sdk.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
            >
              View on GitHub
              <span className="ml-1">→</span>
            </a>
          </div>
        </div>
      ))}
    </div>
  )

  const renderPlatforms = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {INTEGRATION_DETAILS.platforms.map((platform, index) => (
        <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-900">{platform.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              platform.status === 'Available' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {platform.status}
            </span>
          </div>
          
          <p className="text-purple-700 text-sm mb-4">{platform.description}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-600 font-medium">Setup Time:</span>
              <span className="text-purple-700">{platform.setup}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-purple-600 text-sm font-medium">
                Integration Ready
              </span>
              <span className="text-green-500">✓</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Seamless Integration with Your Existing Tools
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Connect AI-Prompt-Templates with your current workflow through our comprehensive 
          APIs, SDKs, and platform integrations. Get started in minutes, not hours.
        </p>
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {INTEGRATION_DETAILS.apis.length}
          </div>
          <div className="text-gray-600">REST & GraphQL APIs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {INTEGRATION_DETAILS.sdks.length}
          </div>
          <div className="text-gray-600">Official SDKs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {INTEGRATION_DETAILS.platforms.length}
          </div>
          <div className="text-gray-600">Platform Integrations</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'apis' && renderAPIs()}
        {activeTab === 'sdks' && renderSDKs()}
        {activeTab === 'platforms' && renderPlatforms()}
      </div>

      {/* Integration CTA */}
      <div className="text-center mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Need Custom Integration?
        </h3>
        <p className="text-gray-600 mb-4">
          Our team can help you build custom integrations for your specific use case.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Contact Integration Team
        </button>
      </div>
    </div>
  )
}
