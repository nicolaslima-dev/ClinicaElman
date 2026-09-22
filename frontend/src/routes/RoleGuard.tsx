import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { type UserRole, ROLE_DEFAULT_ROUTES } from '../features/auth/types/auth.types';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Se não estiver logado
  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Validação estrita da role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(profile.role)) {
      // Registra a violação (poderia enviar para um serviço de log/monitoramento)
      console.warn(`[Segurança] Violação de Acesso: Usuário ${profile.id} com role '${profile.role}' tentou acessar rota restrita a [${allowedRoles.join(', ')}].`);
      
      // Redireciona para o destino padrão da role
      const defaultRoute = ROLE_DEFAULT_ROUTES[profile.role] || '/login';
      return <Navigate to={defaultRoute} replace />;
    }
  }

  // Autorizado, renderiza os filhos
  return <Outlet />;
}
