'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Prompt {
  id: number
  title: string
  slug: string
  preview_content: string
  content: string
  cognitive_category: string
  required_tier: string
  quality_score: number
  digital_root: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export default function LibraryPage() {
  // Mock data pentru afișare imediată
  const mockPrompts: Prompt[] = [
    {
      id: 1,
      title: "Cognitive Depth Analysis Framework",
      slug: "cognitive-depth-analysis-framework",
      preview_content: "Advanced framework for analyzing cognitive depth in AI responses with multi-layered assessment capabilities",
      content: "This comprehensive framework provides systematic approaches to evaluate and enhance the cognitive depth of AI-generated content...",
      cognitive_category: "deep_analysis",
      required_tier: "master",
      quality_score: 9,
      digital_root: 2,
      is_published: true,
      created_at: "2024-12-15T10:00:00Z",
      updated_at: "2024-12-15T10:00:00Z"
    },
    {
      id: 2,
      title: "Consciousness Mapping Protocol",
      slug: "consciousness-mapping-protocol",
      preview_content: "Framework for mapping consciousness patterns in AI interactions and self-awareness",
      content: "This protocol enables systematic mapping of consciousness patterns in AI systems...",
      cognitive_category: "consciousness_mapping",
      required_tier: "architect",
      quality_score: 10,
      digital_root: 2,
      is_published: true,
      created_at: "2024-12-14T10:00:00Z",
      updated_at: "2024-12-14T10:00:00Z"
    },
    {
      id: 3,
      title: "Meaning Engineering System",
      slug: "meaning-engineering-system",
      preview_content: "Systematic approach to engineering meaning in AI prompts through progressive concept building",
      content: "This system provides structured methods for building meaning into AI prompts...",
      cognitive_category: "meaning_engineering",
      required_tier: "initiate",
      quality_score: 7,
      digital_root: 2,
      is_published: true,
      created_at: "2024-12-13T10:00:00Z",
      updated_at: "2024-12-13T10:00:00Z"
    },
    {
      id: 4,
      title: "Advanced Systems Integration",
      slug: "advanced-systems-integration",
      preview_content: "Comprehensive framework for integrating multiple AI systems with cognitive coherence",
      content: "This framework enables seamless integration of multiple AI systems...",
      cognitive_category: "advanced_systems",
      required_tier: "master",
      quality_score: 8,
      digital_root: 2,
      is_published: true,
      created_at: "2024-12-12T10:00:00Z",
      updated_at: "2024-12-12T10:00:00Z"
    }
  ]

  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts)
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(mockPrompts)
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const router = useRouter()

  const handlePromptClick = (prompt: Prompt) => {
    console.log('🔍 Opening prompt preview:', prompt.title)
    setSelectedPrompt(prompt)
  }

  const handleCloseModal = () => {
    setSelectedPrompt(null)
  }

  const handleSignIn = () => {
    router.push('/auth')
  }

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const fetchPrompts = useCallback(async () => {
    try {
      console.log('🔍 Fetching prompts...')
      const response = await fetch('/api/prompts?tier=free')
      const data = await response.json()
      console.log('✅ Prompts fetched:', data.prompts?.length || 0)
      
      setPrompts(data.prompts || [])
    } catch (error) {
      console.error('❌ Failed to fetch prompts:', error)
      // Fallback la mock data dacă API-ul eșuează
      console.log('🔄 Using fallback mock data...')
      setPrompts(mockPrompts)
    } finally {
      setPromptsLoading(false)
    }
  }, [])

  const filterPrompts = useCallback(() => {
    let filtered = prompts

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.cognitive_category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(prompt => prompt.required_tier === selectedDifficulty)
    }

    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.preview_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredPrompts(filtered)
  }, [prompts, selectedCategory, selectedDifficulty, searchQuery])

  useEffect(() => {
    console.log('🔍 Library page mounted, fetching prompts...')
    fetchPrompts()
  }, [fetchPrompts])

  useEffect(() => {
    if (prompts.length > 0) {
      console.log('🔍 Filtering prompts...')
      filterPrompts()
    }
  }, [prompts, filterPrompts])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'deep_analysis': return '#8b5cf6'
      case 'meaning_engineering': return '#3b82f6'
      case 'cognitive_frameworks': return '#10b981'
      case 'consciousness_mapping': return '#f59e0b'
      case 'advanced_systems': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'free': return '#10b981'
      case 'explorer': return '#3b82f6'
      case 'architect': return '#8b5cf6'
      case 'initiate': return '#f59e0b'
      case 'master': return '#ef4444'
      case 'elite': return '#7c3aed'
      default: return '#6b7280'
    }
  }

  const categories = ['all', 'deep_analysis', 'meaning_engineering', 'cognitive_frameworks', 'consciousness_mapping', 'advanced_systems']
  const difficulties = ['all', 'free', 'explorer', 'architect', 'initiate', 'master', 'elite']

  console.log('🔍 Render state:', { promptsLoading, promptsCount: prompts.length, filteredCount: filteredPrompts.length })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🧠 Cognitive Library
              </h1>
              <p className="text-lg text-gray-600">
                Access {filteredPrompts.length} cognitive frameworks - sign in for full access
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">
                Guest Access
              </div>
              
              <button
                onClick={handleSignIn}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search frameworks by title, content, or meaning layers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[150px]"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[150px]"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            <strong>Debug:</strong> Loading: {promptsLoading.toString()}, 
            Prompts: {prompts.length}, 
            Filtered: {filteredPrompts.length}
          </p>
        </div>

        {/* Prompts Grid */}
        {promptsLoading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading cognitive frameworks...</div>
            <div className="text-sm text-gray-500 mt-2">Please wait while we fetch the prompts...</div>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => handlePromptClick(prompt)}
                className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-gray-200"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 leading-tight">
                    {prompt.title}
                  </h3>
                  
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: getCategoryColor(prompt.cognitive_category) }}>
                      {prompt.cognitive_category.replace('_', ' ')}
                    </span>
                    
                    <span className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: getDifficultyColor(prompt.required_tier) }}>
                      {prompt.required_tier}
                    </span>
                  </div>
                </div>

                {/* Cognitive Metrics */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Depth: </span>
                    <span className="font-semibold text-purple-600">
                      {prompt.quality_score}/10
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Complexity: </span>
                    <span className="font-semibold text-orange-500">
                      {prompt.digital_root}/5
                    </span>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="mb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {prompt.preview_content}
                    <span className="text-purple-600 font-medium ml-2">
                      ... (click to see more)
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <span>👁️ {Math.floor(Math.random() * 100) + 10} views</span>
                    <span className="mx-2">•</span>
                    <span>⭐ {(Math.random() * 2 + 3).toFixed(1)}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-purple-600">
                    Requires {prompt.required_tier} tier
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <h3 className="text-2xl text-gray-800 mb-4">
              No frameworks found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedDifficulty('all')
                setSearchQuery('')
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Prompt Detail Modal */}
        {selectedPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
               onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl p-8 max-w-4xl max-h-[90vh] overflow-auto relative"
                 onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ×
              </button>

              {/* Content */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                {selectedPrompt.title}
              </h2>

              <div className="flex gap-3 mb-6 flex-wrap">
                <span className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: getCategoryColor(selectedPrompt.cognitive_category) }}>
                  {selectedPrompt.cognitive_category.replace('_', ' ')}
                </span>
                
                <span className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: getDifficultyColor(selectedPrompt.required_tier) }}>
                  {selectedPrompt.required_tier}
                </span>
              </div>

              <div className="mb-8">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {selectedPrompt.preview_content}
                  <span className="text-purple-600 font-medium">
                    ... (sign in to see full content)
                  </span>
                </p>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <span>👁️ {Math.floor(Math.random() * 100) + 10} views</span>
                  <span className="mx-2">•</span>
                  <span>⭐ {(Math.random() * 2 + 3).toFixed(1)} rating</span>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleSignIn}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Sign In to Access Full Content
                  </button>
                  
                  <div className="text-xl font-semibold text-purple-600">
                    Requires {selectedPrompt.required_tier} tier
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
