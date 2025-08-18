'use client';

import React from 'react';
import { useBrand } from '../contexts/BrandContext';
import { BRAND_IDS } from '../types/brand';

interface NeuronCardProps {
  id: string;
  title: string;
  slug: string;
  cognitiveCategory: string;
  difficultyTier: string;
  requiredTier: string;
  previewContent: string;
  cognitiveDepthScore: number;
  patternComplexity: number;
  meaningLayers: string[];
  antiSurfaceFeatures: string[];
  basePriceCents: number;
  digitalRoot: number;
  metaTags: string[];
  isPublished: boolean;
  qualityScore: number;
  onCardClick?: (id: string) => void;
}

export default function NeuronCard({
  id,
  title,
  slug,
  cognitiveCategory,
  difficultyTier,
  requiredTier,
  previewContent,
  cognitiveDepthScore,
  patternComplexity,
  meaningLayers,
  antiSurfaceFeatures,
  basePriceCents,
  digitalRoot,
  metaTags,
  isPublished,
  qualityScore,
  onCardClick
}: NeuronCardProps) {
  const { currentBrand } = useBrand();
  const is8Vultus = currentBrand.id === BRAND_IDS.EIGHT_VULTUS;

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(id);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-green-600 bg-green-100';
      case 'architect': return 'text-blue-600 bg-blue-100';
      case 'initiate': return 'text-purple-600 bg-purple-100';
      case 'elite': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'foundation': return 'text-green-600';
      case 'advanced': return 'text-yellow-600';
      case 'expert': return 'text-orange-600';
      case 'architect': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div 
      className={`
        relative p-6 border border-border rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer
        ${is8Vultus ? 'eightvultus-pulse' : 'ai-prompt-glow'}
        ${isPublished ? 'bg-background' : 'bg-muted/20'}
      `}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(requiredTier)}`}>
              {requiredTier}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficultyTier)}`}>
              {difficultyTier}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
              {cognitiveCategory}
            </span>
          </div>
        </div>
        
        {/* Quality Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{qualityScore}</div>
          <div className="text-xs text-muted">Quality</div>
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-muted mb-4 line-clamp-3">
        {previewContent}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-primary">{cognitiveDepthScore}</div>
          <div className="text-xs text-muted">Depth</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-secondary">{patternComplexity}</div>
          <div className="text-xs text-muted">Complexity</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-accent">{digitalRoot}</div>
          <div className="text-xs text-muted">Digital Root</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {metaTags.slice(0, 3).map((tag, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-muted/30 text-muted text-xs rounded"
          >
            {tag}
          </span>
        ))}
        {metaTags.length > 3 && (
          <span className="px-2 py-1 bg-muted/30 text-muted text-xs rounded">
            +{metaTags.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <div className="text-sm text-muted">
          {meaningLayers.length} meaning layers
        </div>
        <div className="text-sm font-medium text-primary">
          {basePriceCents > 0 ? `€${(basePriceCents / 100).toFixed(2)}` : 'Free'}
        </div>
      </div>

      {/* Brand-specific indicator */}
      <div className="absolute top-2 right-2">
        <div className={`
          w-3 h-3 rounded-full
          ${is8Vultus ? 'bg-purple-500' : 'bg-blue-500'}
        `} />
      </div>
    </div>
  );
}
