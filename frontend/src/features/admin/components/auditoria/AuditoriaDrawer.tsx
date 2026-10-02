import React from 'react';
import { createPortal } from 'react-dom';
import type { AuditoriaGuia } from '@/features/admin/types';

interface AuditoriaDrawerProps {
  isOpen: boolean;
  guia: AuditoriaGuia | null;
  onClose: () => void;
  onSalvar: () => void;
}

export function AuditoriaDrawer({ isOpen, guia, onClose, onSalvar }: AuditoriaDrawerProps) {
  return createPortal(
    <>
      <div id="drawerOverlay" onClick={onClose} className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

      <div id="drawerPanel" className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-400 ease-out z-[60] flex flex-col border-l border-slate-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-800">Resolução de Glosa</h2>
            <p className="text-xs text-brand-600 font-semibold mt-1 flex items-center gap-1"><i className="ph ph-shield-check"></i> Validação TISS 4.03.00</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto" id="drawerContent">
          {guia && (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <h4 className="text-sm font-bold text-red-900 mb-1">Motivo da Rejeição (Regra Orizon)</h4>
                <p className="text-sm text-red-700">{guia.erro}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Paciente</label>
                <input type="text" readOnly value={guia.paciente} className="w-full bg-slate-100 border-none rounded-xl p-3 text-sm text-slate-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Ação Corretiva</label>
                <textarea rows={4} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 transition-shadow resize-none" placeholder="Descreva ou ajuste os dados necessários para liberação..."></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">Cancelar</button>
          <button onClick={onSalvar} className="px-5 py-2.5 bg-brand-600 rounded-xl text-sm font-semibold text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
            <i className="ph ph-floppy-disk text-lg"></i>
            Validar e Salvar
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
