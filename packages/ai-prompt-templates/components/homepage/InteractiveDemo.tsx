'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DemoFramework {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  preview: string;
  example: string;
}

const DEMO_FRAMEWORKS: DemoFramework[] = [
  {
    id: '1',
    title: 'Cognitive Depth Analysis',
    description: 'Advanced framework for analyzing cognitive depth in AI responses',
    category: 'Deep Analysis',
    difficulty: 'Expert',
    preview: 'Analyze the cognitive depth of AI-generated content using multi-layered assessment...',
    example: 'Given an AI response, evaluate its cognitive depth across 5 dimensions: complexity, abstraction, reasoning, creativity, and insight.'
  },
  {
    id: '2',
    title: 'Meaning Engineering Framework',
    description: 'Systematic approach to engineering meaning in AI prompts',
    category: 'Meaning Engineering',
    difficulty: 'Advanced',
    preview: 'Engineer meaning systematically by structuring prompts around core concepts...',
    example: 'Create a prompt that systematically builds meaning through progressive concept introduction and relationship mapping.'
  },
  {
    id: '3',
    title: 'Consciousness Mapping',
    description: 'Framework for mapping consciousness patterns in AI interactions',
    category: 'Consciousness Mapping',
    difficulty: 'Architect',
    preview: 'Map consciousness patterns by identifying awareness levels and self-reflection capabilities...',
    example: 'Design a prompt that enables AI to demonstrate self-awareness and consciousness mapping capabilities.'
  }
];

export default function InteractiveDemo() {
  const router = useRouter();
  const [selectedFramework, setSelectedFramework] = useState<DemoFramework | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'example' | 'interactive'>('preview');
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFrameworkSelect = (framework: DemoFramework) => {
    setSelectedFramework(framework);
    setIsPreviewOpen(true);
    setActiveTab('preview');
  };

  const simulateAIResponse = async (input: string) => {
    setIsGenerating(true);
    setAiResponse('');
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock AI response based on input
    const mockResponse = `Based on your input: "${input}", here's how the ${selectedFramework?.title} framework would process this:

1. **Input Analysis**: The framework analyzes the semantic structure of your request
2. **Pattern Recognition**: Identifies key cognitive patterns and meaning elements
3. **Framework Application**: Applies the specific methodology of ${selectedFramework?.title}
4. **Output Generation**: Produces a structured response following cognitive architecture principles

This demonstrates the power of systematic cognitive frameworks in AI prompt engineering.`;
    
    setAiResponse(mockResponse);
    setIsGenerating(false);
  };

  const handleInteractiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && selectedFramework) {
      simulateAIResponse(userInput);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            🎮 Interactive Demo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our cognitive frameworks in action. Try them out with real examples and see the power of systematic AI prompt engineering.
          </p>
        </div>

        {/* Demo Frameworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {DEMO_FRAMEWORKS.map((framework) => (
            <div
              key={framework.id}
              className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              onClick={() => handleFrameworkSelect(framework)}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                    framework.difficulty === 'expert' ? 'bg-red-500' : 
                    framework.difficulty === 'advanced' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {framework.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {framework.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                  {framework.title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {framework.description}
                </p>
                
                <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors duration-200">
                  Try Demo →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Preview Modal */}
        {isPreviewOpen && selectedFramework && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedFramework.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedFramework.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'preview'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('example')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'example'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Example
                  </button>
                  <button
                    onClick={() => setActiveTab('interactive')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'interactive'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Interactive
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'preview' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800">Framework Overview</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedFramework.preview}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                          selectedFramework.difficulty === 'expert' ? 'bg-red-500' : 
                          selectedFramework.difficulty === 'advanced' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {selectedFramework.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {selectedFramework.category}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'example' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800">Example Implementation</h4>
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <p className="text-blue-800 leading-relaxed font-medium">
                          {selectedFramework.example}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-2">Key Benefits:</h5>
                        <ul className="text-gray-700 space-y-1 text-sm">
                          <li>• Systematic approach to prompt engineering</li>
                          <li>• Consistent results across different use cases</li>
                          <li>• Scalable methodology for complex AI interactions</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'interactive' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800">Try It Yourself</h4>
                      
                      <form onSubmit={handleInteractiveSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your prompt or question:
                          </label>
                          <textarea
                            id="userInput"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Type your prompt here to see how the framework processes it..."
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            required
                          />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={!userInput.trim() || isGenerating}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isGenerating ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            'Process with Framework'
                          )}
                        </button>
                      </form>

                      {/* AI Response Display */}
                      {aiResponse && (
                        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                          <h5 className="font-semibold text-green-800 mb-2">Framework Response:</h5>
                          <div className="text-green-700 leading-relaxed text-sm whitespace-pre-line">
                            {aiResponse}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => router.push('/library')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Explore Full Library →
                  </button>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
