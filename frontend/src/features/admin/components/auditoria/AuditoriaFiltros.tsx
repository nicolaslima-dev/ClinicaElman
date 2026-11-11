import React, { useState } from 'react';
import type { CodigoCriticaAuditoria, ResumoAuditoriaLote } from '@/features/admin/types';

interface AuditoriaFiltrosProps {
  busca?: string;
  setBusca?: (val: string) => void;
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
  totalGuias?: number;
  totalRetidas?: number;
  totalValidadas?: number;
  onLimparFiltros?: () => void;
}

export function AuditoriaFiltros({
  busca = '',
  setBusca,
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
  totalGuias = 0,
  totalRetidas = 0,
  totalValidadas = 0,
  onLimparFiltros,
}: AuditoriaFiltrosProps) {
  const [expandirFiltrosAvancados, setExpandirFiltrosAvancados] = useState(false);

  const formInputClass =
    'w-full h-10 border border-ink-200 bg-ink-50 rounded-xl px-3 text-xs font-medium text-ink-800 outline-none focus:bg-white focus:border-brand-400 transition-all';

  const temFiltroAtivo = Boolean(
    busca ||
    convenio ||
    numeroLote ||
    tipoCritica ||
    statusFiltro !== 'todos'
  );

  return (
    <div className="mb-5 sm:mb-6 bg-white p-3.5 sm:p-5 rounded-2xl shadow-card border border-ink-100 space-y-4">
      {/* Campo de Busca Rápida */}
      {setBusca && (
        <div className="relative w-full">
          <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 text-sm"></i>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por paciente, guia, senha ou código TUSS..."
            className="w-full h-10 pl-9 pr-9 bg-ink-50 border border-ink-200 rounded-xl text-xs font-medium text-ink-800 placeholder-ink-400 outline-none focus:bg-white focus:border-brand-400 transition-all"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-1 rounded-full cursor-pointer"
              title="Limpar busca"
            >
              <i className="ph ph-x text-xs"></i>
            </button>
          )}
        </div>
      )}

      {/* Opções de Status em formato VERTICAL (sem cortes, 100% visíveis em qualquer tela) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">
            Status da Auditoria
          </span>
          {temFiltroAtivo && onLimparFiltros && (
            <button
              type="button"
              onClick={onLimparFiltros}
              className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
              title="Limpar todos os filtros ativos"
            >
              <i className="ph ph-arrow-counter-clockwise text-xs"></i>
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-1.5 bg-ink-100/70 rounded-xl w-full">
          <button
            type="button"
            onClick={() => setStatusFiltro('todos')}
            className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
              statusFiltro === 'todos'
                ? 'bg-white text-ink-900 shadow-xs ring-1 ring-ink-200/60'
                : 'text-ink-600 hover:text-ink-900 hover:bg-white/40'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <i className="ph ph-list-dashes text-sm text-ink-500 shrink-0"></i>
              <span className="truncate">Todas as Guias</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ml-2 ${
                statusFiltro === 'todos'
                  ? 'bg-ink-100 text-ink-800'
                  : 'bg-ink-200/60 text-ink-600'
              }`}
            >
              {totalGuias}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFiltro('retidas')}
            className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
              statusFiltro === 'retidas'
                ? 'bg-white text-red-700 shadow-xs ring-1 ring-red-200'
                : 'text-ink-600 hover:text-red-700 hover:bg-white/40'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
              <span className="truncate">Guias Retidas</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ml-2 ${
                statusFiltro === 'retidas'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {totalRetidas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFiltro('validadas')}
            className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
              statusFiltro === 'validadas'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-200'
                : 'text-ink-600 hover:text-emerald-700 hover:bg-white/40'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
              <span className="truncate">Guias Validadas</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ml-2 ${
                statusFiltro === 'validadas'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {totalValidadas}
            </span>
          </button>
        </div>
      </div>

      {/* Botão de Alternar Filtros Secundários em Mobile */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setExpandirFiltrosAvancados(!expandirFiltrosAvancados)}
          className="w-full h-10 px-3.5 bg-ink-50 hover:bg-ink-100 border border-ink-200 text-ink-700 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <i className="ph ph-faders text-sm text-brand-600"></i>
            <span>{expandirFiltrosAvancados ? 'Ocultar Filtros de Lote e Convênio' : 'Filtrar Lote / Operadora'}</span>
          </div>
          <i className={`ph ${expandirFiltrosAvancados ? 'ph-caret-up' : 'ph-caret-down'} text-xs`}></i>
        </button>
      </div>

      {/* Grid de Filtros Avançados (Lote, Operadora, Regra Crítica) */}
      <div
        className={`${
          expandirFiltrosAvancados ? 'block' : 'hidden'
        } lg:block pt-3 border-t border-ink-100`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                Regra Crítica (1 a 4)
              </label>
              {tipoCritica && (
                <button
                  type="button"
                  onClick={() => setTipoCritica('')}
                  className="text-[10px] text-brand-700 hover:underline font-semibold cursor-pointer"
                >
                  Limpar regra
                </button>
              )}
            </div>
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
        </div>
      </div>
    </div>
  );
}
