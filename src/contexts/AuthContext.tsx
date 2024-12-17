import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, InstructorProfile } from '../types/auth';
import { logger } from '../utils/logger';

interface AuthContextType {
  session: Session | null;
  user: UserProfile | InstructorProfile | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  isInstructor: boolean;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  error: null,
  signOut: async () => {},
  isInstructor: false,
  signUp: async () => ({ data: null, error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | InstructorProfile | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const clearUserData = () => {
    setUser(null);
    setSession(null);
    setIsInstructor(false);
  };

  const createProfile = async (session: Session, role: UserRole = 'user') => {
    try {
      logger.info('Creating new user profile', { userId: session.user.id, role });
      const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: session.user.id,
          email: session.user.email,
          role: role,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata.avatar_url,
          created_at: new Date().toISOString(),
          ...(role === 'instructor' && {
            experience_years: 0,
            certifications: [],
            specialties: [],
            total_events: 0,
          }),
        },
      ])
      .select()
      .single();

      if (error) {
        logger.error('Error creating profile', { error });
        throw error;
      }

      logger.info('Profile created successfully', { profile: newProfile });
      return newProfile;
    } catch (err) {
      logger.error('Failed to create profile', { error: err });
      throw err;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsLoading(true);
      try {
        logger.info('Getting session');
        setSession(session);
        
        if (session?.user) {
          logger.info('User authenticated', { userId: session.user.id });
          let { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            logger.error('Error fetching profile', { error });
            throw error;
          }

          // Si no existe el perfil, créalo
          if (!profile) {
            logger.info('Profile not found, creating new one');
            profile = await createProfile(session);
          }

          if (profile) {
            logger.info('Setting user profile', { profile });
            setUser(profile);
            setIsInstructor(profile.role === 'instructor');
          }
        }
      } catch (err) {
        logger.error('Session initialization error', { error: err });
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // Si no existe el perfil, créalo
        if (!profile && event === 'SIGNED_IN') {
          const newProfile = await createProfile(session, session.user.user_metadata.role || 'user');
          profile = newProfile;
        }

        if (profile) {
          setUser(profile);
          setIsInstructor(profile.role === 'instructor');
        } else {
          setUser(null);
          setIsInstructor(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      logger.info('Iniciando proceso de logout');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      logger.info('Logout exitoso');
      clearUserData();
    } catch (err) {
      logger.error('Error durante el logout', { error: err });
      throw err;
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        session,
        user,
        isLoading,
        error,
        signOut,
        isInstructor,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}