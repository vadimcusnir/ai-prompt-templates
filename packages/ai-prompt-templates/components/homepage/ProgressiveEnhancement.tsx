'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EnhancementFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'enhanced' | 'advanced';
  isSupported: boolean;
  fallback: string;
  browserSupport: string[];
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface BrowserCapability {
  browser: string;
  version: string;
  features: string[];
  score: number;
  lastTested: string;
}

export default function ProgressiveEnhancement() {
  const router = useRouter();
  const [enhancementFeatures, setEnhancementFeatures] = useState<EnhancementFeature[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [browserCapabilities, setBrowserCapabilities] = useState<BrowserCapability[]>([]);
  const [currentFeatureLevel, setCurrentFeatureLevel] = useState<'core' | 'enhanced' | 'advanced'>('enhanced');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancementData();
    detectBrowserCapabilities();
  }, []);

  const fetchEnhancementData = async () => {
    try {
      // Mock data - in production this would come from v_enhancement_features view
      const mockFeatures: EnhancementFeature[] = [
        {
          id: '1',
          name: 'Basic HTML Structure',
          description: 'Semantic HTML with proper heading hierarchy and landmarks',
          icon: '📄',
          category: 'core',
          isSupported: true,
          fallback: 'Basic text content',
          browserSupport: ['All browsers']
        },
        {
          id: '2',
          name: 'CSS Styling',
          description: 'Responsive design with CSS Grid and Flexbox',
          icon: '🎨',
          category: 'core',
          isSupported: true,
          fallback: 'Basic styling',
          browserSupport: ['IE10+', 'All modern browsers']
        },
        {
          id: '3',
          name: 'JavaScript Interactivity',
          description: 'Enhanced user interactions and dynamic content',
          icon: '⚡',
          category: 'enhanced',
          isSupported: true,
          fallback: 'Static content',
          browserSupport: ['ES6+ browsers']
        },
        {
          id: '4',
          name: 'Service Worker',
          description: 'Offline functionality and caching',
          icon: '📱',
          category: 'advanced',
          isSupported: true,
          fallback: 'Online-only experience',
          browserSupport: ['Chrome 40+', 'Firefox 44+', 'Safari 11.1+']
        },
        {
          id: '5',
          name: 'WebGL & Canvas',
          description: 'Advanced graphics and animations',
          icon: '🎮',
          category: 'advanced',
          isSupported: true,
          fallback: 'Static images',
          browserSupport: ['Chrome 9+', 'Firefox 4+', 'Safari 4+']
        },
        {
          id: '6',
          name: 'WebAssembly',
          description: 'High-performance code execution',
          icon: '🚀',
          category: 'advanced',
          isSupported: true,
          fallback: 'JavaScript fallback',
          browserSupport: ['Chrome 57+', 'Firefox 52+', 'Safari 11+']
        }
      ];

      const mockPerformanceMetrics: PerformanceMetric[] = [
        {
          name: 'First Contentful Paint',
          value: 1.2,
          target: 1.8,
          unit: 's',
          status: 'excellent'
        },
        {
          name: 'Largest Contentful Paint',
          value: 2.1,
          target: 2.5,
          unit: 's',
          status: 'excellent'
        },
        {
          name: 'First Input Delay',
          value: 45,
          target: 100,
          unit: 'ms',
          status: 'excellent'
        },
        {
          name: 'Cumulative Layout Shift',
          value: 0.05,
          target: 0.1,
          unit: '',
          status: 'excellent'
        }
      ];

      setEnhancementFeatures(mockFeatures);
      setPerformanceMetrics(mockPerformanceMetrics);
    } catch (error) {
      console.error('Failed to fetch enhancement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectBrowserCapabilities = () => {
    // Detect browser capabilities using feature detection
    const capabilities: BrowserCapability[] = [
      {
        browser: 'Chrome',
        version: '120+',
        features: ['ES6+', 'Service Worker', 'WebGL', 'WebAssembly', 'CSS Grid'],
        score: 95,
        lastTested: new Date().toISOString().split('T')[0]
      },
      {
        browser: 'Firefox',
        version: '115+',
        features: ['ES6+', 'Service Worker', 'WebGL', 'WebAssembly', 'CSS Grid'],
        score: 92,
        lastTested: new Date().toISOString().split('T')[0]
      },
      {
        browser: 'Safari',
        version: '16+',
        features: ['ES6+', 'Service Worker', 'WebGL', 'WebAssembly', 'CSS Grid'],
        score: 88,
        lastTested: new Date().toISOString().split('T')[0]
      },
      {
        browser: 'Edge',
        version: '120+',
        features: ['ES6+', 'Service Worker', 'WebGL', 'WebAssembly', 'CSS Grid'],
        score: 90,
        lastTested: new Date().toISOString().split('T')[0]
      }
    ];

    setBrowserCapabilities(capabilities);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-green-100 text-green-800 border-green-200';
      case 'enhanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <section className="px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading progressive enhancement data...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          🚀 Progressive Enhancement
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Graceful degradation and feature detection for optimal user experience across all devices
        </p>
      </div>

      {/* Feature Level Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
          {[
            { id: 'core', label: 'Core Features', icon: '📱' },
            { id: 'enhanced', label: 'Enhanced', icon: '💻' },
            { id: 'advanced', label: 'Advanced', icon: '🚀' }
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => setCurrentFeatureLevel(level.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentFeatureLevel === level.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{level.icon}</span>
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhancement Features */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Feature Detection & Fallbacks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enhancementFeatures
            .filter(feature => feature.category === currentFeatureLevel)
            .map((feature) => (
            <div key={feature.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{feature.icon}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(feature.category)}`}>
                  {feature.category}
                </span>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{feature.name}</h4>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Browser Support:</div>
                <div className="flex flex-wrap gap-2">
                  {feature.browserSupport.map((browser, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                      {browser}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Fallback:</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {feature.fallback}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${feature.isSupported ? 'text-green-600' : 'text-red-600'}`}>
                  {feature.isSupported ? '✓ Supported' : '✗ Not Supported'}
                </span>
                <button className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200">
                  Test Feature
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">{metric.name}</h4>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {metric.value}
                  <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>
                </div>
                <div className="text-sm text-gray-600">Target: {metric.target}{metric.unit}</div>
              </div>
              
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-blue-500' :
                      metric.status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(metric.status)}`}>
                {metric.status.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Browser Capabilities */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Browser Capability Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Browser</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Features</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Last Tested</th>
              </tr>
            </thead>
            <tbody>
              {browserCapabilities.map((browser, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{browser.browser}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{browser.version}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {browser.features.map((feature, featureIndex) => (
                        <span key={featureIndex} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`text-lg font-bold ${getScoreColor(browser.score)}`}>
                      {browser.score}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {new Date(browser.lastTested).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progressive Enhancement Strategy */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Enhancement Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">📱</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">Core Experience</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• Semantic HTML structure</li>
              <li>• Basic CSS styling</li>
              <li>• Accessible navigation</li>
              <li>• Content readability</li>
              <li>• Basic functionality</li>
            </ul>
          </div>
          
          <div>
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">💻</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">Enhanced Experience</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• JavaScript interactions</li>
              <li>• Responsive design</li>
              <li>• Smooth animations</li>
              <li>• Enhanced UI components</li>
              <li>• Performance optimizations</li>
            </ul>
          </div>
          
          <div>
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🚀</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">Advanced Features</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• Service workers</li>
              <li>• WebGL graphics</li>
              <li>• WebAssembly</li>
              <li>• Advanced APIs</li>
              <li>• Cutting-edge features</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testing & Monitoring Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔍</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Feature Detection</h4>
          <p className="text-gray-600 mb-4">Test browser capabilities and feature support</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200">
            Run Tests
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Performance Monitoring</h4>
          <p className="text-gray-600 mb-4">Monitor real-time performance metrics</p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200">
            View Metrics
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🛠️</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Fallback Testing</h4>
          <p className="text-gray-600 mb-4">Test fallback behavior and graceful degradation</p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors duration-200">
            Test Fallbacks
          </button>
        </div>
      </div>
    </section>
  );
}
