export type UserRole = 'admin' | 'medico' | 'faturamento' | 'auditoria' | 'recepcao';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  admin: '/dashboard',
  medico: '/portal-terapeuta',
  faturamento: '/faturamento',
  auditoria: '/auditoria',
  recepcao: '/atendimento',
};
