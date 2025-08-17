'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserTier = 'free' | 'architect' | 'initiate' | 'elite';

interface UserSubscription {
  id: string;
  user_id: string;
  plan_tier: UserTier;
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string;
}

interface UserEntitlement {
  id: string;
  user_id: string;
  neuron_id: string;
  acquired_at: string;
  expires_at?: string;
  neuron: {
    slug: string;
    title: string;
    summary: string;
  };
}

interface AuthContextType {
  user: User | null;
  userTier: UserTier;
  activePlan: UserSubscription | null;
  entitlements: UserEntitlement[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [activePlan, setActivePlan] = useState<UserSubscription | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data including tier and entitlements
  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      // Get active plan
      const { data: plan, error: planError } = await supabase.rpc('get_my_active_plan');
      if (planError) throw planError;
      setActivePlan(plan);
      
      // Get entitlements
      const { data: userEntitlements, error: entitlementsError } = await supabase.rpc('list_my_entitlements');
      if (entitlementsError) throw entitlementsError;
      setEntitlements(userEntitlements || []);
      
      // Determine user tier from plan
      if (plan) {
        setUserTier(plan.plan_tier);
      } else {
        setUserTier('free');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Fallback to free tier on error
      setUserTier('free');
      setActivePlan(null);
      setEntitlements([]);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      setUser(data.user);
      await refreshUserData();
    }
  };

  // Sign up with email, password and name
  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      setUser(data.user);
      // Note: user will need to verify email before full access
    }
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    setUser(null);
    setUserTier('free');
    setActivePlan(null);
    setEntitlements([]);
  };

  // Check if user can access a specific tier
  const canAccessTier = (requiredTier: UserTier): boolean => {
    const tierHierarchy = { free: 0, architect: 1, initiate: 2, elite: 3 };
    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  };

  // Check if user has access to a specific neuron
  const hasNeuronAccess = (neuronId: string): boolean => {
    return entitlements.some(entitlement => entitlement.neuron_id === neuronId);
  };

  // Initialize auth state
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await refreshUserData();
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await refreshUserData();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserTier('free');
          setActivePlan(null);
          setEntitlements([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    userTier,
    activePlan,
    entitlements,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export utility functions
export { canAccessTier, hasNeuronAccess };
