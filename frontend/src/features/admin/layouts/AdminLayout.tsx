import React from 'react';
import { Outlet } from 'react-router-dom';
import { BaseLayout } from '@/components/layout/BaseLayout';
import type { NavSection, UserProfileData } from '@/components/layout/types';
import { useAuth } from '@/contexts/AuthContext'; // Puxar o usuário de verdade se necessário

export function AdminLayout() {
  const { profile } = useAuth(); // Caso tenhamos o AuthContext funcionando

  // Mapeamento dos menus específicos do Admin
  const adminSections: NavSection[] = [
    {
      title: 'Menu principal',
      links: [
        { path: '/dashboard', icon: 'ph-squares-four', label: 'Dashboard' },
        { path: '/atendimento', icon: 'ph-stethoscope', label: 'Atendimento' },
        { path: '/faturamento', icon: 'ph-receipt', label: 'Faturamento TISS' },
        { path: '/auditoria', icon: 'ph-shield-check', label: 'Auditoria', badge: 3 },
      ]
    },
    {
      title: 'Mais relatórios',
      links: [
        { path: '/repasse', icon: 'ph-money', label: 'Repasse médico' },
        { path: '/programacao', icon: 'ph-calendar', label: 'Programação' },
        { path: '/autorizacoes', icon: 'ph-key', label: 'Autorizações' },
      ]
    }
  ];

  // Se não houver nome (estiver carregando ou vazio), passamos vazio para mostrar o skeleton de carregamento.
  const userProfile: UserProfileData = {
    initials: profile?.nome ? profile.nome.substring(0, 2) : '',
    name: profile?.nome || '',
    role: profile?.role === 'admin' ? 'Administrador' : ''
  };

  return (
    <BaseLayout sections={adminSections} userProfile={userProfile}>
      <Outlet />
    </BaseLayout>
  );
}
