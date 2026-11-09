import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminPacientesPage } from '@/features/admin/pages/AdminPacientesPage';
import { AdminAutorizacoesPage } from '@/features/admin/pages/AdminAutorizacoesPage';
import { PortalTerapeutaPage } from '@/features/admin/pages/PortalTerapeutaPage';
import { AdminAtendimentoPage } from '@/features/admin/pages/AdminAtendimentoPage';
import { AdminNovoAtendimentoPage } from '@/features/admin/pages/AdminNovoAtendimentoPage';
import { AdminFaturamentoPage } from '@/features/admin/pages/AdminFaturamentoPage';
import { AdminAuditoriaPage } from '@/features/admin/pages/AdminAuditoriaPage';
import { AdminLayout } from '@/features/admin/layouts/AdminLayout';

import { RoleRedirect } from './RoleRedirect';
import { RoleGuard } from './RoleGuard';
import { NotFoundPage } from './NotFoundPage';

export function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen bg-ink-50 font-sans text-ink-900">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Rota Raiz - Despachante Zero-Trust */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Rotas Autenticadas com Layout Unificado e Guardas Granulares por Role */}
          <Route
            element={
              <RoleGuard
                allowedRoles={['admin', 'medico', 'recepcao', 'faturamento', 'auditoria']}
              />
            }
          >
            <Route element={<AdminLayout />}>
              <Route element={<RoleGuard allowedRoles={['admin']} />}>
                <Route path="/dashboard" element={<AdminDashboardPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['admin', 'recepcao']} />}>
                <Route path="/pacientes" element={<AdminPacientesPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['admin', 'recepcao', 'faturamento']} />}>
                <Route path="/autorizacoes" element={<AdminAutorizacoesPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['admin', 'medico']} />}>
                <Route path="/portal-terapeuta" element={<PortalTerapeutaPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['admin', 'recepcao', 'medico']} />}>
                <Route path="/atendimento" element={<AdminAtendimentoPage />} />
                <Route path="/atendimento/novo" element={<AdminNovoAtendimentoPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['admin', 'faturamento', 'auditoria']} />}>
                <Route path="/faturamento" element={<AdminFaturamentoPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['admin', 'auditoria']} />}>
                <Route path="/auditoria" element={<AdminAuditoriaPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404: Página em construção / Não encontrada */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}
