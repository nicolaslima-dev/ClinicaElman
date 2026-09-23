import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { NavSection, UserProfileData } from './types';

interface BaseLayoutProps {
  sections: NavSection[];
  userProfile: UserProfileData;
  children: React.ReactNode;
}

export function BaseLayout({ sections, userProfile, children }: BaseLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#f5f6f5] w-full">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        sections={sections} 
        userProfile={userProfile} 
        isMobileMenuOpen={isMobileMenuOpen} 
        onCloseMobileMenu={closeMobileMenu} 
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full text-ink-800">
        <Header 
          userProfile={userProfile} 
          onToggleMobileMenu={toggleMobileMenu} 
        />
        
        {/* VIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 w-full" id="views-container">
          {children}
        </div>
      </main>
    </div>
  );
}
