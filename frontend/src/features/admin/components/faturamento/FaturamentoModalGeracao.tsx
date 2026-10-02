import React from 'react';

interface FaturamentoModalGeracaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function FaturamentoModalGeracao({ isOpen, onClose, onConfirm }: FaturamentoModalGeracaoProps) {
  return (
    <div id="modalConfirmacao" className={`fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div id="modalBox" className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-brand-50 p-3 rounded-full text-brand-600 flex-shrink-0">
              <i className="ph ph-file-code text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold font-heading text-ink-900">Geração de XML</h3>
          </div>
          <p className="text-sm text-ink-500 mb-6 leading-relaxed">Confirma a geração do arquivo XML (Padrão 4.03.00) para as guias selecionadas?</p>
          
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-600 bg-white border border-ink-200 hover:bg-ink-50 transition-colors">Cancelar</button>
            <button onClick={onConfirm} className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-soft">
              <i className="ph ph-check-circle text-lg text-brand-300"></i> Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
