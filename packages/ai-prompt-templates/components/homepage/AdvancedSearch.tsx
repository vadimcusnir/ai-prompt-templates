'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface SearchFilter {
  category: string;
  difficulty: string;
  priceRange: string;
  cognitiveDepth: number;
  patternComplexity: number;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  price: string;
  cognitiveDepth: number;
  patternComplexity: number;
  relevanceScore: number;
  tags: string[];
}

const CATEGORIES = [
  'Deep Analysis',
  'Meaning Engineering', 
  'Cognitive Frameworks',
  'Consciousness Mapping',
  'Advanced Systems'
];

const DIFFICULTY_LEVELS = [
  'Foundation',
  'Advanced',
  'Expert',
  'Architect'
];

const PRICE_RANGES = [
  'Free',
  '€29-99',
  '€100-299',
  '€300+'
];

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    id: '1',
    title: 'Cognitive Depth Analysis Framework',
    description: 'Advanced framework for analyzing cognitive depth in AI responses with multi-layered assessment',
    category: 'Deep Analysis',
    difficulty: 'Expert',
    price: '€299',
    cognitiveDepth: 9,
    patternComplexity: 5,
    relevanceScore: 95,
    tags: ['cognitive-analysis', 'depth-assessment', 'ai-evaluation']
  },
  {
    id: '2',
    title: 'Meaning Engineering System',
    description: 'Systematic approach to engineering meaning in AI prompts through progressive concept building',
    category: 'Meaning Engineering',
    difficulty: 'Advanced',
    price: '€199',
    cognitiveDepth: 7,
    patternComplexity: 4,
    relevanceScore: 88,
    tags: ['meaning-engineering', 'concept-building', 'systematic-approach']
  },
  {
    id: '3',
    title: 'Consciousness Mapping Protocol',
    description: 'Framework for mapping consciousness patterns in AI interactions and self-awareness',
    category: 'Consciousness Mapping',
    difficulty: 'Architect',
    price: '€399',
    cognitiveDepth: 10,
    patternComplexity: 5,
    relevanceScore: 92,
    tags: ['consciousness', 'self-awareness', 'pattern-mapping']
  },
  {
    id: '4',
    title: 'Advanced Systems Integration',
    description: 'Comprehensive framework for integrating multiple AI systems with cognitive coherence',
    category: 'Advanced Systems',
    difficulty: 'Expert',
    price: '€299',
    cognitiveDepth: 8,
    patternComplexity: 5,
    relevanceScore: 85,
    tags: ['system-integration', 'cognitive-coherence', 'multi-ai']
  }
];

export default function AdvancedSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({
    category: '',
    difficulty: '',
    priceRange: '',
    cognitiveDepth: 5,
    patternComplexity: 3
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Simulate AI-powered search
  const performSearch = async () => {
    setIsSearching(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSearching(false);
  };

  // Filter and sort results based on search query and filters
  const filteredResults = useMemo(() => {
    let results = MOCK_SEARCH_RESULTS;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(result =>
        result.title.toLowerCase().includes(query) ||
        result.description.toLowerCase().includes(query) ||
        result.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category) {
      results = results.filter(result => result.category === filters.category);
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      results = results.filter(result => result.difficulty === filters.difficulty);
    }

    // Apply price range filter
    if (filters.priceRange) {
      results = results.filter(result => {
        if (filters.priceRange === 'Free') return result.price === 'Free';
        if (filters.priceRange === '€29-99') return result.price === '€199';
        if (filters.priceRange === '€100-299') return result.price === '€299';
        if (filters.priceRange === '€300+') return result.price === '€399';
        return true;
      });
    }

    // Apply cognitive depth filter
    results = results.filter(result => result.cognitiveDepth >= filters.cognitiveDepth);

    // Apply pattern complexity filter
    results = results.filter(result => result.patternComplexity >= filters.patternComplexity);

    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [searchQuery, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch();
    }
  };

  const handleFilterChange = (key: keyof SearchFilter, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      difficulty: '',
      priceRange: '',
      cognitiveDepth: 5,
      patternComplexity: 3
    });
    setSearchQuery('');
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            🔍 Advanced Search & Discovery
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find the perfect cognitive framework using AI-powered search, intelligent filters, and personalized recommendations.
          </p>
        </div>

        {/* Search Interface */}
        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for cognitive frameworks, concepts, or specific use cases..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 pr-32"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Search
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>

          {/* Filter Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Prices</option>
                    {PRICE_RANGES.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                {/* Cognitive Depth Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Cognitive Depth: {filters.cognitiveDepth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.cognitiveDepth}
                    onChange={(e) => handleFilterChange('cognitiveDepth', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Pattern Complexity Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Pattern Complexity: {filters.patternComplexity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={filters.patternComplexity}
                    onChange={(e) => handleFilterChange('patternComplexity', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Search Results
            </h3>
            <p className="text-gray-600">
              Found {filteredResults.length} frameworks matching your criteria
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-gray-800 line-clamp-2">
                    {result.title}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                    {result.relevanceScore}% match
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {result.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                    result.difficulty === 'expert' ? 'bg-red-500' : 
                    result.difficulty === 'advanced' ? 'bg-orange-500' : 
                    result.difficulty === 'architect' ? 'bg-purple-500' : 'bg-green-500'
                  }`}>
                    {result.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {result.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {result.price}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Depth: {result.cognitiveDepth}/10</span>
                  <span>Complexity: {result.patternComplexity}/5</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {result.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No frameworks found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search criteria or filters to find more results.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Result Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedResult.title}
                  </h3>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {selectedResult.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Category</div>
                    <div className="text-gray-800">{selectedResult.category}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Difficulty</div>
                    <div className="text-gray-800">{selectedResult.difficulty}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Price</div>
                    <div className="text-gray-800">{selectedResult.price}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Relevance</div>
                    <div className="text-gray-800">{selectedResult.relevanceScore}%</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => router.push(`/library/${selectedResult.id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    View Full Details →
                  </button>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Get Access
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
