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
    <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
          <i className="ph ph-shield-check"></i>
          Motor de Conferência Pré-XML — Fase 4
        </span>
        <h1 className="text-[28px] font-bold font-heading text-ink-900 tracking-tight">
          Central de Auditoria e Crítica de Lotes TISS
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Retenção automática de guias com Datas Repetidas, Quantidade ≠ 1, Divergência de Terapeuta ou Valor fora da Tabela do Plano.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRestaurar}
          title="Restaurar Lote de Demonstração #904026 com as 4 falhas críticas para teste"
          className="h-10 px-4 bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <i className="ph ph-flask text-base text-brand-600"></i>
          Simular Lote c/ 4 Críticas
        </button>

        {onExecutarConferencia && (
          <button
            type="button"
            onClick={onExecutarConferencia}
            disabled={auditing}
            className="h-10 px-5 bg-ink-900 hover:bg-ink-800 text-white rounded-full text-xs font-semibold flex items-center gap-2 shadow-soft transition-all cursor-pointer"
          >
            <i
              className={`ph ph-magnifying-glass text-base text-brand-300 ${
                auditing ? 'animate-spin' : ''
              }`}
            ></i>
            {auditing ? 'Conferindo Lote...' : 'Rodar Conferência Pré-XML'}
          </button>
        )}

        <span
          className={`h-10 px-4 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${
            pendentesCount > 0
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <i
            className={
              pendentesCount > 0
                ? 'ph ph-warning-octagon-fill text-base text-red-600'
                : 'ph ph-check-circle-fill text-base text-emerald-600'
            }
          ></i>
          <span id="contador-erros-tela">
            {pendentesCount > 0
              ? `${pendentesCount} Crítica(s) Bloqueante(s)`
              : 'Lotes 100% Validados p/ XML'}
          </span>
        </span>
      </div>
    </div>
  );
}
