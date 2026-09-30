import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoElman from '@/assets/images/logos/logo-elman.png';
import type { UserProfileData } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmLogoutModal } from '@/components/ui/ConfirmLogoutModal';

interface HeaderProps {
  userProfile: UserProfileData;
  onToggleMobileMenu: () => void;
}

export function Header({ userProfile, onToggleMobileMenu }: HeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<'none' | 'notifications' | 'settings'>('none');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideDesktop = dropdownRef.current && dropdownRef.current.contains(target);
      const clickedInsideMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setOpenDropdown('none');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: 'notifications' | 'settings') => {
    setOpenDropdown(prev => prev === dropdown ? 'none' : dropdown);
  };

  const handleOpenLogoutModal = () => {
    setOpenDropdown('none');
    setIsLogoutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair do sistema:', error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
      {/* MOBILE TOP NAVIGATION */}
      <nav className="lg:hidden glass-sidebar relative z-40 border-b border-white/10 shrink-0">
        <div className="px-4">
          <div className="relative flex h-16 items-center justify-between">
            {/* Profile and Notifications (Mobile Left) */}
            <div className="flex items-center relative" ref={mobileDropdownRef}>
              <button 
                type="button" 
                onClick={() => toggleDropdown('notifications')}
                className="relative p-2 text-brand-100/50 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 rounded-full hover:bg-white/5"
              >
                <i className="ph ph-bell text-xl"></i>
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => toggleDropdown('settings')}
                className="relative flex rounded-full bg-ink-800 text-sm ml-1 overflow-hidden cursor-pointer active:scale-95 transition-all duration-200"
              >
                {userProfile.initials ? (
                  <div className="h-8 w-8 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-brand-100 font-semibold text-xs uppercase">
                    {userProfile.initials}
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse"></div>
                )}
              </button>

              {/* MOBILE NOTIFICATIONS POPOVER */}
              {openDropdown === 'notifications' && (
                <div className="absolute left-0 top-12 w-72 sm:w-80 bg-white border border-ink-100 shadow-premium rounded-2xl overflow-hidden animate-fade-in origin-top-left z-50 text-ink-900">
                  <div className="px-4 py-3 border-b border-ink-100/50 flex justify-between items-center bg-white/50">
                    <h3 className="font-semibold text-sm text-ink-900 font-heading">Notificações</h3>
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">1 Nova</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-ink-50/50 transition-colors cursor-pointer border-l-2 border-brand-500 relative">
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="ph ph-check-circle text-brand-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ink-900 leading-tight">Lote 1045 processado com sucesso</p>
                          <p className="text-[11px] text-ink-400 mt-0.5">Orizon aprovou 100% das guias hoje.</p>
                          <p className="text-[9px] text-ink-300 mt-1 font-medium">Há 10 minutos</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-ink-50/50 transition-colors cursor-pointer border-l-2 border-transparent relative opacity-70">
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="ph ph-warning-circle text-red-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ink-900 leading-tight">Atenção: Guias com erro</p>
                          <p className="text-[11px] text-ink-400 mt-0.5">O lote 1044 retornou com 3 guias em glosa.</p>
                          <p className="text-[9px] text-ink-300 mt-1 font-medium">Ontem às 14:30</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 border-t border-ink-100/50 bg-ink-50/50">
                    <button className="w-full py-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}

              {/* MOBILE SETTINGS POPOVER */}
              {openDropdown === 'settings' && (
                <div className="absolute left-0 top-12 w-60 bg-ink-900 border border-white/10 shadow-premium rounded-2xl overflow-hidden animate-fade-in origin-top-left z-50">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold font-heading text-white">{userProfile.name}</p>
                    <p className="text-[10px] font-medium text-brand-200/70 mt-0.5 uppercase tracking-wider">{userProfile.role}</p>
                  </div>
                  <div className="py-1.5">
                    <button className="w-full px-4 py-2 flex items-center gap-2.5 text-xs text-brand-100/70 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer">
                      <i className="ph ph-sliders-horizontal text-base"></i> Ajustes da Conta
                    </button>
                    <button className="w-full px-4 py-2 flex items-center gap-2.5 text-xs text-brand-100/70 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer">
                      <i className="ph ph-headset text-base"></i> Suporte Técnico
                    </button>
                  </div>
                  <div className="py-1.5 border-t border-white/10">
                    <button 
                      onClick={handleOpenLogoutModal}
                      className="w-full px-4 py-2 flex items-center gap-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left cursor-pointer"
                    >
                      <i className="ph ph-sign-out text-base"></i> Sair do sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Logo */}
            <div className="flex flex-1 items-center justify-center">
              <img src={logoElman} alt="Clínica Elman" className="h-8 w-auto object-contain" />
            </div>

            {/* Hamburger (Mobile Right) */}
            <div className="flex items-center">
              <button 
                type="button" 
                onClick={onToggleMobileMenu}
                className="group relative inline-flex items-center justify-center rounded-md p-2 text-brand-100/50 hover:bg-white/5 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-400 h-10 w-10 overflow-hidden cursor-pointer"
              >
                <i className="ph ph-list text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Header */}
      <header className="h-20 px-8 hidden lg:flex items-center justify-end bg-white/80 backdrop-blur-md z-30 sticky top-0 border-b border-ink-100/70 shrink-0">
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          
          {/* NOTIFICATIONS BUTTON */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('notifications')}
              className={`relative p-2.5 transition-all duration-200 cursor-pointer active:scale-95 rounded-full border ${
                openDropdown === 'notifications' 
                  ? 'bg-ink-50 border-ink-200 text-brand-700' 
                  : 'bg-white border-ink-100 text-ink-400 hover:text-brand-700'
              }`}
            >
              <i className="ph ph-bell text-lg"></i>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
            </button>

            {/* NOTIFICATIONS POPOVER */}
            {openDropdown === 'notifications' && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-ink-100 shadow-premium rounded-2xl overflow-hidden animate-fade-in origin-top-right z-50">
                <div className="px-5 py-4 border-b border-ink-100/50 flex justify-between items-center bg-white/50">
                  <h3 className="font-semibold text-ink-900 font-heading">Notificações</h3>
                  <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">1 Nova</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-5 py-4 hover:bg-ink-50/50 transition-colors cursor-pointer border-l-2 border-brand-500 relative">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="ph ph-check-circle text-brand-600"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900 leading-tight">Lote 1045 processado com sucesso</p>
                        <p className="text-xs text-ink-400 mt-1">Orizon aprovou 100% das guias enviadas hoje.</p>
                        <p className="text-[10px] text-ink-300 mt-2 font-medium">Há 10 minutos</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 hover:bg-ink-50/50 transition-colors cursor-pointer border-l-2 border-transparent relative opacity-70">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="ph ph-warning-circle text-red-600"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900 leading-tight">Atenção: Guias com erro</p>
                        <p className="text-xs text-ink-400 mt-1">O lote 1044 retornou com 3 guias em glosa.</p>
                        <p className="text-[10px] text-ink-300 mt-2 font-medium">Ontem às 14:30</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-ink-100/50 bg-ink-50/50">
                  <button className="w-full py-2 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer">
                    Ver todas as notificações
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SETTINGS / PROFILE BUTTON */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('settings')}
              className={`p-2.5 transition-all duration-200 cursor-pointer active:scale-95 rounded-full border ${
                openDropdown === 'settings' 
                  ? 'bg-ink-50 border-ink-200 text-brand-700' 
                  : 'bg-white border-ink-100 text-ink-400 hover:text-brand-700'
              }`}
            >
              <i className="ph ph-gear text-lg"></i>
            </button>

            {/* SETTINGS POPOVER */}
            {openDropdown === 'settings' && (
              <div className="absolute right-0 mt-3 w-56 bg-ink-900 border border-white/10 shadow-premium rounded-2xl overflow-hidden animate-fade-in origin-top-right z-50">
                <div className="px-4 py-4 border-b border-white/10">
                  <p className="text-sm font-semibold font-heading text-white">{userProfile.name}</p>
                  <p className="text-[10px] font-medium text-brand-200/70 mt-0.5 uppercase tracking-wider">{userProfile.role}</p>
                </div>
                <div className="py-2">
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-brand-100/70 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer">
                    <i className="ph ph-sliders-horizontal text-lg"></i> Ajustes da Conta
                  </button>
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-brand-100/70 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer">
                    <i className="ph ph-headset text-lg"></i> Suporte Técnico
                  </button>
                </div>
                <div className="py-2 border-t border-white/10">
                  <button 
                    onClick={handleOpenLogoutModal}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left cursor-pointer"
                  >
                    <i className="ph ph-sign-out text-lg"></i> Sair do sistema
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* CONFIRM LOGOUT MODAL */}
      <ConfirmLogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmSignOut}
        userName={userProfile.name}
        userRole={userProfile.role}
        userInitials={userProfile.initials}
        isLoading={isLoggingOut}
      />
    </>
  );
}
