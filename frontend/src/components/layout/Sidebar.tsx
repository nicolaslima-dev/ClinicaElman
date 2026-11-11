import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import logoElman from '@/assets/images/logos/logo-elman.png';
import type { NavSection, UserProfileData } from './types';

interface SidebarProps {
  sections: NavSection[];
  userProfile: UserProfileData;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export function Sidebar({ sections, userProfile, isMobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const location = useLocation();

  const isRouteActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  let runningLinkIndex = 0;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="w-72 hidden lg:flex flex-col text-white transition-all duration-300 z-40 relative shadow-2xl shrink-0 glass-sidebar">
        <div className="h-24 flex items-center px-7 border-b border-white/10 relative">
          <img src={logoElman} alt="Clínica Elman" className="h-14 w-auto max-w-[200px] object-contain relative z-10" />
        </div>
        <div className="px-7 py-6 border-b border-white/10 flex items-center gap-4">
          {userProfile.initials ? (
            <div className="h-11 w-11 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-brand-100 font-semibold text-sm uppercase shrink-0">
              {userProfile.initials}
            </div>
          ) : (
            <div className="h-11 w-11 rounded-full bg-white/10 animate-pulse shrink-0"></div>
          )}
          <div className="flex-1 overflow-hidden">
            {userProfile.name ? (
              <p className="text-sm font-semibold font-heading text-white leading-tight truncate">{userProfile.name}</p>
            ) : (
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-1"></div>
            )}

            {userProfile.role ? (
              <p className="text-[10px] font-medium text-brand-200 mt-0.5">{userProfile.role}</p>
            ) : (
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse"></div>
            )}
          </div>
        </div>
        <nav className="flex-1 px-8 py-7 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {sections.map((section, idx) => (
            <div key={idx} className={idx > 0 ? "pt-7 mt-7 border-t border-white/10" : ""}>
              <p className="text-[11px] font-medium text-brand-200/40 tracking-wide mb-4 uppercase">{section.title}</p>
              <div className="space-y-1">
                {section.links.map(link => {
                  const active = isRouteActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative w-full flex items-center justify-between py-3 text-sm font-medium transition-colors duration-200 ${active ? "text-white" : "text-brand-100/50 hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {active && (
                          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-gold-400 rounded-sm"></div>
                        )}
                        <i className={`ph ${link.icon} text-lg`}></i> {link.label}
                      </div>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="bg-gold-500 text-ink-900 text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* MOBILE MENU DROPDOWN & OVERLAY COM TRANSIÇÃO SUAVE */}
      <div
        className={`lg:hidden fixed inset-0 top-16 z-50 transition-all duration-300 ease-in-out ${isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
          }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop escurecido com clique para fechar */}
        <div
          className={`absolute inset-0 bg-ink-950/65 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={onCloseMobileMenu}
        />

        {/* Painel do menu com descida suave */}
        <div
          className={`relative w-full max-h-[calc(100vh-4rem)] overflow-y-auto bg-ink-900/98 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 ease-out transform ${isMobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-4 opacity-0'
            }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Card do Usuário no topo do Menu Mobile */}
          <div className="px-4 pt-3.5 pb-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
              {userProfile.initials ? (
                <div className="h-9 w-9 rounded-full bg-ink-800 border border-white/15 flex items-center justify-center text-brand-100 font-semibold text-xs uppercase shrink-0">
                  {userProfile.initials}
                </div>
              ) : (
                <div className="h-9 w-9 rounded-full bg-white/10 animate-pulse shrink-0"></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate font-heading">{userProfile.name || 'Usuário'}</p>
                <p className="text-[10px] text-brand-200/70 uppercase tracking-wider">{userProfile.role || 'Colaborador'}</p>
              </div>
            </div>
          </div>

          {/* Seções de Links com Animação em Cascata (Descida Suave) */}
          <nav className="px-4 py-3 space-y-4">
            {sections.map((section, sectionIdx) => {
              const sectionDelay = isMobileMenuOpen ? `${sectionIdx * 70 + 40}ms` : '0ms';

              return (
                <div
                  key={sectionIdx}
                  className={sectionIdx > 0 ? "pt-3.5 border-t border-white/10" : ""}
                >
                  <p
                    style={{ transitionDelay: sectionDelay }}
                    className={`text-[11px] font-semibold text-brand-200/40 tracking-wider mb-2 px-3 uppercase transition-all duration-300 ease-out transform ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                      }`}
                  >
                    {section.title}
                  </p>

                  <div className="space-y-1">
                    {section.links.map((link) => {
                      const active = isRouteActive(link.path);
                      const currentLinkIndex = runningLinkIndex++;
                      const linkDelay = isMobileMenuOpen ? `${currentLinkIndex * 35 + 70}ms` : '0ms';

                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={onCloseMobileMenu}
                          style={{
                            transitionDelay: linkDelay,
                          }}
                          className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out transform ${isMobileMenuOpen
                              ? 'translate-y-0 opacity-100'
                              : '-translate-y-3.5 opacity-0'
                            } ${active
                              ? "bg-brand-600/30 text-white border border-brand-400/30 font-semibold shadow-sm"
                              : "text-brand-100/65 hover:text-white hover:bg-white/[0.06] border border-transparent"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {active && (
                              <span className="w-1.5 h-4 bg-gold-400 rounded-full shrink-0"></span>
                            )}
                            <i className={`ph ${link.icon} text-lg ${active ? 'text-gold-400' : 'text-brand-200/70'}`}></i>
                            <span>{link.label}</span>
                          </div>
                          {link.badge !== undefined && link.badge > 0 && (
                            <span className="bg-gold-500 text-ink-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
