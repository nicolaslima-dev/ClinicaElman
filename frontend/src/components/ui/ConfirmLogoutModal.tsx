import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  isLoading?: boolean;
}

export function ConfirmLogoutModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userRole,
  userInitials,
  isLoading = false,
}: ConfirmLogoutModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape & handle body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus cancel button for safe keyboard accessibility
    setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      aria-describedby="logout-modal-description"
    >
      {/* BACKDROP */}
      <div 
        className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* MODAL CARD */}
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-ink-100 z-10 animate-fade-in transform transition-all text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Fechar modal"
          className="absolute top-5 right-5 p-2 rounded-full text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER ICON */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm shrink-0">
            <LogOut className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Aviso
            </div>
            <h3 id="logout-modal-title" className="text-xl font-bold font-heading text-ink-900 leading-snug">
              Deseja realmente sair?
            </h3>
          </div>
        </div>

        {/* BODY DESCRIPTION */}
        <p id="logout-modal-description" className="text-sm text-ink-500 leading-relaxed">
          Você será desconectado da sua conta na <strong className="font-semibold text-ink-700">Clínica Elman</strong>. Para acessar o sistema novamente, será necessário fazer login.
        </p>

        {/* USER PROFILE INFO PILL */}
        {userName && (
          <div className="mt-4 p-3.5 rounded-2xl bg-ink-50/80 border border-ink-100/90 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ink-800 border border-ink-700 text-brand-100 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
              {userInitials || userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-900 truncate">{userName}</p>
              {userRole && (
                <p className="text-[10px] text-brand-700 font-medium uppercase tracking-wider truncate mt-0.5">
                  {userRole}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="mt-7 flex items-center gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-ink-200 text-ink-700 hover:bg-ink-100/70 hover:border-ink-300 font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 text-center"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Sim, sair</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
