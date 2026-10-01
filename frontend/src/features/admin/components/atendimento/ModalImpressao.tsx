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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-lg border border-ink-100 z-10">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-50 sm:mx-0 sm:h-10 sm:w-10 text-brand-600">
              <i className="ph ph-printer text-xl"></i>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-semibold font-heading text-ink-900">
                Imprimir Guia ANS
              </h3>
              <div className="mt-2">
                <p className="text-sm text-ink-500 mb-4">Selecione o formato da guia e o método de assinatura do paciente.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Tipo de Guia</label>
                    <select id="tipoGuiaPrint" className="w-full border border-ink-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white text-ink-700">
                      <option value="consulta">Guia de Consulta</option>
                      <option value="sadt">Guia de SP/SADT</option>
                    </select>
                  </div>

                  <div className="bg-ink-50 p-4 rounded-xl border border-ink-100">
                    <h4 className="text-sm font-semibold text-ink-800 mb-3">Método de Assinatura</h4>

                    <label className="flex items-start gap-3 mb-3 cursor-pointer group">
                      <input type="radio" name="metodoAssinatura" value="digitalizadora" className="mt-1 text-brand-600 focus:ring-brand-500 border-ink-300" defaultChecked />
                      <div>
                        <p className="text-sm font-medium text-ink-800 group-hover:text-brand-700 transition-colors">Assinatura no Sistema (Mesa Digitalizadora)</p>
                        <p className="text-xs text-ink-500">Abre uma tela para o paciente assinar digitalmente e já insere a assinatura na guia PDF.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name="metodoAssinatura" value="digital" className="mt-1 text-brand-600 focus:ring-brand-500 border-ink-300" />
                      <div>
                        <p className="text-sm font-medium text-ink-800 group-hover:text-brand-700 transition-colors">Assinatura Digital (Gov.br / Sistema)</p>
                        <p className="text-xs text-ink-500">O paciente receberá um link para assinar digitalmente. A guia pode ser impressa sem assinatura.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-ink-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-ink-100">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            onClick={handleConfirm}
          >
            Gerar PDF
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-ink-200 shadow-sm px-4 py-2 bg-white text-base font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
