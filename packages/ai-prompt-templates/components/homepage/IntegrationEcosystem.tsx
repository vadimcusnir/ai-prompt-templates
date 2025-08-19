'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ai-platforms' | 'development-tools' | 'data-sources' | 'communication' | 'analytics';
  status: 'available' | 'beta' | 'coming-soon' | 'deprecated';
  apiVersion: string;
  lastUpdated: string;
  documentation: string;
  pricing: 'free' | 'tiered' | 'enterprise';
}

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  rateLimit: string;
  authentication: string[];
  examples: string[];
}

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  payload: object;
  triggers: string[];
  retryPolicy: string;
}

interface SdkLibrary {
  id: string;
  name: string;
  language: string;
  version: string;
  documentation: string;
  githubUrl: string;
  npmPackage?: string;
  pipPackage?: string;
  features: string[];
}

export default function IntegrationEcosystem() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [sdkLibraries, setSdkLibraries] = useState<SdkLibrary[]>([]);
  const [activeTab, setActiveTab] = useState<'integrations' | 'api' | 'webhooks' | 'sdks'>('integrations');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationData();
  }, []);

  const fetchIntegrationData = async () => {
    try {
      // Mock data - in production this would come from v_integrations and v_api_endpoints views
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'OpenAI GPT',
          description: 'Integrate with OpenAI\'s GPT models for enhanced AI capabilities',
          icon: '🤖',
          category: 'ai-platforms',
          status: 'available',
          apiVersion: 'v1',
          lastUpdated: '2024-02-01',
          documentation: 'https://docs.openai.com',
          pricing: 'tiered'
        },
        {
          id: '2',
          name: 'Anthropic Claude',
          description: 'Connect to Claude for advanced reasoning and analysis',
          icon: '🧠',
          category: 'ai-platforms',
          status: 'available',
          apiVersion: 'v1',
          lastUpdated: '2024-01-28',
          documentation: 'https://docs.anthropic.com',
          pricing: 'tiered'
        },
        {
          id: '3',
          name: 'GitHub',
          description: 'Sync with GitHub repositories for version control integration',
          icon: '📚',
          category: 'development-tools',
          status: 'available',
          apiVersion: 'v3',
          lastUpdated: '2024-01-25',
          documentation: 'https://docs.github.com',
          pricing: 'free'
        },
        {
          id: '4',
          name: 'Slack',
          description: 'Send notifications and updates to Slack channels',
          icon: '💬',
          category: 'communication',
          status: 'available',
          apiVersion: 'v1',
          lastUpdated: '2024-01-20',
          documentation: 'https://api.slack.com',
          pricing: 'free'
        },
        {
          id: '5',
          name: 'Google Analytics',
          description: 'Track user behavior and platform analytics',
          icon: '📊',
          category: 'analytics',
          status: 'beta',
          apiVersion: 'v4',
          lastUpdated: '2024-01-15',
          documentation: 'https://developers.google.com/analytics',
          pricing: 'tiered'
        },
        {
          id: '6',
          name: 'Notion',
          description: 'Export prompts and templates to Notion databases',
          icon: '📝',
          category: 'data-sources',
          status: 'coming-soon',
          apiVersion: 'v1',
          lastUpdated: '2024-01-10',
          documentation: 'https://developers.notion.com',
          pricing: 'tiered'
        }
      ];

      const mockApiEndpoints: ApiEndpoint[] = [
        {
          id: '1',
          name: 'Search Neurons',
          description: 'Search through available AI prompt templates',
          method: 'GET',
          path: '/api/v1/neurons/search',
          rateLimit: '100 requests/minute',
          authentication: ['Bearer Token', 'API Key'],
          examples: ['curl -H "Authorization: Bearer {token}" "https://api.example.com/api/v1/neurons/search?q=prompt+engineering"']
        },
        {
          id: '2',
          name: 'Get Neuron Full',
          description: 'Retrieve complete neuron content with access control',
          method: 'POST',
          path: '/api/v1/neurons/{id}/full',
          rateLimit: '60 requests/minute',
          authentication: ['Bearer Token'],
          examples: ['curl -X POST -H "Authorization: Bearer {token}" "https://api.example.com/api/v1/neurons/{id}/full"']
        },
        {
          id: '3',
          name: 'Create Bundle',
          description: 'Create a new bundle of neurons',
          method: 'POST',
          path: '/api/v1/bundles',
          rateLimit: '30 requests/minute',
          authentication: ['Bearer Token'],
          examples: ['curl -X POST -H "Authorization: Bearer {token}" -d \'{"name":"My Bundle","neurons":["id1","id2"]}\' "https://api.example.com/api/v1/bundles"']
        }
      ];

      const mockWebhookEvents: WebhookEvent[] = [
        {
          id: '1',
          name: 'neuron.created',
          description: 'Triggered when a new neuron is created',
          payload: {
            id: 'string',
            title: 'string',
            slug: 'string',
            created_at: 'datetime',
            author_id: 'string'
          },
          triggers: ['Neuron creation', 'Admin action'],
          retryPolicy: 'Exponential backoff, max 3 attempts'
        },
        {
          id: '2',
          name: 'bundle.purchased',
          description: 'Triggered when a bundle is purchased',
          payload: {
            bundle_id: 'string',
            user_id: 'string',
            amount: 'number',
            currency: 'string',
            purchased_at: 'datetime'
          },
          triggers: ['Successful payment', 'Bundle unlock'],
          retryPolicy: 'Exponential backoff, max 5 attempts'
        },
        {
          id: '3',
          name: 'user.subscribed',
          description: 'Triggered when a user subscribes to a plan',
          payload: {
            user_id: 'string',
            plan_id: 'string',
            plan_name: 'string',
            subscribed_at: 'datetime',
            next_billing: 'datetime'
          },
          triggers: ['Subscription creation', 'Plan upgrade'],
          retryPolicy: 'Exponential backoff, max 3 attempts'
        }
      ];

      const mockSdkLibraries: SdkLibrary[] = [
        {
          id: '1',
          name: 'ai-prompt-templates-js',
          language: 'JavaScript/TypeScript',
          version: '2.1.0',
          documentation: 'https://docs.example.com/javascript',
          githubUrl: 'https://github.com/example/ai-prompt-templates-js',
          npmPackage: '@ai-prompt-templates/js',
          features: ['Full API coverage', 'TypeScript support', 'React hooks', 'Error handling']
        },
        {
          id: '2',
          name: 'ai-prompt-templates-python',
          language: 'Python',
          version: '1.8.0',
          documentation: 'https://docs.example.com/python',
          githubUrl: 'https://github.com/example/ai-prompt-templates-python',
          pipPackage: 'ai-prompt-templates',
          features: ['Async support', 'Pandas integration', 'Jupyter notebooks', 'CLI tools']
        },
        {
          id: '3',
          name: 'ai-prompt-templates-go',
          language: 'Go',
          version: '1.5.0',
          documentation: 'https://docs.example.com/go',
          githubUrl: 'https://github.com/example/ai-prompt-templates-go',
          features: ['High performance', 'Context support', 'Middleware', 'Testing utilities']
        }
      ];

      setIntegrations(mockIntegrations);
      setApiEndpoints(mockApiEndpoints);
      setWebhookEvents(mockWebhookEvents);
      setSdkLibraries(mockSdkLibraries);
    } catch (error) {
      console.error('Failed to fetch integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'beta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coming-soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deprecated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai-platforms': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'development-tools': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'data-sources': return 'bg-green-100 text-green-800 border-green-200';
      case 'communication': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'analytics': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800 border-green-200';
      case 'tiered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  if (loading) {
    return (
      <section className="px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading integration ecosystem...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          🔗 Integration Ecosystem
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with your favorite tools and platforms through our comprehensive API
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
          {[
            { id: 'integrations', label: 'Integrations', icon: '🔌' },
            { id: 'api', label: 'API Reference', icon: '📚' },
            { id: 'webhooks', label: 'Webhooks', icon: '🪝' },
            { id: 'sdks', label: 'SDKs', icon: '📦' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {activeTab === 'integrations' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Available Integrations</h3>
              
              {/* Category Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {['ai-platforms', 'development-tools', 'data-sources', 'communication', 'analytics'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <div key={integration.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{integration.icon}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{integration.name}</h4>
                  <p className="text-gray-600 mb-4">{integration.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Version:</span>
                      <span className="text-sm font-medium text-gray-800">{integration.apiVersion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm text-gray-600">{new Date(integration.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(integration.category)}`}>
                      {integration.category.replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPricingColor(integration.pricing)}`}>
                      {integration.pricing}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                      Connect
                    </button>
                    <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                      Docs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">API Reference</h3>
            <div className="space-y-6">
              {apiEndpoints.map((endpoint) => (
                <div key={endpoint.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-2">{endpoint.name}</h4>
                      <p className="text-gray-600">{endpoint.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                      {endpoint.path}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Rate Limit:</div>
                      <div className="text-sm text-gray-600">{endpoint.rateLimit}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Authentication:</div>
                      <div className="flex flex-wrap gap-2">
                        {endpoint.authentication.map((auth, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                            {auth}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Example:</div>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                      {endpoint.examples[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Webhook Events</h3>
            <div className="space-y-6">
              {webhookEvents.map((webhook) => (
                <div key={webhook.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">{webhook.name}</h4>
                  <p className="text-gray-600 mb-4">{webhook.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Triggers:</div>
                      <div className="flex flex-wrap gap-2">
                        {webhook.triggers.map((trigger, index) => (
                          <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Retry Policy:</div>
                      <div className="text-sm text-gray-600">{webhook.retryPolicy}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Payload Schema:</div>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                      {JSON.stringify(webhook.payload, null, 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sdks' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Software Development Kits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sdkLibraries.map((sdk) => (
                <div key={sdk.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">📦</div>
                    <h4 className="text-lg font-semibold text-gray-800">{sdk.name}</h4>
                    <div className="text-sm text-gray-600">{sdk.language}</div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Version:</span>
                      <span className="text-sm font-medium text-gray-800">{sdk.version}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Package:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {sdk.npmPackage || sdk.pipPackage || 'GitHub'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Features:</div>
                    <div className="flex flex-wrap gap-2">
                      {sdk.features.map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                      Install
                    </button>
                    <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                      Docs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Integration Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔑</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Get API Key</h4>
          <p className="text-gray-600 mb-4">Generate your API key to start integrating</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200">
            Generate Key
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">📖</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">API Documentation</h4>
          <p className="text-gray-600 mb-4">Comprehensive API reference and examples</p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200">
            View Docs
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">💬</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Developer Support</h4>
          <p className="text-gray-600 mb-4">Get help with integration and development</p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors duration-200">
            Get Support
          </button>
        </div>
      </div>
    </section>
  );
}
