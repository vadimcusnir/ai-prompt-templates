import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  TrialBadge,
  MoneyBackGuarantee,
  EnterpriseContact,
  UsageExamples,
  CustomerTestimonials,
  IntegrationDetails,
  SupportAndSLA
} from '../index'

// Mock for plans from lib/plans
const mockTrialConfig = {
  enabled: true,
  days: 7,
  features: ['Full access', 'No credit card required'],
  noCreditCard: true
}

const mockPlan = 'explorer'

describe('Pricing Components', () => {
  describe('TrialBadge', () => {
    it('renders trial badge when trial is enabled', () => {
      render(<TrialBadge trial={mockTrialConfig} planName="Explorer" />)
      expect(screen.getByText('7 Days Free Trial')).toBeInTheDocument()
      expect(screen.getByText('No Credit Card Required')).toBeInTheDocument()
    })

    it('does not render when trial is disabled', () => {
      const disabledTrial = { ...mockTrialConfig, enabled: false }
      const { container } = render(<TrialBadge trial={disabledTrial} planName="Explorer" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('MoneyBackGuarantee', () => {
    it('renders money-back guarantee section', () => {
      render(<MoneyBackGuarantee />)
      expect(screen.getByText(/30-Day Money-Back Guarantee/)).toBeInTheDocument()
      expect(screen.getByText(/Satisfaction guarantee for all paid plans/)).toBeInTheDocument()
    })
  })

  describe('EnterpriseContact', () => {
    it('renders enterprise contact section', () => {
      render(<EnterpriseContact />)
      expect(screen.getByText('Enterprise Solutions')).toBeInTheDocument()
      expect(screen.getByText(/Custom pricing and solutions/)).toBeInTheDocument()
    })

    it('shows enterprise contact form when button is clicked', () => {
      render(<EnterpriseContact />)
      const button = screen.getByText('Get Custom Enterprise Quote')
      button.click()
      expect(screen.getByText('Enterprise Contact Form')).toBeInTheDocument()
    })
  })

  describe('UsageExamples', () => {
    it('renders usage examples section', () => {
      render(<UsageExamples />)
      expect(screen.getByText('See AI-Prompt-Templates in Action')).toBeInTheDocument()
    })
  })

  describe('CustomerTestimonials', () => {
    it('renders customer testimonials section', () => {
      render(<CustomerTestimonials />)
      expect(screen.getByText('What Our Customers Say')).toBeInTheDocument()
    })
  })

  describe('IntegrationDetails', () => {
    it('renders integration details section', () => {
      render(<IntegrationDetails />)
      expect(screen.getByText('Seamless Integration with Your Existing Tools')).toBeInTheDocument()
    })

    it('shows API tab by default', () => {
      render(<IntegrationDetails />)
      expect(screen.getByText('REST API')).toBeInTheDocument()
    })
  })

  describe('SupportAndSLA', () => {
    it('renders support and SLA section', () => {
      render(<SupportAndSLA />)
      expect(screen.getByText('Support & Service Level Agreements')).toBeInTheDocument()
    })

    it('shows explorer plan by default', () => {
      render(<SupportAndSLA />)
      expect(screen.getByText('Explorer')).toBeInTheDocument()
    })
  })
})

// Test for all components together
describe('Pricing Components Integration', () => {
  it('all components can be imported and rendered together', () => {
    const { container } = render(
      <div>
        <TrialBadge trial={mockTrialConfig} planName="Explorer" />
        <MoneyBackGuarantee />
        <EnterpriseContact />
        <UsageExamples />
        <CustomerTestimonials />
        <IntegrationDetails />
        <SupportAndSLA />
      </div>
    )
    
    expect(container).toBeInTheDocument()
    expect(container.children.length).toBeGreaterThan(0)
  })
})
