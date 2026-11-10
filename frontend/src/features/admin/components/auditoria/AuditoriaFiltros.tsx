import React from 'react';
import type { CodigoCriticaAuditoria, ResumoAuditoriaLote } from '@/features/admin/types';

interface AuditoriaFiltrosProps {
  convenio: string;
  setConvenio: (val: string) => void;
  numeroLote: string;
  setNumeroLote: (val: string) => void;
  tipoCritica: CodigoCriticaAuditoria | '';
  setTipoCritica: (val: CodigoCriticaAuditoria | '') => void;
  statusFiltro: 'todos' | 'retidas' | 'validadas';
  setStatusFiltro: (val: 'todos' | 'retidas' | 'validadas') => void;
  resumosLotes: ResumoAuditoriaLote[];
  operadorasNomes: string[];
}

export function AuditoriaFiltros({
  convenio,
  setConvenio,
  numeroLote,
  setNumeroLote,
  tipoCritica,
  setTipoCritica,
  statusFiltro,
  setStatusFiltro,
  resumosLotes,
  operadorasNomes,
}: AuditoriaFiltrosProps) {
  const formInputClass =
    'w-full h-10 border border-ink-200 bg-ink-50 rounded-xl px-3.5 text-xs font-medium text-ink-800 outline-none focus:bg-white focus:border-brand-400 transition-all';

  return (
    <div className="mb-6 bg-white p-5 rounded-2xl shadow-card border border-ink-100 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-ink-500 mb-1.5 uppercase tracking-wider">
            Lote em Conferência
          </label>
          <select
            value={numeroLote}
            onChange={(e) => setNumeroLote(e.target.value)}
            className={formInputClass}
          >
            <option value="">Todos os Lotes Digitados</option>
            {resumosLotes.map((l) => (
              <option key={l.loteId} value={l.numeroLote}>
                Lote #{l.numeroLote} — {l.operadoraNome} ({l.guiasRetidas > 0 ? `${l.guiasRetidas} retida(s)` : 'Apto XML'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink-500 mb-1.5 uppercase tracking-wider">
            Operadora / Convênio
          </label>
          <select
            id="filtroAuditoriaConvenio"
            className={formInputClass}
            value={convenio}
            onChange={(e) => setConvenio(e.target.value)}
          >
            <option value="">Todas as Operadoras</option>
            {operadorasNomes.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink-500 mb-1.5 uppercase tracking-wider">
            Filtrar por Regra Crítica (1 a 4)
          </label>
          <select
            value={tipoCritica}
            onChange={(e) =>
              setTipoCritica(e.target.value as CodigoCriticaAuditoria | '')
            }
            className={formInputClass}
          >
            <option value="">Todas as 4 Críticas TISS</option>
            <option value="CRIT_DATA_REPETIDA">
              ❌ Crítica 1: Datas Repetidas
            </option>
            <option value="CRIT_QTD_DIFERENTE_1">
              ❌ Crítica 2: Quantidade ≠ 1
            </option>
            <option value="CRIT_TERAPEUTA_DIVERGENTE">
              ❌ Crítica 3: Divergência de Terapeuta
            </option>
            <option value="CRIT_VALOR_TABELA_PLANO">
              ❌ Crítica 4: Divergência de Valor (Tabela Plano)
            </option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink-500 mb-1.5 uppercase tracking-wider">
            Status na Auditoria
          </label>
          <select
            value={statusFiltro}
            onChange={(e) =>
              setStatusFiltro(
                e.target.value as 'todos' | 'retidas' | 'validadas'
              )
            }
            className={formInputClass}
          >
            <option value="todos">Todas as Guias do Lote</option>
            <option value="retidas">Somente Guias Retidas (Com Glosa Prévia)</option>
            <option value="validadas">Somente Guias Validadas (Aptas p/ XML)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
