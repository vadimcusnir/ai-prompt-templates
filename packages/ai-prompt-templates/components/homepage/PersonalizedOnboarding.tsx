'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'preferences' | 'goals' | 'recommendations';
  required: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    description: string;
    score: number;
  }[];
}

interface UserProfile {
  experience: string;
  useCase: string;
  teamSize: string;
  budget: string;
  timeline: string;
  goals: string[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  price: string;
  matchScore: number;
  reasoning: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI-Prompt-Templates',
    description: 'Let\'s personalize your experience in just a few steps',
    type: 'quiz',
    required: true
  },
  {
    id: 'experience',
    title: 'Your Experience Level',
    description: 'Help us understand your background in AI and prompt engineering',
    type: 'quiz',
    required: true
  },
  {
    id: 'use-case',
    title: 'Primary Use Case',
    description: 'What are you looking to achieve with our frameworks?',
    type: 'quiz',
    required: true
  },
  {
    id: 'goals',
    title: 'Your Goals',
    description: 'Select the outcomes you want to achieve',
    type: 'goals',
    required: true
  },
  {
    id: 'recommendations',
    title: 'Personalized Recommendations',
    description: 'Based on your profile, here are the best frameworks for you',
    type: 'recommendations',
    required: false
  }
];

const EXPERIENCE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'ai-experience',
    question: 'How would you describe your experience with AI and prompt engineering?',
    options: [
      {
        value: 'beginner',
        label: 'Beginner',
        description: 'New to AI, learning the basics',
        score: 1
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
        description: 'Some experience, looking to improve',
        score: 2
      },
      {
        value: 'advanced',
        label: 'Advanced',
        description: 'Experienced, seeking optimization',
        score: 3
      },
      {
        value: 'expert',
        label: 'Expert',
        description: 'Professional, building complex systems',
        score: 4
      }
    ]
  },
  {
    id: 'team-size',
    question: 'What\'s the size of your team or organization?',
    options: [
      {
        value: 'individual',
        label: 'Individual',
        description: 'Working solo on projects',
        score: 1
      },
      {
        value: 'small-team',
        label: 'Small Team (2-10)',
        description: 'Collaborative development',
        score: 2
      },
      {
        value: 'medium-org',
        label: 'Medium Organization (11-100)',
        description: 'Department-level implementation',
        score: 3
      },
      {
        value: 'enterprise',
        label: 'Enterprise (100+)',
        description: 'Company-wide deployment',
        score: 4
      }
    ]
  }
];

const USE_CASE_OPTIONS = [
  'Content Creation & Marketing',
  'Customer Support & Chatbots',
  'Data Analysis & Insights',
  'Product Development',
  'Research & Academic',
  'Business Process Automation',
  'Creative Writing & Storytelling',
  'Technical Documentation',
  'Sales & Lead Generation',
  'Education & Training'
];

const GOAL_OPTIONS = [
  'Improve AI Response Quality',
  'Reduce Prompt Engineering Time',
  'Standardize AI Interactions',
  'Scale AI Operations',
  'Enhance User Experience',
  'Increase Conversion Rates',
  'Optimize Resource Usage',
  'Ensure Consistency',
  'Accelerate Development',
  'Reduce Costs'
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1',
    title: 'Cognitive Depth Analysis Framework',
    description: 'Advanced framework for analyzing and improving AI response quality',
    category: 'Deep Analysis',
    difficulty: 'Expert',
    price: '€299',
    matchScore: 95,
    reasoning: 'Perfect for your advanced experience level and quality improvement goals'
  },
  {
    id: '2',
    title: 'Meaning Engineering System',
    description: 'Systematic approach to building meaningful AI interactions',
    category: 'Meaning Engineering',
    difficulty: 'Advanced',
    price: '€199',
    matchScore: 88,
    reasoning: 'Aligns with your standardization and consistency objectives'
  },
  {
    id: '3',
    title: 'Consciousness Mapping Protocol',
    description: 'Framework for creating self-aware AI systems',
    category: 'Consciousness Mapping',
    difficulty: 'Architect',
    price: '€399',
    matchScore: 82,
    reasoning: 'Supports your enterprise-scale deployment needs'
  }
];

