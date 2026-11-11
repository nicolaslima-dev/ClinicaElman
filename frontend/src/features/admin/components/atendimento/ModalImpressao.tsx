import React from 'react';
import { createPortal } from 'react-dom';

interface ModalImpressaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (metodo: string, tipo: string) => void;
}

export function ModalImpressao({ isOpen, onClose, onConfirm }: ModalImpressaoProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    const metodo = (document.querySelector('input[name="metodoAssinatura"]:checked') as HTMLInputElement)?.value;
    const tipo = (document.getElementById('tipoGuiaPrint') as HTMLSelectElement)?.value;
    onConfirm(metodo, tipo);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-lg border border-ink-100 flex flex-col max-h-[92dvh] z-10 fade-in">
        {/* Header com botão fechar */}
        <div className="bg-white px-4 sm:px-6 py-4 sm:py-5 border-b border-ink-100 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <i className="ph ph-printer text-xl"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg leading-6 font-semibold font-heading text-ink-900">
                Imprimir Guia ANS
              </h3>
              <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5">
                Formato da guia e assinatura do paciente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-ink-400 hover:text-ink-700 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors shrink-0 cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body rolável */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs sm:text-sm text-ink-500">
            Selecione o formato da guia e o método de assinatura do paciente.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="tipoGuiaPrint" className="block text-xs sm:text-sm font-semibold text-ink-700 mb-1.5">
                Tipo de Guia
              </label>
              <select
                id="tipoGuiaPrint"
                className="w-full border border-ink-200 rounded-xl p-2.5 text-sm focus:border-brand-500 outline-none bg-white text-ink-800 cursor-pointer min-h-[44px]"
              >
                <option value="consulta">Guia de Consulta</option>
                <option value="sadt">Guia de SP/SADT</option>
              </select>
            </div>

            <div className="bg-ink-50/70 p-3.5 sm:p-4 rounded-xl border border-ink-100">
              <h4 className="text-xs sm:text-sm font-semibold text-ink-800 mb-3">
                Método de Assinatura
              </h4>

              <label className="flex items-start gap-3 mb-3 cursor-pointer group p-2 rounded-lg hover:bg-white/80 transition-colors">
                <input
                  type="radio"
                  name="metodoAssinatura"
                  value="digitalizadora"
                  className="mt-1 text-brand-600 focus:ring-brand-500 border-ink-300 cursor-pointer"
                  defaultChecked
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-ink-800 group-hover:text-brand-700 transition-colors">
                    Assinatura no Sistema (Mesa Digitalizadora / Touch)
                  </p>
                  <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5">
                    Abre uma tela para o paciente assinar digitalmente e já insere a assinatura na guia PDF.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/80 transition-colors">
                <input
                  type="radio"
                  name="metodoAssinatura"
                  value="digital"
                  className="mt-1 text-brand-600 focus:ring-brand-500 border-ink-300 cursor-pointer"
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-ink-800 group-hover:text-brand-700 transition-colors">
                    Assinatura Digital (Gov.br / Sistema)
                  </p>
                  <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5">
                    O paciente receberá um link para assinar digitalmente. A guia pode ser impressa sem assinatura.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer responsivo */}
        <div className="bg-ink-50 px-4 py-3.5 sm:px-6 sm:py-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-ink-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-full border border-ink-200 px-5 py-2.5 sm:py-2 bg-white text-xs sm:text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 rounded-full px-6 py-2.5 sm:py-2 bg-brand-600 text-xs sm:text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-soft cursor-pointer"
            onClick={handleConfirm}
          >
            <i className="ph ph-file-pdf text-base"></i>
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
