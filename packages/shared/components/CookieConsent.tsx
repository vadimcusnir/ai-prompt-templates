'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '../contexts/BrandContext';

export default function CookieConsent() {
  const { currentBrand } = useBrand();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">
              Cookie Policy for {currentBrand.name}
            </h3>
            <p className="text-sm text-muted">
              We use cookies to enhance your experience on {currentBrand.domain}. 
              By continuing to use this site, you consent to our use of cookies. 
              Learn more in our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-muted hover:text-foreground transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
