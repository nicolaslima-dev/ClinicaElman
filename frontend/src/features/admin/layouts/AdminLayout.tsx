import React from 'react';
import { Outlet } from 'react-router-dom';
import { BaseLayout } from '@/components/layout/BaseLayout';
import type { NavSection, UserProfileData } from '@/components/layout/types';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/features/auth/types/auth.types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  medico: 'Terapeuta / Corpo Clínico',
  recepcao: 'Recepção',
  faturamento: 'Faturamento',
  auditoria: 'Auditoria',
};

export function AdminLayout() {
  const { profile } = useAuth();
  const role: UserRole = profile?.role || 'admin';

  // Links de navegação filtrados por perfil (Role-Based Menu)
  const mainLinks = [
    { path: '/dashboard', icon: 'ph-squares-four', label: 'Dashboard', roles: ['admin'] as UserRole[] },
    { path: '/pacientes', icon: 'ph-users', label: 'Pacientes', roles: ['admin', 'recepcao'] as UserRole[] },
    { path: '/autorizacoes', icon: 'ph-key', label: 'Autorizações & Guias', roles: ['admin', 'recepcao', 'faturamento'] as UserRole[] },
    { path: '/portal-terapeuta', icon: 'ph-clipboard-text', label: 'Portal do Terapeuta', roles: ['admin', 'medico'] as UserRole[] },
    { path: '/atendimento', icon: 'ph-stethoscope', label: 'Atendimento', roles: ['admin', 'recepcao', 'medico'] as UserRole[] },
    { path: '/faturamento', icon: 'ph-receipt', label: 'Faturamento TISS', roles: ['admin', 'faturamento', 'auditoria'] as UserRole[] },
    { path: '/auditoria', icon: 'ph-shield-check', label: 'Auditoria', badge: 3, roles: ['admin', 'auditoria'] as UserRole[] },
  ].filter((item) => item.roles.includes(role));

  const reportLinks = [
    { path: '/repasse', icon: 'ph-money', label: 'Repasse médico', roles: ['admin'] as UserRole[] },
    { path: '/programacao', icon: 'ph-calendar', label: 'Programação', roles: ['admin'] as UserRole[] },
  ].filter((item) => item.roles.includes(role));

  const adminSections: NavSection[] = [
    {
      title: 'Menu principal',
      links: mainLinks.map(({ path, icon, label, badge }) => ({ path, icon, label, badge })),
    },
    ...(reportLinks.length > 0
      ? [
          {
            title: 'Mais relatórios',
            links: reportLinks.map(({ path, icon, label }) => ({ path, icon, label })),
          },
        ]
      : []),
  ];

  // Se não houver nome (estiver carregando ou vazio), passamos vazio para mostrar o skeleton de carregamento.
  const userProfile: UserProfileData = {
    initials: profile?.nome ? profile.nome.substring(0, 2).toUpperCase() : '',
    name: profile?.nome || '',
    role: profile?.role ? ROLE_LABELS[profile.role] : '',
  };

  return (
    <BaseLayout sections={adminSections} userProfile={userProfile}>
      <Outlet />
    </BaseLayout>
  );
}
