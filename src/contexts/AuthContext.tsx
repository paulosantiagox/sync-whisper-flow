import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AppUser>) => Promise<void>;
  isAuthenticated: boolean;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      const role = roleData?.role || 'user';
      setIsMaster(role === 'master');

      if (profile) {
        const appUser: AppUser = {
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          role: role as 'master' | 'user',
          photo: profile.photo || undefined,
          status: profile.status || 'active',
          createdAt: profile.created_at,
          lastLogin: profile.last_login || undefined,
        };
        setUser(appUser);
        return appUser;
      }
      return null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setUser(null);
          setIsMaster(false);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsMaster(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        fetchUserProfile(existingSession.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: 'Email ou senha inválidos' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro ao fazer login' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro ao criar conta' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsMaster(false);
  }, []);

  const updateUser = useCallback(async (updates: Partial<AppUser>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        email: updates.email,
        photo: updates.photo,
      })
      .eq('id', user.id);

    if (!error) {
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
      isAuthenticated: !!session,
      isMaster,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
