'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/logger';
import {
  InteractiveDemo,
  AdvancedSearch,
  PerformanceDashboard,
  PersonalizedOnboarding,
  AdvancedContentCuration,
  InteractivePricingCalculator,
  CommunityFeatures,
  AdvancedAnalytics,
  AccessibilityI18n,
  ProgressiveEnhancement,
  SecurityFeatures,
  IntegrationEcosystem
} from '@/components/homepage';

interface Prompt {
  id: string;
  title: string;
  cognitive_category: string;
  required_tier: string;
  cognitive_depth_score: number;
  pattern_complexity: number;
}

export default function HomePage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    fetchPrompts();
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts?tier=free');
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      logError('Failed to fetch prompts', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section - Modernizat */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Heading with Animation */}
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              🧠 AI-Prompt-Templates
            </h1>
            
            {/* Subtitle with Enhanced Typography */}
            <p className={`text-xl md:text-2xl lg:text-3xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              Cognitive Architecture Platform for Advanced AI Prompts
            </p>
            
            {/* Enhanced Description */}
            <p className={`text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              Beyond surface patterns into meaning engineering and cognitive depth. 
              Designed for strategic communicators and cognitive architects.
            </p>

            {/* CTA Buttons with Enhanced Design */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <button 
                onClick={() => router.push('/library')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Explore Cognitive Library</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button 
                onClick={() => router.push('/pricing')}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-600 hover:text-white transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
              >
                View Pricing
              </button>
            </div>

            {/* Social Proof Indicators */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-800 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              {/* Trust Metrics */}
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {prompts.length}+
                </div>
                <div className="text-gray-600 font-medium">Cognitive Frameworks</div>
                <div className="text-sm text-gray-500 mt-1">Trusted by 10K+ users</div>
              </div>

              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  8.5/10
                </div>
                <div className="text-gray-600 font-medium">Quality Score</div>
                <div className="text-sm text-gray-500 mt-1">Industry benchmark</div>
              </div>

              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  €29-299
                </div>
                <div className="text-gray-600 font-medium">Digital Root 2</div>
                <div className="text-sm text-gray-500 mt-1">Optimized pricing</div>
              </div>
            </div>

            {/* Company Logos */}
            <div className={`mt-16 transition-all duration-1000 delay-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <p className="text-gray-500 text-sm mb-6">Trusted by leading companies</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-semibold text-sm">
                  TechCorp
                </div>
                <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-semibold text-sm">
                  AI Labs
                </div>
                <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-semibold text-sm">
                  Innovate
                </div>
                <div className="w-24 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-semibold text-sm">
                  StartupHub
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section - Phase 2 */}
      <InteractiveDemo />

      {/* Advanced Search & Discovery Section - Phase 2 */}
      <AdvancedSearch />

      {/* Community Features Section */}
      <CommunityFeatures />

      {/* Advanced Analytics Section */}
      <AdvancedAnalytics />

      {/* Accessibility & Internationalization Section */}
      <AccessibilityI18n />

      {/* Progressive Enhancement Section */}
      <ProgressiveEnhancement />

      {/* Security Features Section */}
      <SecurityFeatures />

      {/* Integration Ecosystem Section */}
      <IntegrationEcosystem />

      {/* Personalized Onboarding Section - Phase 3 */}
      <PersonalizedOnboarding />

      {/* Advanced Content Curation Section - Phase 3 */}
      <AdvancedContentCuration />

      {/* Interactive Pricing Calculator Section - Phase 3 */}
      <InteractivePricingCalculator />

      {/* Frameworks Grid - Mobile-First */}
      <section className="px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Featured Cognitive Frameworks
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our most popular and effective AI prompt templates
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-xl text-gray-600">Loading cognitive frameworks...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {prompts.slice(0, 6).map((prompt) => (
              <div 
                key={prompt.id} 
                className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/library/${prompt.id}`)}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                    {prompt.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      prompt.required_tier === 'master' ? 'bg-red-500' : 
                      prompt.required_tier === 'elite' ? 'bg-purple-500' : 
                      prompt.required_tier === 'initiate' ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {prompt.required_tier}
                    </span>
                    
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {prompt.cognitive_category.replace('_', ' ')}
                    </span>
                    
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                      €{prompt.required_tier === 'free' ? '0' : 
                         prompt.required_tier === 'architect' ? '29' : 
                         prompt.required_tier === 'initiate' ? '47' : 
                         prompt.required_tier === 'master' ? '83' : 
                         prompt.required_tier === 'elite' ? '299' : '29'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Depth:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${
                              i < prompt.cognitive_depth_score ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs font-medium">{prompt.cognitive_depth_score}/10</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Complexity:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${
                              i < prompt.pattern_complexity ? 'bg-purple-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs font-medium">{prompt.pattern_complexity}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors duration-200">
                    View Details →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Performance Metrics Dashboard - Phase 2 */}
      <PerformanceDashboard />

      {/* Enhanced Platform Status */}
      <section className="px-4 py-16 mx-auto max-w-6xl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              🚀 Platform Performance
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real-time metrics and platform insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-3">
                {prompts.length}+
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-2">Cognitive Frameworks</div>
              <div className="text-sm text-gray-600">Growing library</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-3">8.5/10</div>
              <div className="text-lg font-semibold text-gray-800 mb-2">Quality Score</div>
              <div className="text-sm text-gray-600">Industry leading</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-3">
                €29-299
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-2">Digital Root 2</div>
              <div className="text-sm text-gray-600">Optimized pricing</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}