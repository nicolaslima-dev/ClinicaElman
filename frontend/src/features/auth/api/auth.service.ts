import { supabase } from '@/services/supabase';
import type { UserSession, AuthError } from '../types';

/**
 * Autentica um usuário usando e-mail e senha.
 * @param email Email do usuário
 * @param password Senha do usuário
 * @returns Promessa com a sessão do usuário ou erro
 */
export const login = async (email: string, password: string): Promise<{ data: UserSession | null, error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Buscar o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Falha ao obter perfil de acesso (Role). Contate a TI.');
    }

    return {
      data: {
        user: profile,
        accessToken: data.session.access_token,
      },
      error: null
    };

  } catch (err: any) {
    let message = 'Erro ao realizar login. Tente novamente mais tarde.';
    
    // Tratamento de mensagens específicas do Supabase
    if (err.message === 'Invalid login credentials') {
      message = 'E-mail ou senha incorretos.';
    } else if (err.message === 'Email not confirmed') {
      message = 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    }

    return {
      data: null,
      error: { message }
    };
  }
};
