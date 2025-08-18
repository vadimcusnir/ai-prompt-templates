'use client';

import React, { useState } from 'react';
import { useBrand } from '../contexts/BrandContext';
import { BRAND_IDS } from '../types/brand';

export default function Navigation() {
  const { currentBrand, switchBrand } = useBrand();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
  ];

  const handleBrandSwitch = () => {
    switchBrand();
    setIsMenuOpen(false);
  };

  const getOtherBrandInfo = () => {
    if (currentBrand.id === BRAND_IDS.AI_PROMPT_TEMPLATES) {
      return {
        name: '8Vultus',
        description: 'Elite consciousness mapping',
        href: 'https://8vultus.com'
      };
    } else {
      return {
        name: 'AI Prompt Templates',
        description: 'Cognitive frameworks',
        href: 'https://ai-prompt-templates.com'
      };
    }
  };

  const otherBrand = getOtherBrandInfo();

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-3">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg
              ${currentBrand.id === BRAND_IDS.EIGHT_VULTUS ? 'bg-purple-600' : 'bg-blue-600'}
            `}>
              {currentBrand.id === BRAND_IDS.EIGHT_VULTUS ? '8' : 'AI'}
            </div>
            <div>
              <div className="font-bold text-xl text-foreground">
                {currentBrand.name}
              </div>
              <div className="text-xs text-muted">
                {currentBrand.description}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Brand Switch Button */}
            <button
              onClick={handleBrandSwitch}
              className="hidden md:flex items-center space-x-2 px-3 py-2 text-sm text-muted hover:text-primary transition-colors"
            >
              <span>Switch to</span>
              <span className="font-medium">{otherBrand.name}</span>
            </button>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <button className="px-4 py-2 text-foreground hover:text-primary transition-colors">
                Sign In
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              
              {/* Mobile Brand Switch */}
              <button
                onClick={handleBrandSwitch}
                className="flex items-center justify-between px-4 py-2 text-left text-foreground hover:text-primary transition-colors"
              >
                <span>Switch to {otherBrand.name}</span>
                <span className="text-sm text-muted">{otherBrand.description}</span>
              </button>

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-2 px-4">
                <button className="px-4 py-2 text-foreground hover:text-primary transition-colors text-left">
                  Sign In
                </button>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-left">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
