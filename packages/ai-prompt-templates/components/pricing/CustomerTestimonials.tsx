'use client'

import { useState } from 'react'
import { CUSTOMER_TESTIMONIALS, CustomerTestimonial, PlanTier } from '@/lib/plans'

interface CustomerTestimonialsProps {
  selectedPlan?: PlanTier
}

export default function CustomerTestimonials({ selectedPlan }: CustomerTestimonialsProps) {
  const [activePlan, setActivePlan] = useState<PlanTier | 'all'>(selectedPlan || 'all')
  const [selectedTestimonial, setSelectedTestimonial] = useState<CustomerTestimonial | null>(null)

  const plans: (PlanTier | 'all')[] = ['all', 'free', 'explorer', 'architect', 'initiate', 'master', 'elite']
  
  const filteredTestimonials = activePlan === 'all' 
    ? CUSTOMER_TESTIMONIALS 
    : CUSTOMER_TESTIMONIALS.filter(t => t.plan === activePlan)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  if (filteredTestimonials.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          What Our Customers Say
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join thousands of professionals who have transformed their AI capabilities 
          with our cognitive frameworks.
        </p>
      </div>

      {/* Plan Filter */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          {plans.map((plan) => {
            const planTestimonials = plan === 'all' 
              ? CUSTOMER_TESTIMONIALS 
              : CUSTOMER_TESTIMONIALS.filter(t => t.plan === plan)
            
            if (planTestimonials.length === 0) return null
            
            return (
              <button
                key={plan}
                onClick={() => setActivePlan(plan)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePlan === plan
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {plan === 'all' ? 'All Plans' : plan.charAt(0).toUpperCase() + plan.slice(1)}
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {planTestimonials.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-gray-50 rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => setSelectedTestimonial(testimonial)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.company}</p>
                </div>
              </div>
              
              {testimonial.verified && (
                <div className="text-blue-500" title="Verified Customer">
                  ✓
                </div>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center mb-3">
              <div className="flex space-x-1">
                {renderStars(testimonial.rating)}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {testimonial.rating}/5
              </span>
            </div>
            
            {/* Comment */}
            <p className="text-gray-700 text-sm line-clamp-3 mb-3">
              &ldquo;{testimonial.comment}&rdquo;
            </p>
            
            {/* Plan Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {testimonial.plan.charAt(0).toUpperCase() + testimonial.plan.slice(1)} Plan
              </span>
              
              <span className="text-xs text-gray-500">
                Read more →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial Modal */}
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Customer Review
                </h3>
                <button
                  onClick={() => setSelectedTestimonial(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              {/* Full Testimonial */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-semibold text-blue-600">
                      {selectedTestimonial.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedTestimonial.name}
                    </h4>
                    <p className="text-gray-600">{selectedTestimonial.role}</p>
                    <p className="text-sm text-gray-500">{selectedTestimonial.company}</p>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex items-center">
                  <div className="flex space-x-1">
                    {renderStars(selectedTestimonial.rating)}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {selectedTestimonial.rating} out of 5 stars
                  </span>
                </div>
                
                {/* Full Comment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 italic">
                    &ldquo;{selectedTestimonial.comment}&rdquo;
                  </p>
                </div>
                
                {/* Plan and Verification */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {selectedTestimonial.plan.charAt(0).toUpperCase() + selectedTestimonial.plan.slice(1)} Plan
                  </span>
                  
                  {selectedTestimonial.verified && (
                    <div className="flex items-center text-blue-600">
                      <span className="mr-2">✓</span>
                      <span className="text-sm font-medium">Verified Customer</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedTestimonial(null)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Close Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
