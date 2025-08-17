'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LockIcon, UnlockIcon, StarIcon, TagIcon } from 'lucide-react';

interface NeuronPreview {
  id: string;
  slug: string;
  title: string;
  summary: string;
  required_tier: 'free' | 'architect' | 'initiate' | 'elite';
  price_cents: number;
  category: string;
  tags: string[];
  depth_score?: number;
  pattern_complexity?: number;
  created_at: string;
}

interface NeuronCardProps {
  neuron: NeuronPreview;
  showActions?: boolean;
}

export function NeuronCard({ neuron, showActions = true }: NeuronCardProps) {
  const { user, userTier } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-yellow-500';
      case 'initiate': return 'bg-purple-500';
      case 'architect': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'elite': return 'Elite';
      case 'initiate': return 'Inițiat';
      case 'architect': return 'Arhitect';
      default: return 'Free';
    }
  };

  const canAccess = () => {
    if (neuron.required_tier === 'free') return true;
    if (!user) return false;
    
    const tierHierarchy = { free: 0, architect: 1, initiate: 2, elite: 3 };
    return tierHierarchy[userTier] >= tierHierarchy[neuron.required_tier];
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Gratuit';
    return `${(cents / 100).toFixed(2)}€`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden
        transition-all duration-200 hover:shadow-lg
        ${isHovered ? 'transform -translate-y-1' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with tier badge */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <span className={`
            ${getTierColor(neuron.required_tier)} 
            text-white px-2 py-1 rounded-full text-xs font-semibold uppercase
          `}>
            {getTierLabel(neuron.required_tier)}
          </span>
          
          {neuron.price_cents > 0 && (
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(neuron.price_cents)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {neuron.title}
        </h3>

        {/* Summary */}
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {neuron.summary}
        </p>

        {/* Category and Tags */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {neuron.category}
          </span>
          {neuron.tags.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center"
            >
              <TagIcon className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {neuron.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{neuron.tags.length - 2}
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {neuron.depth_score && (
            <div className="flex items-center">
              <StarIcon className="w-3 h-3 mr-1" />
              Profunzime: {neuron.depth_score}/10
            </div>
          )}
          {neuron.pattern_complexity && (
            <div>
              Complexitate: {neuron.pattern_complexity}/5
            </div>
          )}
          <div>
            {formatDate(neuron.created_at)}
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-4 pb-4">
          {canAccess() ? (
            <div className="flex space-x-2">
              <Link
                href={`/n/${neuron.slug}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Vezi Preview
              </Link>
              {user && (
                <Link
                  href={`/n/${neuron.slug}/read`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <UnlockIcon className="w-4 h-4 mr-1" />
                  Acces Complet
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <LockIcon className="w-4 h-4 mr-2" />
                Necesită plan {getTierLabel(neuron.required_tier)}
              </div>
              <Link
                href="/pricing"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
