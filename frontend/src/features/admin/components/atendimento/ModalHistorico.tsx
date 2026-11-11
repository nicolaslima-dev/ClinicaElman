import React from 'react';
import { createPortal } from 'react-dom';
import type { Atendimento } from '@/features/admin/types';

interface ModalHistoricoProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Atendimento | null;
}

export function ModalHistorico({ isOpen, onClose, paciente }: ModalHistoricoProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl border border-ink-100 flex flex-col max-h-[92dvh] z-10 fade-in">
        {/* Header */}
        <div className="bg-white px-4 sm:px-6 py-4 sm:py-5 border-b border-ink-100 flex justify-between items-start sm:items-center gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg leading-6 font-bold text-ink-900 flex items-center gap-2">
              <i className="ph-fill ph-clock-counter-clockwise text-brand-600"></i> Histórico do Paciente
            </h3>
            <p className="text-xs sm:text-sm text-ink-500 mt-1 truncate">
              {paciente?.paciente || 'Carregando...'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-ink-400 hover:text-ink-600 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors shrink-0 cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 bg-ink-50/30">
          <div className="relative border-l-2 border-brand-100 ml-2.5 sm:ml-3">

            <div className="mb-6 sm:mb-8 ml-5 sm:ml-6 relative">
              <span className="absolute -left-[31px] sm:-left-[35px] flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-brand-100 rounded-full ring-4 ring-white">
                <i className="ph ph-stethoscope text-brand-600 font-bold text-xs sm:text-sm"></i>
              </span>
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-ink-100 shadow-sm hover:border-brand-200 transition-colors">
                <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                  <h4 className="font-bold text-ink-900 text-xs sm:text-sm">
                    Consulta Atual - {paciente?.profissional}
                  </h4>
                  <span className="text-[11px] sm:text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md">
                    Hoje
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-600 mb-2">
                  Guia: <strong className="font-mono">{paciente?.guia}</strong> &bull; {paciente?.convenio}
                </p>
                <p className="text-[11px] sm:text-xs text-ink-500 bg-ink-50 p-2 rounded-lg border border-ink-100">
                  Status atual: <strong className="uppercase text-ink-700">{paciente?.status}</strong>
                </p>
              </div>
            </div>

            <div className="mb-6 sm:mb-8 ml-5 sm:ml-6 relative">
              <span className="absolute -left-[31px] sm:-left-[35px] flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-ink-100 rounded-full ring-4 ring-white">
                <i className="ph ph-file-text text-ink-600 font-bold text-xs sm:text-sm"></i>
              </span>
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-ink-100 shadow-sm opacity-90">
                <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                  <h4 className="font-bold text-ink-800 text-xs sm:text-sm">
                    Retorno - Dr. Carlos Mendes
                  </h4>
                  <span className="text-[11px] sm:text-xs font-medium text-ink-500">
                    15/08/2026
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-600 mb-2">
                  Guia: <strong className="font-mono">99882</strong> &bull; {paciente?.convenio}
                </p>
                <p className="text-[11px] sm:text-xs text-ink-500 bg-ink-50 p-2 rounded-lg border border-ink-100 flex items-center gap-1.5">
                  <i className="ph-fill ph-check-circle text-emerald-600"></i>
                  <span>Faturada e Paga</span>
                </p>
              </div>
            </div>

            <div className="ml-5 sm:ml-6 relative">
              <span className="absolute -left-[31px] sm:-left-[35px] flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-ink-100 rounded-full ring-4 ring-white">
                <i className="ph ph-first-aid text-ink-600 font-bold text-xs sm:text-sm"></i>
              </span>
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-ink-100 shadow-sm opacity-90">
                <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                  <h4 className="font-bold text-ink-800 text-xs sm:text-sm">
                    Primeira Consulta - Dr. Roberto Almeida
                  </h4>
                  <span className="text-[11px] sm:text-xs font-medium text-ink-500">
                    02/07/2026
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-600 mb-2">
                  Guia: <strong className="font-mono">11223</strong> &bull; {paciente?.convenio}
                </p>
                <p className="text-[11px] sm:text-xs text-ink-500 bg-ink-50 p-2 rounded-lg border border-ink-100 flex items-center gap-1.5">
                  <i className="ph-fill ph-check-circle text-emerald-600"></i>
                  <span>Faturada e Paga</span>
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-4 sm:px-6 py-3.5 sm:py-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-ink-100 flex justify-end shrink-0">
          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-full border border-ink-200 px-5 py-2.5 sm:py-2 bg-white text-xs sm:text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors cursor-pointer"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
