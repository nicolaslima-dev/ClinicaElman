import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_DEFAULT_ROUTES } from '../features/auth/types/auth.types';
import { Loader2 } from 'lucide-react';

export function RoleRedirect() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mb-6 shadow-brand-glow animate-pulse">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Clínica Elman</h1>
        <p className="text-ink-400 text-sm font-medium">Autenticando credenciais seguras...</p>
      </div>
    );
  }

  // Se não estiver logado ou o perfil não existir, vai para login
  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Despacho seguro baseado na role obtida do banco
  const defaultRoute = ROLE_DEFAULT_ROUTES[profile.role] || '/login';
  
  return <Navigate to={defaultRoute} replace />;
}
