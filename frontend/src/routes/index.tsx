import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';

import { RoleRedirect } from './RoleRedirect';
import { RoleGuard } from './RoleGuard';

// --- Mocks Visuais Simples para Teste de Redirecionamento ---
const DashboardMock = () => <div className="p-10 font-bold text-2xl text-brand-900">Dashboard Executivo (admin)</div>;
const AtendimentoMock = () => <div className="p-10 font-bold text-2xl text-emerald-700">Tela de Atendimento (medico, recepcao)</div>;
const FaturamentoMock = () => <div className="p-10 font-bold text-2xl text-gold-700">Setor de Faturamento (faturamento)</div>;
const AuditoriaMock = () => <div className="p-10 font-bold text-2xl text-red-700">Setor de Auditoria (auditoria)</div>;
// -----------------------------------------------------------

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

          {/* Rotas Protegidas e Agrupadas por Role */}
          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/dashboard" element={<DashboardMock />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['medico', 'recepcao']} />}>
            <Route path="/atendimento" element={<AtendimentoMock />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['faturamento']} />}>
            <Route path="/faturamento" element={<FaturamentoMock />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['auditoria']} />}>
            <Route path="/auditoria" element={<AuditoriaMock />} />
          </Route>
          
          {/* Fallback Catch-all: Re-direciona para a raiz para o RoleRedirect agir */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </div>
    </Router>
  );
}
