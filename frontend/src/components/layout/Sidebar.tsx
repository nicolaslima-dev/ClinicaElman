import React, { useState } from 'react';
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
                      className={`relative w-full flex items-center justify-between py-3 text-sm font-medium transition-colors duration-200 ${
                        active ? "text-white" : "text-brand-100/50 hover:text-white"
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

      {/* MOBILE MENU DROPDOWN (Rendered conditionally via the wrapper BaseLayout) */}
      {isMobileMenuOpen && (
        <div className="block lg:hidden absolute top-16 left-0 w-full z-50 animate-fade-in origin-top">
           <div className="space-y-1 px-4 pt-2 pb-4 bg-ink-900/95 backdrop-blur-md border-t border-white/10 shadow-premium">
            {sections.map((section, idx) => (
              <div key={idx} className={idx > 0 ? "mt-4 pt-4 border-t border-white/10" : ""}>
                 {idx > 0 && <p className="text-[11px] font-medium text-brand-200/40 tracking-wide mb-2 px-3 uppercase">{section.title}</p>}
                 {section.links.map(link => {
                   const active = isRouteActive(link.path);
                   return (
                     <Link
                       key={link.path}
                       to={link.path}
                       onClick={onCloseMobileMenu}
                       className={`block rounded-md px-3 py-2.5 text-base font-medium transition-all flex justify-between items-center ${
                         active ? "bg-white/10 text-white" : "text-brand-100/50 hover:bg-white/5 hover:text-white"
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <i className={`ph ${link.icon} text-lg`}></i> {link.label}
                       </div>
                       {link.badge !== undefined && link.badge > 0 && (
                         <span className="bg-gold-500 text-ink-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                           {link.badge}
                         </span>
                       )}
                     </Link>
                   )
                 })}
              </div>
            ))}
           </div>
        </div>
      )}
    </>
  );
}
