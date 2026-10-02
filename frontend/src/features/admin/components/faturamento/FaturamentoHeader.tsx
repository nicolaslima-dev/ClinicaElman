import React from 'react';
import { Link } from 'react-router-dom';

interface FaturamentoHeaderProps {
  onGerarLote: () => void;
  onImprimir: () => void;
}

export function FaturamentoHeader({ onGerarLote, onImprimir }: FaturamentoHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-8 print:hidden">
      <div>

        <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">Faturamento e Relatórios TISS</h1>
        <p className="text-sm text-ink-400 mt-2">Filtre guias para processamento de Remessa ou Geração de XML</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onImprimir} className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-600 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center gap-2">
          <i className="ph ph-printer text-lg"></i> Imprimir Relatório
        </button>
        <button onClick={onGerarLote} className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-soft">
          <i className="ph ph-file-code text-lg text-brand-300"></i> Gerar Lote XML
        </button>
      </div>
    </div>
  );
}
