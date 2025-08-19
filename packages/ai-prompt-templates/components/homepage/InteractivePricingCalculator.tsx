'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface PricingInputs {
  teamSize: number;
  monthlyUsage: number;
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  useCase: string;
  timeline: 'immediate' | '3months' | '6months' | '1year';
  budget: 'low' | 'medium' | 'high' | 'enterprise';
}

interface PlanComparison {
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  roi: number;
  timeToValue: string;
  bestFor: string;
  limitations: string[];
}

interface ROICalculation {
  currentCost: number;
  newCost: number;
  timeSavings: number;
  qualityImprovement: number;
  monthlyROI: number;
  annualROI: number;
  paybackPeriod: number;
}

const USE_CASES = [
  'Content Creation',
  'Customer Support',
  'Data Analysis',
  'Product Development',
  'Research & Academic',
  'Business Automation',
  'Creative Writing',
  'Technical Documentation',
  'Sales & Marketing',
  'Education & Training'
];

const COMPLEXITY_MULTIPLIERS = {
  basic: 1.0,
  intermediate: 1.3,
  advanced: 1.7,
  expert: 2.2
};

const TIMELINE_MULTIPLIERS = {
  immediate: 1.0,
  '3months': 0.9,
  '6months': 0.8,
  '1year': 0.7
};

const BUDGET_MULTIPLIERS = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
  enterprise: 1.5
};

const PLAN_FEATURES = {
  explorer: [
    '20% of complete library',
    '100+ basic frameworks',
    'Community access',
    'Email support',
    'Basic templates'
  ],
  architect: [
    '50% of complete library',
    '500+ advanced frameworks',
    'Priority support',
    'Video tutorials',
    'Custom templates'
  ],
  initiate: [
    '80% of complete library',
    '1000+ expert frameworks',
    'Phone support',
    '1-on-1 consultation',
    'Advanced analytics'
  ],
  master: [
    '90% of complete library',
    '1500+ master frameworks',
    'Dedicated support',
    'Custom development',
    'API access'
  ],
  elite: [
    '100% of complete library',
    '2000+ elite frameworks',
    '24/7 support',
    'White-label solutions',
    'Enterprise features'
  ]
};

