'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CuratedContent {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  price: string;
  popularity: number;
  trending: boolean;
  featured: boolean;
  tags: string[];
  imageUrl?: string;
  readTime: number;
  author: string;
  publishDate: string;
}

interface ContentCollection {
  id: string;
  name: string;
  description: string;
  theme: string;
  frameworks: CuratedContent[];
  totalFrameworks: number;
}

interface UserPreferences {
  interests: string[];
  skillLevel: string;
  useCase: string;
  preferredCategories: string[];
}

const MOCK_CURATED_CONTENT: CuratedContent[] = [
  {
    id: '1',
    title: 'Cognitive Depth Analysis Framework',
    description: 'Advanced framework for analyzing cognitive depth in AI responses with multi-layered assessment capabilities',
    category: 'Deep Analysis',
    difficulty: 'Expert',
    price: '€299',
    popularity: 95,
    trending: true,
    featured: true,
    tags: ['cognitive-analysis', 'depth-assessment', 'ai-evaluation', 'advanced'],
    readTime: 8,
    author: 'Dr. Sarah Chen',
    publishDate: '2024-12-15'
  },
  {
    id: '2',
    title: 'Meaning Engineering System',
    description: 'Systematic approach to engineering meaning in AI prompts through progressive concept building',
    category: 'Meaning Engineering',
    difficulty: 'Advanced',
    price: '€199',
    popularity: 88,
    trending: true,
    featured: false,
    tags: ['meaning-engineering', 'concept-building', 'systematic-approach'],
    readTime: 6,
    author: 'Prof. Michael Rodriguez',
    publishDate: '2024-12-12'
  },
  {
    id: '3',
    title: 'Consciousness Mapping Protocol',
    description: 'Framework for mapping consciousness patterns in AI interactions and self-awareness development',
    category: 'Consciousness Mapping',
    difficulty: 'Architect',
    price: '€399',
    popularity: 92,
    trending: false,
    featured: true,
    tags: ['consciousness', 'self-awareness', 'pattern-mapping', 'architect'],
    readTime: 10,
    author: 'Dr. Emma Thompson',
    publishDate: '2024-12-10'
  },
  {
    id: '4',
    title: 'Advanced Systems Integration',
    description: 'Comprehensive framework for integrating multiple AI systems with cognitive coherence',
    category: 'Advanced Systems',
    difficulty: 'Expert',
    price: '€299',
    popularity: 85,
    trending: true,
    featured: false,
    tags: ['system-integration', 'cognitive-coherence', 'multi-ai'],
    readTime: 7,
    author: 'Alex Johnson',
    publishDate: '2024-12-08'
  },
  {
    id: '5',
    title: 'Prompt Optimization Engine',
    description: 'AI-powered system for automatically optimizing and refining prompt structures',
    category: 'Optimization',
    difficulty: 'Advanced',
    price: '€249',
    popularity: 78,
    trending: false,
    featured: false,
    tags: ['optimization', 'automation', 'prompt-refinement'],
    readTime: 5,
    author: 'Lisa Wang',
    publishDate: '2024-12-05'
  },
  {
    id: '6',
    title: 'Ethical AI Framework',
    description: 'Comprehensive guidelines for developing ethically responsible AI systems',
    category: 'Ethics & Governance',
    difficulty: 'Intermediate',
    price: '€179',
    popularity: 82,
    trending: true,
    featured: false,
    tags: ['ethics', 'governance', 'responsible-ai', 'guidelines'],
    readTime: 6,
    author: 'Dr. James Wilson',
    publishDate: '2024-12-03'
  }
];

const CONTENT_COLLECTIONS: ContentCollection[] = [
  {
    id: '1',
    name: 'AI Ethics & Governance',
    description: 'Essential frameworks for building responsible and ethical AI systems',
    theme: 'ethics',
    frameworks: MOCK_CURATED_CONTENT.filter(f => f.category === 'Ethics & Governance'),
    totalFrameworks: 3
  },
  {
    id: '2',
    name: 'Advanced Cognitive Systems',
    description: 'Cutting-edge frameworks for complex AI reasoning and consciousness',
    theme: 'cognitive',
    frameworks: MOCK_CURATED_CONTENT.filter(f => f.category === 'Deep Analysis' || f.category === 'Consciousness Mapping'),
    totalFrameworks: 4
  },
  {
    id: '3',
    name: 'Enterprise AI Solutions',
    description: 'Scalable frameworks designed for large-scale AI deployments',
    theme: 'enterprise',
    frameworks: MOCK_CURATED_CONTENT.filter(f => f.difficulty === 'Expert' || f.difficulty === 'Architect'),
    totalFrameworks: 5
  }
];