export default function PersonalizedOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    experience: '',
    useCase: '',
    teamSize: '',
    budget: '',
    timeline: '',
    goals: []
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const handleProfileUpdate = (key: keyof UserProfile, value: string | string[]) => {
    setUserProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoalToggle = (goal: string) => {
    const currentGoals = userProfile.goals;
    if (currentGoals.includes(goal)) {
      handleProfileUpdate('goals', currentGoals.filter(g => g !== goal));
    } else {
      handleProfileUpdate('goals', [...currentGoals, goal]);
    }
  };

  const generateRecommendations = async () => {
    setIsLoading(true);
    // Simulate API call for recommendations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate personalized recommendations based on profile
    const personalizedRecs = MOCK_RECOMMENDATIONS.map(rec => ({
      ...rec,
      matchScore: Math.floor(Math.random() * 20) + 80, // 80-100 range
      reasoning: `Based on your ${userProfile.experience} experience and ${userProfile.useCase} focus`
    }));
    
    setRecommendations(personalizedRecs.sort((a, b) => b.matchScore - a.matchScore));
    setIsLoading(false);
  };

  const getCurrentStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    switch (step.type) {
      case 'quiz':
        if (step.id === 'experience') {
          return (
            <div className="space-y-6">
              {EXPERIENCE_QUESTIONS.map((question) => (
                <div key={question.id} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {question.question}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option) => (
                      <div
                        key={option.value}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          (question.id === 'ai-experience' && userProfile.experience === option.value) ||
                          (question.id === 'team-size' && userProfile.teamSize === option.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (question.id === 'ai-experience') {
                            handleProfileUpdate('experience', option.value);
                          } else if (question.id === 'team-size') {
                            handleProfileUpdate('teamSize', option.value);
                          }
                        }}
                      >
                        <div className="font-medium text-gray-800 mb-2">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {option.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        break;

      case 'goals':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Select your primary goals (choose 3-5)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOAL_OPTIONS.map((goal) => (
                <div
                  key={goal}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    userProfile.goals.includes(goal)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleGoalToggle(goal)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      userProfile.goals.includes(goal)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {userProfile.goals.includes(goal) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">{goal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Your Personalized Framework Recommendations
            </h3>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-gray-600">Generating personalized recommendations...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {rec.title}
                      </h4>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {rec.matchScore}% match
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{rec.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                        rec.difficulty === 'expert' ? 'bg-red-500' : 
                        rec.difficulty === 'advanced' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {rec.difficulty}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {rec.category}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {rec.price}
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="text-sm text-blue-800">
                        <strong>Why this fits:</strong> {rec.reasoning}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/library/${rec.id}`)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Learn More
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Experience
        return userProfile.experience && userProfile.teamSize;
      case 2: // Use Case
        return userProfile.useCase;
      case 3: // Goals
        return userProfile.goals.length >= 3;
      case 4: // Recommendations
        return true;
      default:
        return false;
    }
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Onboarding Trigger */}
        {!showOnboarding && (
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              🎯 Personalized Onboarding
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Get personalized framework recommendations based on your experience, goals, and use case.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Personalized Onboarding
            </button>
          </div>
        )}

        {/* Onboarding Flow */}
        {showOnboarding && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgressPercentage())}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {ONBOARDING_STEPS[currentStep].title}
                </h3>
                <p className="text-gray-600">
                  {ONBOARDING_STEPS[currentStep].description}
                </p>
              </div>

              {getCurrentStepContent()}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>

                <div className="flex space-x-4">
                  {currentStep === 3 && (
                    <button
                      onClick={generateRecommendations}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Generate Recommendations
                    </button>
                  )}
                  
                  {currentStep < ONBOARDING_STEPS.length - 1 ? (
                    <button
                      onClick={handleNextStep}
                      disabled={!canProceed()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/library')}
                      className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200"
                    >
                      Explore Library
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