export default function InteractivePricingCalculator() {
  const router = useRouter();
  const [inputs, setInputs] = useState<PricingInputs>({
    teamSize: 5,
    monthlyUsage: 1000,
    complexity: 'intermediate',
    useCase: 'Content Creation',
    timeline: '3months',
    budget: 'medium'
  });
  const [showCalculator, setShowCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison' | 'roi'>('calculator');

  // Calculate estimated pricing based on inputs
  const estimatedPricing = useMemo(() => {
    const basePrice = 29; // Base price per user
    const complexityMultiplier = COMPLEXITY_MULTIPLIERS[inputs.complexity];
    const timelineMultiplier = TIMELINE_MULTIPLIERS[inputs.timeline];
    const budgetMultiplier = BUDGET_MULTIPLIERS[inputs.budget];
    
    const monthlyPrice = basePrice * inputs.teamSize * complexityMultiplier * timelineMultiplier * budgetMultiplier;
    const annualPrice = monthlyPrice * 12 * 0.8; // 20% annual discount
    
    return {
      monthly: Math.round(monthlyPrice),
      annual: Math.round(annualPrice),
      savings: Math.round(monthlyPrice * 12 - annualPrice)
    };
  }, [inputs]);

  // Calculate ROI based on inputs
  const roiCalculation = useMemo((): ROICalculation => {
    const currentCost = inputs.teamSize * 5000; // Estimated current monthly cost
    const newCost = estimatedPricing.monthly;
    const timeSavings = inputs.teamSize * 20; // Hours saved per month
    const qualityImprovement = 0.25; // 25% improvement
    
    const monthlyROI = ((currentCost - newCost) + (timeSavings * 50)) / newCost * 100;
    const annualROI = monthlyROI * 12;
    const paybackPeriod = newCost / ((currentCost - newCost) + (timeSavings * 50));
    
    return {
      currentCost,
      newCost,
      timeSavings,
      qualityImprovement,
      monthlyROI: Math.round(monthlyROI),
      annualROI: Math.round(annualROI),
      paybackPeriod: Math.round(paybackPeriod * 100) / 100
    };
  }, [inputs, estimatedPricing]);

  // Generate plan recommendations
  const planRecommendations = useMemo((): PlanComparison[] => {
    const recommendations: PlanComparison[] = [];
    
    if (inputs.teamSize <= 3 && inputs.complexity === 'basic') {
      recommendations.push({
        plan: 'Explorer',
        monthlyPrice: 29,
        annualPrice: 279,
        features: PLAN_FEATURES.explorer,
        roi: Math.round(roiCalculation.monthlyROI * 0.8),
        timeToValue: '1-2 weeks',
        bestFor: 'Small teams getting started',
        limitations: ['Limited library access', 'Basic support only']
      });
    }
    
    if (inputs.teamSize <= 10 && inputs.complexity !== 'expert') {
      recommendations.push({
        plan: 'Architect',
        monthlyPrice: 99,
        annualPrice: 949,
        features: PLAN_FEATURES.architect,
        roi: Math.round(roiCalculation.monthlyROI * 0.9),
        timeToValue: '2-4 weeks',
        bestFor: 'Growing teams with moderate needs',
        limitations: ['No phone support', 'Limited custom development']
      });
    }
    
    if (inputs.teamSize <= 25) {
      recommendations.push({
        plan: 'Initiate',
        monthlyPrice: 199,
        annualPrice: 1899,
        features: PLAN_FEATURES.initiate,
        roi: Math.round(roiCalculation.monthlyROI),
        timeToValue: '3-6 weeks',
        bestFor: 'Established teams with advanced needs',
        limitations: ['No white-label solutions', 'Limited enterprise features']
      });
    }
    
    if (inputs.teamSize <= 100) {
      recommendations.push({
        plan: 'Master',
        monthlyPrice: 399,
        annualPrice: 3799,
        features: PLAN_FEATURES.master,
        roi: Math.round(roiCalculation.monthlyROI * 1.1),
        timeToValue: '4-8 weeks',
        bestFor: 'Large organizations with complex requirements',
        limitations: ['No 24/7 support', 'Limited white-label options']
      });
    }
    
    if (inputs.teamSize > 100 || inputs.budget === 'enterprise') {
      recommendations.push({
        plan: 'Elite',
        monthlyPrice: 799,
        annualPrice: 7599,
        features: PLAN_FEATURES.elite,
        roi: Math.round(roiCalculation.monthlyROI * 1.2),
        timeToValue: '6-12 weeks',
        bestFor: 'Enterprise organizations with maximum requirements',
        limitations: ['Highest cost', 'Complex implementation']
      });
    }
    
    return recommendations.sort((a, b) => b.roi - a.roi);
  }, [inputs, roiCalculation]);

  const handleInputChange = (key: keyof PricingInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-blue-500';
      case 'advanced':
        return 'bg-orange-500';
      case 'expert':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-blue-500';
      case 'high':
        return 'bg-orange-500';
      case 'enterprise':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            💰 Interactive Pricing Calculator
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Calculate your ROI, estimate costs, and find the perfect plan for your team. See how much you can save with our AI frameworks.
          </p>
        </div>

        {/* Calculator Trigger */}
        {!showCalculator && (
          <div className="text-center mb-16">
            <button
              onClick={() => setShowCalculator(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Pricing Calculator
            </button>
          </div>
        )}

        {/* Calculator Interface */}
        {showCalculator && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'calculator'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Calculator
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'comparison'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Plan Comparison
                </button>
                <button
                  onClick={() => setActiveTab('roi')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'roi'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ROI Analysis
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'calculator' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Input Form */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">
                      Your Requirements
                    </h3>
                    
                    {/* Team Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Size: {inputs.teamSize} people
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={inputs.teamSize}
                        onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span>50</span>
                        <span>100</span>
                        <span>200+</span>
                      </div>
                    </div>

                    {/* Monthly Usage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly AI Interactions: {inputs.monthlyUsage.toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={inputs.monthlyUsage}
                        onChange={(e) => handleInputChange('monthlyUsage', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>100</span>
                        <span>10K</span>
                        <span>50K</span>
                        <span>100K+</span>
                      </div>
                    </div>

                    {/* Complexity Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Complexity Level
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['basic', 'intermediate', 'advanced', 'expert'] as const).map((level) => (
                          <div
                            key={level}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              inputs.complexity === level
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleInputChange('complexity', level)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getComplexityColor(level)}`}></div>
                              <span className="font-medium text-gray-800 capitalize">{level}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Use Case */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Use Case
                      </label>
                      <select
                        value={inputs.useCase}
                        onChange={(e) => handleInputChange('useCase', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {USE_CASES.map(useCase => (
                          <option key={useCase} value={useCase}>{useCase}</option>
                        ))}
                      </select>
                    </div>

                    {/* Timeline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Implementation Timeline
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { value: 'immediate', label: 'Immediate' },
                          { value: '3months', label: '3 Months' },
                          { value: '6months', label: '6 Months' },
                          { value: '1year', label: '1 Year' }
                        ] as const).map(({ value, label }) => (
                          <div
                            key={value}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              inputs.timeline === value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleInputChange('timeline', value)}
                          >
                            <span className="font-medium text-gray-800">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                          { value: 'enterprise', label: 'Enterprise' }
                        ] as const).map(({ value, label }) => (
                          <div
                            key={value}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              inputs.budget === value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleInputChange('budget', value)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getBudgetColor(value)}`}></div>
                              <span className="font-medium text-gray-800">{label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Results Display */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">
                      Estimated Pricing
                    </h3>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          €{estimatedPricing.monthly}
                        </div>
                        <div className="text-gray-600">per month</div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Annual Price:</span>
                          <span className="font-semibold text-gray-800">€{estimatedPricing.annual}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Annual Savings:</span>
                          <span className="font-semibold text-green-600">€{estimatedPricing.savings}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Per User:</span>
                          <span className="font-semibold text-gray-800">€{Math.round(estimatedPricing.monthly / inputs.teamSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">Quick ROI Estimate</h4>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {roiCalculation.monthlyROI}% monthly ROI
                      </div>
                      <div className="text-sm text-green-700">
                        Payback period: {roiCalculation.paybackPeriod} months
                      </div>
                    </div>

                    <button
                      onClick={() => router.push('/pricing')}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                    >
                      Get Started Today
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'comparison' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Recommended Plans for Your Team
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planRecommendations.map((plan) => (
                      <div key={plan.plan} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                        <div className="text-center mb-6">
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{plan.plan}</h4>
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            €{plan.monthlyPrice}
                          </div>
                          <div className="text-gray-600 text-sm">per month</div>
                          <div className="text-green-600 text-sm font-medium">
                            €{plan.annualPrice} annually (save 20%)
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                              {plan.roi}% ROI
                            </div>
                            <div className="text-sm text-gray-600">Monthly return</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-800 mb-1">
                              {plan.timeToValue}
                            </div>
                            <div className="text-xs text-gray-600">Time to value</div>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h5 className="font-semibold text-gray-800 mb-3">Key Features:</h5>
                          <ul className="space-y-2">
                            {plan.features.slice(0, 4).map((feature, index) => (
                              <li key={index} className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mb-6">
                          <h5 className="font-semibold text-gray-800 mb-2">Best For:</h5>
                          <p className="text-sm text-gray-600">{plan.bestFor}</p>
                        </div>
                        
                        <button
                          onClick={() => router.push('/pricing')}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          Choose {plan.plan}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'roi' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    ROI Analysis & Business Case
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Current vs New Costs */}
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-gray-800">Cost Comparison</h4>
                      
                      <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                        <h5 className="font-semibold text-red-800 mb-3">Current Monthly Costs</h5>
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          €{roiCalculation.currentCost.toLocaleString()}
                        </div>
                        <div className="text-sm text-red-700">
                          Manual prompt engineering, training, and quality issues
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-3">New Monthly Costs</h5>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          €{roiCalculation.newCost.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-700">
                          AI-Prompt-Templates subscription + implementation
                        </div>
                      </div>
                    </div>

                    {/* ROI Metrics */}
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-gray-800">ROI Metrics</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {roiCalculation.monthlyROI}%
                          </div>
                          <div className="text-sm text-blue-700">Monthly ROI</div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {roiCalculation.annualROI}%
                          </div>
                          <div className="text-sm text-purple-700">Annual ROI</div>
                        </div>
                        
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {roiCalculation.paybackPeriod}
                          </div>
                          <div className="text-sm text-green-700">Months to payback</div>
                        </div>
                        
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {roiCalculation.timeSavings}
                          </div>
                          <div className="text-sm text-orange-700">Hours saved/month</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Impact */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Business Impact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          €{(roiCalculation.currentCost - roiCalculation.newCost) * 12}
                        </div>
                        <div className="text-sm text-gray-600">Annual cost savings</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {roiCalculation.timeSavings * 12}
                        </div>
                        <div className="text-sm text-gray-600">Hours saved annually</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {Math.round(roiCalculation.qualityImprovement * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Quality improvement</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => router.push('/pricing')}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                    >
                      Start Your ROI Journey
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
