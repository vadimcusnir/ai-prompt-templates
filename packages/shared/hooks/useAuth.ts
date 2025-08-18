'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBrand } from '../contexts/BrandContext';
import { createClientSideClient } from '../lib/supabase-client';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

export default function useAuth(): AuthState & AuthActions {
  const { currentBrand } = useBrand();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  const supabase = createClientSideClient();

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Set brand context for the user
      if (data.user) {
        await supabase.rpc('set_brand_context', { 
          brand_id: currentBrand.id 
        });
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase, currentBrand.id]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            brand_id: currentBrand.id,
            brand_name: currentBrand.name
          }
        }
      });

      if (error) throw error;

      // Create user record in our database
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            brand_id: currentBrand.id,
            email: data.user.email!,
            tier: 'free'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase, currentBrand.id, currentBrand.name]);

  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Password reset failed' 
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase]);

  const updateProfile = useCallback(async (updates: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      // Update user profile in our database if needed
      if (authState.user) {
        const { error: profileError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', authState.user.id);

        if (profileError) {
          console.error('Error updating user profile:', profileError);
        }
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase, authState.user]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthState(prev => ({ 
        ...prev, 
        user: session?.user ?? null, 
        session, 
        loading: false 
      }));
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({ 
          ...prev, 
          user: session?.user ?? null, 
          session, 
          loading: false 
        }));

        // Set brand context when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          await supabase.rpc('set_brand_context', { 
            brand_id: currentBrand.id 
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, currentBrand.id]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };
}
