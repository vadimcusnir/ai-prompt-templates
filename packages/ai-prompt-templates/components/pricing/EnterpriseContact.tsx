'use client'

import { useState } from 'react'
import { ENTERPRISE_CONTACT } from '@/lib/plans'

export default function EnterpriseContact() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    companySize: '',
    useCase: '',
    budget: '',
    timeline: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement enterprise contact form submission
    console.log('Enterprise contact form submitted:', formData)
    setIsFormOpen(false)
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      companySize: '',
      useCase: '',
      budget: '',
      timeline: ''
    })
  }

  if (!ENTERPRISE_CONTACT.enabled) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-8 mb-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏢</span>
        </div>
        <h3 className="text-2xl font-bold text-purple-900 mb-2">
          Enterprise Solutions
        </h3>
        <p className="text-purple-700 text-lg">
          Custom pricing and solutions for teams and companies starting at €{ENTERPRISE_CONTACT.minPrice / 100}/month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-lg font-semibold text-purple-900 mb-3">Enterprise Features</h4>
          <ul className="space-y-2">
            {ENTERPRISE_CONTACT.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-purple-500 mr-2 mt-1">✓</span>
                <span className="text-purple-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-purple-900 mb-3">Why Choose Enterprise?</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">1</span>
              </div>
              <span className="text-purple-700">Dedicated account manager</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">2</span>
              </div>
              <span className="text-purple-700">Custom SLA guarantees</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">3</span>
              </div>
              <span className="text-purple-700">White-label solutions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">4</span>
              </div>
              <span className="text-purple-700">On-premise deployment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        {!isFormOpen ? (
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
          >
            Get Custom Enterprise Quote
          </button>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
            <h4 className="text-xl font-semibold text-purple-900 mb-4">Enterprise Contact Form</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Company *"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData({...formData, companySize: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Company Size</option>
                  <option value="10-50">10-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Monthly Budget</option>
                  <option value="1000-5000">€1,000 - €5,000</option>
                  <option value="5000-10000">€5,000 - €10,000</option>
                  <option value="10000+">€10,000+</option>
                </select>
              </div>
              
              <textarea
                placeholder="Describe your use case and requirements *"
                value={formData.useCase}
                onChange={(e) => setFormData({...formData, useCase: e.target.value})}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