const CATEGORIES = [
  'All Categories',
  'Deep Analysis',
  'Meaning Engineering',
  'Consciousness Mapping',
  'Advanced Systems',
  'Optimization',
  'Ethics & Governance'
];

const DIFFICULTY_LEVELS = [
  'All Levels',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
  'Architect'
];

export default function AdvancedContentCuration() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [showTrending, setShowTrending] = useState(true);
  const [showFeatured, setShowFeatured] = useState(true);
  const [sortBy, setSortBy] = useState<'popularity' | 'date' | 'readTime'>('popularity');
  const [selectedCollection, setSelectedCollection] = useState<ContentCollection | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: ['AI Ethics', 'Cognitive Systems'],
    skillLevel: 'Advanced',
    useCase: 'Enterprise Development',
    preferredCategories: ['Deep Analysis', 'Ethics & Governance']
  });

  // Filter content based on selected criteria
  const filteredContent = MOCK_CURATED_CONTENT.filter(content => {
    const categoryMatch = selectedCategory === 'All Categories' || content.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'All Levels' || content.difficulty === selectedDifficulty;
    const trendingMatch = !showTrending || content.trending;
    const featuredMatch = !showFeatured || content.featured;
    
    return categoryMatch && difficultyMatch && trendingMatch && featuredMatch;
  });

  // Sort content based on selected criteria
  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.popularity - a.popularity;
      case 'date':
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      case 'readTime':
        return a.readTime - b.readTime;
      default:
        return 0;
    }
  });

  // Get personalized recommendations based on user preferences
  const getPersonalizedRecommendations = () => {
    return MOCK_CURATED_CONTENT
      .filter(content => 
        userPreferences.preferredCategories.includes(content.category) ||
        userPreferences.interests.some(interest => 
          content.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
        )
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 3);
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return 'text-green-600 bg-green-100';
    if (popularity >= 80) return 'text-blue-600 bg-blue-100';
    if (popularity >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'expert':
        return 'bg-red-500';
      case 'advanced':
        return 'bg-orange-500';
      case 'architect':
        return 'bg-purple-500';
      case 'intermediate':
        return 'bg-blue-500';
      case 'beginner':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            🎨 Advanced Content Curation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover AI-powered content recommendations, trending frameworks, and personalized collections tailored to your needs.
          </p>
        </div>

        {/* Personalized Recommendations */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            🎯 Personalized for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getPersonalizedRecommendations().map((content) => (
              <div
                key={content.id}
                className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/library/${content.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(content.difficulty)}`}>
                    {content.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Recommended
                  </span>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                  {content.title}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {content.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By {content.author}</span>
                  <span>{content.readTime} min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Collections */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            📚 Curated Collections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTENT_COLLECTIONS.map((collection) => (
              <div
                key={collection.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedCollection(collection)}
              >
                <div className="mb-4">
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    {collection.name}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {collection.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {collection.totalFrameworks} frameworks
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {collection.theme}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Filters and Sorting */}
        <div className="mb-12">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'popularity' | 'date' | 'readTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="popularity">Popularity</option>
                  <option value="date">Date</option>
                  <option value="readTime">Read Time</option>
                </select>
              </div>

              {/* Toggle Filters */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">Filters</label>
                <div className="flex space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showTrending}
                      onChange={(e) => setShowTrending(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Trending</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showFeatured}
                      onChange={(e) => setShowFeatured(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Featured</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curated Content Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Curated Content
            </h3>
            <span className="text-gray-600">
              {sortedContent.length} frameworks found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedContent.map((content) => (
              <div
                key={content.id}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/library/${content.id}`)}
              >
                {/* Content Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(content.difficulty)}`}>
                    {content.difficulty}
                  </span>
                  <div className="flex space-x-2">
                    {content.trending && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        🔥 Trending
                      </span>
                    )}
                    {content.featured && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Title and Description */}
                <h4 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                  {content.title}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {content.description}
                </p>

                {/* Content Metadata */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>By {content.author}</span>
                    <span>{content.readTime} min read</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(content.publishDate).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPopularityColor(content.popularity)}`}>
                      {content.popularity}% popular
                    </span>
                  </div>
                </div>

                {/* Content Tags */}
                <div className="flex flex-wrap gap-1">
                  {content.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Price and CTA */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-green-600">
                      {content.price}
                    </span>
                    <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors duration-200">
                      Learn More →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Detail Modal */}
        {selectedCollection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedCollection.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedCollection.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedCollection.frameworks.map((framework) => (
                    <div key={framework.id} className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {framework.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {framework.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(framework.difficulty)}`}>
                          {framework.difficulty}
                        </span>
                        <span className="text-gray-500">
                          {framework.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {selectedCollection.totalFrameworks} frameworks in collection
                  </span>
                  <button
                    onClick={() => router.push('/library')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Explore All
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
