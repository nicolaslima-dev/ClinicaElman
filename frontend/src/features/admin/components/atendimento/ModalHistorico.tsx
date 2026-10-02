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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl border border-ink-100 flex flex-col max-h-[85vh] z-10">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-ink-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-bold text-ink-900 flex items-center gap-2">
              <i className="ph-fill ph-clock-counter-clockwise text-brand-600"></i> Histórico do Paciente
            </h3>
            <p className="text-sm text-ink-500 mt-1">{paciente?.paciente || 'Carregando...'}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors">
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 bg-ink-50/30">
          <div className="relative border-l-2 border-brand-100 ml-3">

            <div className="mb-8 ml-6 relative">
              <span className="absolute -left-[35px] flex items-center justify-center w-8 h-8 bg-brand-100 rounded-full ring-4 ring-white">
                <i className="ph ph-stethoscope text-brand-600 font-bold"></i>
              </span>
              <div className="bg-white p-4 rounded-xl border border-ink-100 shadow-sm hover:border-brand-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-ink-900 text-sm">Consulta Atual - {paciente?.profissional}</h4>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">Hoje</span>
                </div>
                <p className="text-sm text-ink-600 mb-2">Guia: {paciente?.guia} &bull; {paciente?.convenio}</p>
                <p className="text-xs text-ink-500 bg-ink-50 p-2 rounded border border-ink-100">
                  Status atual: <strong className="uppercase text-ink-700">{paciente?.status}</strong>
                </p>
              </div>
            </div>

            <div className="mb-8 ml-6 relative">
              <span className="absolute -left-[35px] flex items-center justify-center w-8 h-8 bg-ink-100 rounded-full ring-4 ring-white">
                <i className="ph ph-file-text text-ink-600 font-bold"></i>
              </span>
              <div className="bg-white p-4 rounded-xl border border-ink-100 shadow-sm opacity-80">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-ink-800 text-sm">Retorno - Dr. Carlos Mendes</h4>
                  <span className="text-xs font-medium text-ink-500">15/08/2026</span>
                </div>
                <p className="text-sm text-ink-600 mb-2">Guia: 99882 &bull; {paciente?.convenio}</p>
                <p className="text-xs text-ink-500 bg-ink-50 p-2 rounded border border-ink-100">
                  <i className="ph-fill ph-check-circle text-green-500"></i> Faturada e Paga
                </p>
              </div>
            </div>

            <div className="ml-6 relative">
              <span className="absolute -left-[35px] flex items-center justify-center w-8 h-8 bg-ink-100 rounded-full ring-4 ring-white">
                <i className="ph ph-first-aid text-ink-600 font-bold"></i>
              </span>
              <div className="bg-white p-4 rounded-xl border border-ink-100 shadow-sm opacity-80">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-ink-800 text-sm">Primeira Consulta - Dr. Roberto Almeida</h4>
                  <span className="text-xs font-medium text-ink-500">02/07/2026</span>
                </div>
                <p className="text-sm text-ink-600 mb-2">Guia: 11223 &bull; {paciente?.convenio}</p>
                <p className="text-xs text-ink-500 bg-ink-50 p-2 rounded border border-ink-100">
                  <i className="ph-fill ph-check-circle text-green-500"></i> Faturada e Paga
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-ink-100 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-ink-200 shadow-sm px-4 py-2 bg-white text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
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
