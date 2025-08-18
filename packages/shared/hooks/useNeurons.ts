'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBrand } from '../contexts/BrandContext';
import { createClientSideClient, getBrandPrompts } from '../lib/supabase-client';
import { Database } from '../lib/supabase-client';

type Prompt = Database['public']['Tables']['prompts']['Row'];

interface NeuronsState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
}

interface NeuronsActions {
  fetchPrompts: (filters?: PromptFilters) => Promise<void>;
  fetchPrompt: (id: string) => Promise<Prompt | null>;
  searchPrompts: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface PromptFilters {
  category?: string;
  difficulty?: string;
  tier?: string;
  tags?: string[];
  minDepth?: number;
  maxDepth?: number;
  minComplexity?: number;
  maxComplexity?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

const ITEMS_PER_PAGE = 20;

export default function useNeurons(): NeuronsState & NeuronsActions {
  const { currentBrand } = useBrand();
  const [state, setState] = useState<NeuronsState>({
    prompts: [],
    loading: false,
    error: null,
    totalCount: 0,
    hasMore: false
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<PromptFilters>({});

  const supabase = createClientSideClient();

  const fetchPrompts = useCallback(async (filters: PromptFilters = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      setCurrentFilters(filters);
      setCurrentPage(1);

      let query = supabase
        .from('prompts')
        .select('*', { count: 'exact' })
        .eq('brand_id', currentBrand.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(0, ITEMS_PER_PAGE - 1);

      // Apply filters
      if (filters.category) {
        query = query.eq('cognitive_category', filters.category);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty_tier', filters.difficulty);
      }
      if (filters.tier) {
        query = query.eq('required_tier', filters.tier);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('meta_tags', filters.tags);
      }
      if (filters.minDepth !== undefined) {
        query = query.gte('cognitive_depth_score', filters.minDepth);
      }
      if (filters.maxDepth !== undefined) {
        query = query.lte('cognitive_depth_score', filters.maxDepth);
      }
      if (filters.minComplexity !== undefined) {
        query = query.gte('pattern_complexity', filters.minComplexity);
      }
      if (filters.maxComplexity !== undefined) {
        query = query.lte('pattern_complexity', filters.maxComplexity);
      }
      if (filters.priceRange) {
        query = query.gte('base_price_cents', filters.priceRange.min * 100);
        query = query.lte('base_price_cents', filters.priceRange.max * 100);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setState(prev => ({
        ...prev,
        prompts: data || [],
        totalCount: count || 0,
        hasMore: (data?.length || 0) === ITEMS_PER_PAGE,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch prompts',
        loading: false
      }));
    }
  }, [supabase, currentBrand.id]);

  const fetchPrompt = useCallback(async (id: string): Promise<Prompt | null> => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .eq('brand_id', currentBrand.id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch prompt'
      }));
      return null;
    }
  }, [supabase, currentBrand.id]);

  const searchPrompts = useCallback(async (query: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error, count } = await supabase
        .from('prompts_search')
        .select('id, search_vector')
        .eq('brand_id', currentBrand.id)
        .textSearch('search_vector', query)
        .order('search_vector', { ascending: false })
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Fetch full prompt data for search results
      if (data && data.length > 0) {
        const promptIds = data.map(item => item.id);
        const { data: prompts, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .in('id', promptIds)
          .eq('brand_id', currentBrand.id)
          .eq('is_published', true);

        if (promptsError) throw promptsError;

        setState(prev => ({
          ...prev,
          prompts: prompts || [],
          totalCount: count || 0,
          hasMore: (prompts?.length || 0) === ITEMS_PER_PAGE,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          prompts: [],
          totalCount: 0,
          hasMore: false,
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        loading: false
      }));
    }
  }, [supabase, currentBrand.id]);

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    try {
      setState(prev => ({ ...prev, loading: true }));
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      let query = supabase
        .from('prompts')
        .select('*')
        .eq('brand_id', currentBrand.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range((nextPage - 1) * ITEMS_PER_PAGE, nextPage * ITEMS_PER_PAGE - 1);

      // Apply current filters
      if (currentFilters.category) {
        query = query.eq('cognitive_category', currentFilters.category);
      }
      if (currentFilters.difficulty) {
        query = query.eq('difficulty_tier', currentFilters.difficulty);
      }
      if (currentFilters.tier) {
        query = query.eq('required_tier', currentFilters.tier);
      }
      if (currentFilters.tags && currentFilters.tags.length > 0) {
        query = query.overlaps('meta_tags', currentFilters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;

      setState(prev => ({
        ...prev,
        prompts: [...prev.prompts, ...(data || [])],
        hasMore: (data?.length || 0) === ITEMS_PER_PAGE,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load more prompts',
        loading: false
      }));
    }
  }, [supabase, currentBrand.id, currentPage, currentFilters, state.loading, state.hasMore]);

  const refresh = useCallback(async () => {
    await fetchPrompts(currentFilters);
  }, [fetchPrompts, currentFilters]);

  // Initial fetch
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    ...state,
    fetchPrompts,
    fetchPrompt,
    searchPrompts,
    loadMore,
    refresh
  };
}
