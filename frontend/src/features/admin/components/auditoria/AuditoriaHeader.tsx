import React from 'react';

interface AuditoriaHeaderProps {
  pendentesCount: number;
  auditing?: boolean;
  onRestaurar: () => void;
  onExecutarConferencia?: () => void;
}

export function AuditoriaHeader({
  pendentesCount,
  auditing = false,
  onRestaurar,
  onExecutarConferencia,
}: AuditoriaHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-5 sm:mb-6">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
          <i className="ph ph-shield-check text-sm sm:text-base"></i>
          Motor de Conferência Pré-XML — Fase 4
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold font-heading text-ink-900 tracking-tight leading-tight">
          Central de Auditoria e Crítica de Lotes TISS
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1 max-w-3xl leading-relaxed">
          Retenção automática de guias com Datas Repetidas, Quantidade ≠ 1, Divergência de Terapeuta ou Valor fora da Tabela do Plano.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={onRestaurar}
          title="Restaurar Lote de Demonstração #904026 com as 4 falhas críticas para teste"
          className="h-10 px-3.5 sm:px-4 bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-xl sm:rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
        >
          <i className="ph ph-flask text-base text-brand-600"></i>
          <span>Simular Lote c/ 4 Críticas</span>
        </button>

        {onExecutarConferencia && (
          <button
            type="button"
            onClick={onExecutarConferencia}
            disabled={auditing}
            className="h-10 px-4 sm:px-5 bg-ink-900 hover:bg-ink-800 disabled:opacity-60 text-white rounded-xl sm:rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer w-full sm:w-auto"
          >
            <i
              className={`ph ph-magnifying-glass text-base text-brand-300 ${
                auditing ? 'animate-spin' : ''
              }`}
            ></i>
            <span>{auditing ? 'Conferindo Lote...' : 'Rodar Conferência'}</span>
          </button>
        )}

        <div
          className={`h-10 px-3.5 sm:px-4 rounded-xl sm:rounded-full text-xs font-bold flex items-center justify-center gap-2 border transition-all w-full sm:w-auto ${
            pendentesCount > 0
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <i
            className={
              pendentesCount > 0
                ? 'ph ph-warning-octagon-fill text-base text-red-600 shrink-0'
                : 'ph ph-check-circle-fill text-base text-emerald-600 shrink-0'
            }
          ></i>
          <span id="contador-erros-tela" className="truncate">
            {pendentesCount > 0
              ? `${pendentesCount} Crítica(s) Bloqueante(s)`
              : 'Lotes 100% Validados p/ XML'}
          </span>
        </div>
      </div>
    </div>
  );
}
