import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { UserProfile } from '../features/auth/types/auth.types';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual no primeiro carregamento
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listener para mudanças de estado de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          // No SIGNED_IN nós podemos já ter feito o fetchProfile via login, 
          // mas para consistência sempre buscamos a role.
          setIsLoading(true);
        }
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      } else {
        console.error('Erro ao buscar perfil (role):', error);
        setProfile(null);
      }
    } catch (err) {
      console.error('Erro de rede ao buscar perfil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
