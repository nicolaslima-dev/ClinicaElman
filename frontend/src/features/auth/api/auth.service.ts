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

/**
 * Solicita a recuperação de senha via RPC
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.rpc('request_password_reset', { p_email: email });
    if (error) throw error;
    
    // Retornamos true mesmo se falhar para não confirmar a existência do e-mail
    return { success: data as boolean, error: null };
  } catch (err: any) {
    return { success: false, error: { message: 'Falha ao solicitar código. Tente novamente mais tarde.' } };
  }
};

/**
 * Verifica o código de 6 dígitos
 */
export const verifyResetToken = async (email: string, code: string): Promise<{ success: boolean; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.rpc('verify_password_reset_code', { p_email: email, p_code: code });
    if (error) throw error;
    
    if (!data) {
      return { success: false, error: { message: 'Código de segurança inválido ou expirado.' } };
    }
    
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: { message: 'Erro ao validar o código.' } };
  }
};

/**
 * Atualiza a senha usando o código de 6 dígitos
 */
export const updatePassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.rpc('update_password_with_token', { 
      p_email: email, 
      p_code: code, 
      p_new_password: newPassword 
    });
    
    if (error) throw error;
    
    return { success: data as boolean, error: null };
  } catch (err: any) {
    return { success: false, error: { message: err.message || 'Erro ao atualizar senha. Verifique o código e tente novamente.' } };
  }
};
