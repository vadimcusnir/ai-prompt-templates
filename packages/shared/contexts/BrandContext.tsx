'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrandConfig, BrandId, BRAND_IDS } from '../types/brand';
import { getBrandConfig, getBrandConfigByDomain } from '../lib/brand-configs';

interface BrandContextType {
  currentBrand: BrandConfig;
  setBrand: (brandId: BrandId) => void;
  isBrand: (brandId: BrandId) => boolean;
  switchBrand: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
  initialBrandId?: BrandId;
}

export function BrandProvider({ children, initialBrandId = BRAND_IDS.AI_PROMPT_TEMPLATES }: BrandProviderProps) {
  const [currentBrand, setCurrentBrand] = useState<BrandConfig>(() => 
    getBrandConfig(initialBrandId)
  );

  useEffect(() => {
    // Detectează brand-ul din URL sau domain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const detectedBrand = getBrandConfigByDomain(hostname);
      if (detectedBrand && detectedBrand.id !== currentBrand.id) {
        setCurrentBrand(detectedBrand);
      }
    }
  }, []);

  const setBrand = (brandId: BrandId) => {
    const newBrand = getBrandConfig(brandId);
    setCurrentBrand(newBrand);
    
    // Actualizează documentul cu tema brand-ului
    document.documentElement.setAttribute('data-brand', brandId);
    document.documentElement.style.setProperty('--color-primary', newBrand.theme.primary);
    document.documentElement.style.setProperty('--color-secondary', newBrand.theme.secondary);
    document.documentElement.style.setProperty('--color-accent', newBrand.theme.accent);
    document.documentElement.style.setProperty('--color-background', newBrand.theme.background);
    document.documentElement.style.setProperty('--color-text', newBrand.theme.text);
    document.documentElement.style.setProperty('--color-muted', newBrand.theme.muted);
    document.documentElement.style.setProperty('--color-border', newBrand.theme.border);
  };

  const isBrand = (brandId: BrandId): boolean => {
    return currentBrand.id === brandId;
  };

  const switchBrand = () => {
    const nextBrandId = currentBrand.id === BRAND_IDS.AI_PROMPT_TEMPLATES 
      ? BRAND_IDS.EIGHT_VULTUS 
      : BRAND_IDS.AI_PROMPT_TEMPLATES;
    setBrand(nextBrandId);
  };

  useEffect(() => {
    // Aplică tema inițială
    document.documentElement.setAttribute('data-brand', currentBrand.id);
    document.documentElement.style.setProperty('--color-primary', currentBrand.theme.primary);
    document.documentElement.style.setProperty('--color-secondary', currentBrand.theme.secondary);
    document.documentElement.style.setProperty('--color-accent', currentBrand.theme.accent);
    document.documentElement.style.setProperty('--color-background', currentBrand.theme.background);
    document.documentElement.style.setProperty('--color-text', currentBrand.theme.text);
    document.documentElement.style.setProperty('--color-muted', currentBrand.theme.muted);
    document.documentElement.style.setProperty('--color-border', currentBrand.theme.border);
  }, [currentBrand]);

  const value: BrandContextType = {
    currentBrand,
    setBrand,
    isBrand,
    switchBrand
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextType {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
