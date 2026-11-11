import React, { useMemo, useState } from 'react';
import type {
  CodigoCriticaAuditoria,
  GuiaTissRecord,
} from '@/features/admin/types';
import { formatarDataBr } from '../../utils/pacienteValidators';

interface AuditoriaTableProps {
  guias: GuiaTissRecord[];
  valorTabelaPorGuia: Record<string, number | null>;
  onAbrirDrawer: (guia: GuiaTissRecord) => void;
}

const BADGE_CRITICA_STYLE: Record<
  CodigoCriticaAuditoria,
  { label: string; classes: string; icon: string }
> = {
  CRIT_DATA_REPETIDA: {
    label: 'Crítica 1: Datas Repetidas',
    classes: 'bg-red-50 text-red-700 border-red-200',
    icon: 'ph-calendar-x',
  },
  CRIT_QTD_DIFERENTE_1: {
    label: 'Crítica 2: Quantidade ≠ 1',
    classes: 'bg-red-50 text-red-700 border-red-200',
    icon: 'ph-hash',
  },
  CRIT_TERAPEUTA_DIVERGENTE: {
    label: 'Crítica 3: Terapeuta Divergente',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: 'ph-user-switch',
  },
  CRIT_VALOR_TABELA_PLANO: {
    label: 'Crítica 4: Valor ≠ Tabela Plano',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: 'ph-currency-circle-dollar',
  },
};

export function AuditoriaTable({
  guias,
  valorTabelaPorGuia,
  onAbrirDrawer,
}: AuditoriaTableProps) {
  // 'auto' usa cards no mobile (<lg) e tabela no desktop (>=lg)
  // O usuário pode forçar visualização por cards ou tabela se desejar
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // Métricas rápidas das guias exibidas
  const metricas = useMemo(() => {
    let retidas = 0;
    let validadas = 0;
    let valorTotal = 0;

    guias.forEach((g) => {
      const temCritica = (g.criticas_auditoria || []).length > 0;
      if (temCritica) retidas++;
      else validadas++;
      valorTotal += Number(g.valor_total_guia || 0);
    });

    return { retidas, validadas, valorTotal };
  }, [guias]);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden flex-1 flex flex-col">
      {/* Barra de Topo com Resumo e Alternador de Visualização */}
      <div className="p-3.5 sm:p-4 border-b border-ink-100 bg-ink-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-bold font-heading text-ink-900 flex items-center gap-1.5">
            <i className="ph ph-list-checks text-brand-600 text-base"></i>
            Guias Auditadas
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
            {guias.length} {guias.length === 1 ? 'guia' : 'guias'}
          </span>
          {metricas.retidas > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
              {metricas.retidas} retida{metricas.retidas !== 1 && 's'}
            </span>
          )}
          {metricas.validadas > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {metricas.validadas} validada{metricas.validadas !== 1 && 's'}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-[11px] sm:text-xs text-ink-500 font-medium">
            Total:{' '}
            <strong className="text-ink-900 font-mono font-bold">
              R$ {metricas.valorTotal.toFixed(2).replace('.', ',')}
            </strong>
          </div>

          {/* Toggle de Modo de Exibição */}
          <div className="flex items-center p-0.5 bg-ink-100 rounded-lg text-ink-600">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'cards' ? 'auto' : 'cards')}
              title="Exibir como Cards"
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'cards' || (viewMode === 'auto')
                  ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <i className="ph ph-squares-four text-sm"></i>
              <span className="hidden md:inline text-[11px]">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'table' ? 'auto' : 'table')}
              title="Exibir como Tabela"
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <i className="ph ph-table text-sm"></i>
              <span className="hidden md:inline text-[11px]">Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* ESTADO VAZIO */}
      {guias.length === 0 && (
        <div className="p-8 sm:p-12 text-center text-ink-400">
          <div className="w-14 h-14 rounded-2xl bg-ink-50 text-ink-300 flex items-center justify-center mx-auto mb-3">
            <i className="ph ph-shield-check text-3xl"></i>
          </div>
          <p className="text-sm font-bold text-ink-800">
            Nenhuma guia encontrada para os filtros selecionados.
          </p>
          <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto">
            Verifique os filtros de lote, convênio ou regras críticas ativos no painel acima.
          </p>
        </div>
      )}

      {/* VISUALIZAÇÃO EM CARDS (Mobile First & Responsivo) */}
      {guias.length > 0 && (
        <div
          className={`p-3.5 sm:p-5 ${
            viewMode === 'cards'
              ? 'block'
              : viewMode === 'table'
              ? 'hidden'
              : 'block lg:hidden'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {guias.map((guia) => {
              const criticas = guia.criticas_auditoria || [];
              const isRetida = criticas.length > 0;
              const sessoes = guia.sessoes || [];
              const vlrCobrado = Number(
                guia.valor_unitario_sessao ??
                  sessoes[0]?.valor_unitario ??
                  guia.autorizacao?.valor_unitario_sessao ??
                  0
              );
              const vlrTabela = valorTabelaPorGuia[guia.id];
              const terDesignado =
                guia.terapeuta_designado?.nome || 'Designado';
              const terExecutante =
                guia.terapeuta_executante?.nome || terDesignado;
              const terDivergente =
                guia.terapeuta_executante_id &&
                guia.terapeuta_designado_id &&
                guia.terapeuta_executante_id !== guia.terapeuta_designado_id;

              return (
                <div
                  key={guia.id}
                  className={`rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-xs ${
                    isRetida
                      ? 'bg-white border-red-200 hover:border-red-300 ring-1 ring-red-500/10'
                      : 'bg-white border-ink-100 hover:border-brand-200'
                  }`}
                >
                  {/* Topo do Card: Lote, Guia e Badge de Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {guia.numero_lote ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono font-bold text-[10px]">
                            Lote #{guia.numero_lote}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-ink-100 text-ink-500 font-mono text-[10px]">
                            Sem Lote
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-ink-500 break-words">
                          Senha: <strong className="text-ink-800">{guia.numero_senha}</strong>
                        </span>
                      </div>
                      <h3 className="font-mono font-bold text-sm text-ink-900 break-words leading-snug">
                        Guia #{guia.numero_guia_prestador}
                      </h3>
                    </div>

                    {isRetida ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 shrink-0">
                        <i className="ph ph-warning-octagon-fill text-xs text-red-600"></i>
                        Retida ({criticas.length})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        <i className="ph ph-check-circle-fill text-xs text-emerald-600"></i>
                        Validada p/ XML
                      </span>
                    )}
                  </div>

                  {/* Paciente & Convênio */}
                  <div className="p-3 rounded-xl bg-ink-50/70 border border-ink-100 space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">
                          Paciente
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-ink-200 text-ink-700 font-semibold text-[10px] shrink-0 shadow-2xs">
                          {guia.plano?.operadora?.nome || 'Convênio'} • TISS {guia.versao_tiss}
                        </span>
                      </div>
                      <p className="font-bold text-ink-900 text-sm leading-tight break-words">
                        {guia.paciente?.nome || 'Paciente não identificado'}
                      </p>
                    </div>

                    {/* Procedimento e Sessões */}
                    <div className="pt-2 border-t border-ink-200/60">
                      <div className="flex items-center gap-1.5 font-mono text-brand-700 font-bold text-xs">
                        <i className="ph ph-activity text-sm"></i>
                        <span>{guia.codigo_tuss}</span>
                      </div>
                      <p className="text-xs text-ink-700 font-medium mt-1 leading-snug break-words">
                        {guia.descricao_termo}
                      </p>
                      <p className="text-[10px] font-mono text-ink-500 mt-1 leading-normal break-words">
                        {sessoes.length} data(s):{' '}
                        {sessoes
                          .slice(0, 3)
                          .map((s) => `${formatarDataBr(s.data_realizacao)} (${s.quantidade}x)`)
                          .join(', ')}
                        {sessoes.length > 3 && '...'}
                      </p>
                    </div>

                    {/* Terapeuta */}
                    <div className="pt-2 border-t border-ink-200/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-400 text-[11px] shrink-0">Designado:</span>
                        <strong className="text-ink-900 text-[11px] text-right break-words">{terDesignado}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-400 text-[11px] shrink-0">Executante:</span>
                        <span
                          className={`text-[11px] font-semibold flex items-center justify-end gap-1.5 text-right ${
                            terDivergente ? 'text-red-700 font-bold' : 'text-emerald-700'
                          }`}
                        >
                          <span className="break-words">{terExecutante}</span>
                          {terDivergente && (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-bold uppercase tracking-wider shrink-0">
                              Divergente!
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between gap-2 flex-wrap font-mono">
                      <div className="text-[11px] break-words">
                        <span className="text-ink-400">Cobrado: </span>
                        <strong className="text-ink-900">
                          R$ {vlrCobrado.toFixed(2).replace('.', ',')}
                        </strong>
                        {vlrTabela !== null && vlrTabela !== undefined && (
                          <span
                            className={`ml-1.5 inline-block ${
                              Math.abs(vlrCobrado - vlrTabela) > 0.009
                                ? 'text-red-600 font-bold'
                                : 'text-ink-400'
                            }`}
                          >
                            (Tab: R$ {vlrTabela.toFixed(2).replace('.', ',')})
                          </span>
                        )}
                      </div>

                      <div className="text-brand-700 font-bold text-xs shrink-0">
                        Total: R${' '}
                        {Number(guia.valor_total_guia || 0)
                          .toFixed(2)
                          .replace('.', ',')}
                      </div>
                    </div>
                  </div>

                  {/* Bloco de Críticas Pré-XML Detectadas (se houver) */}
                  {isRetida ? (
                    <div className="p-2.5 rounded-xl bg-red-50/80 border border-red-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 flex items-center gap-1">
                        <i className="ph ph-warning-octagon text-xs text-red-600"></i>
                        Falhas que retêm o lote ({criticas.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {criticas.map((c) => {
                          const cfg = BADGE_CRITICA_STYLE[c.codigo_critica];
                          return (
                            <span
                              key={c.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.classes}`}
                            >
                              <i className={`ph ${cfg.icon} text-xs`}></i>
                              {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-2 text-emerald-800 text-[11px]">
                      <i className="ph ph-check-circle-fill text-emerald-600 text-sm shrink-0"></i>
                      <span>Pronta para gerar o XML TISS sem divergências.</span>
                    </div>
                  )}

                  {/* Botão de Ação Full Width com boa área de toque */}
                  <div className="pt-1">
                    {isRetida ? (
                      <button
                        type="button"
                        onClick={() => onAbrirDrawer(guia)}
                        className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <i className="ph ph-wrench text-base"></i>
                        <span>Corrigir Falhas da Guia ({criticas.length})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAbrirDrawer(guia)}
                        className="w-full h-10 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-700 border border-ink-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="ph ph-eye text-base"></i>
                        <span>Inspecionar Guia</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO EM TABELA (Para Desktop e telas maiores) */}
      {guias.length > 0 && (
        <div
          className={`overflow-x-auto ${
            viewMode === 'table'
              ? 'block'
              : viewMode === 'cards'
              ? 'hidden'
              : 'hidden lg:block'
          }`}
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ink-50/70 border-b border-ink-100 text-[11px] text-ink-400 uppercase tracking-wider">
                <th className="p-4 font-semibold">Lote / Nº Guia</th>
                <th className="p-4 font-semibold">Paciente & Convênio</th>
                <th className="p-4 font-semibold">Termo TUSS & Sessões</th>
                <th className="p-4 font-semibold">Conferência Terapeuta</th>
                <th className="p-4 font-semibold text-right">Valor Cobrado vs. Tabela</th>
                <th className="p-4 font-semibold">Críticas Pré-XML (1 a 4)</th>
                <th className="p-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100" id="tbodyAuditoria">
              {guias.map((guia) => {
                const criticas = guia.criticas_auditoria || [];
                const isRetida = criticas.length > 0;
                const sessoes = guia.sessoes || [];
                const vlrCobrado = Number(
                  guia.valor_unitario_sessao ??
                    sessoes[0]?.valor_unitario ??
                    guia.autorizacao?.valor_unitario_sessao ??
                    0
                );
                const vlrTabela = valorTabelaPorGuia[guia.id];
                const terDesignado =
                  guia.terapeuta_designado?.nome || 'Designado';
                const terExecutante =
                  guia.terapeuta_executante?.nome || terDesignado;
                const terDivergente =
                  guia.terapeuta_executante_id &&
                  guia.terapeuta_designado_id &&
                  guia.terapeuta_executante_id !== guia.terapeuta_designado_id;

                return (
                  <tr
                    key={guia.id}
                    className={`transition-colors ${
                      isRetida
                        ? 'bg-red-50/20 hover:bg-red-50/40'
                        : 'hover:bg-ink-50/50'
                    }`}
                  >
                    <td className="p-4">
                      {guia.numero_lote ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono font-bold text-[11px] mb-1">
                          Lote #{guia.numero_lote}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-ink-100 text-ink-500 font-mono text-[10px] mb-1">
                          Sem Lote
                        </span>
                      )}
                      <span className="block font-mono font-bold text-ink-900">
                        Guia #{guia.numero_guia_prestador}
                      </span>
                      <span className="block font-mono text-[11px] text-ink-400">
                        Senha: {guia.numero_senha}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-ink-900 block">
                        {guia.paciente?.nome || 'Paciente'}
                      </span>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-ink-100 text-ink-700 font-semibold text-[11px]">
                        {guia.plano?.operadora?.nome || 'Convênio'} • TISS{' '}
                        {guia.versao_tiss}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-brand-700">
                        {guia.codigo_tuss}
                      </span>
                      <span className="block text-[11px] text-ink-600 truncate max-w-[190px]">
                        {guia.descricao_termo}
                      </span>
                      <span className="block text-[11px] font-mono text-ink-400 mt-1">
                        {sessoes.length} data(s):{' '}
                        {sessoes
                          .slice(0, 3)
                          .map(
                            (s) =>
                              `${formatarDataBr(s.data_realizacao)} (${s.quantidade}x)`
                          )
                          .join(', ')}
                        {sessoes.length > 3 ? '...' : ''}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-ink-400 block">
                          Guia: <strong className="text-ink-700">{terDesignado}</strong>
                        </span>
                        <span
                          className={`text-[11px] block ${
                            terDivergente
                              ? 'text-red-700 font-bold'
                              : 'text-emerald-700 font-medium'
                          }`}
                        >
                          Exec.: {terExecutante}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono">
                      <span className="font-bold text-ink-900 block">
                        R$ {vlrCobrado.toFixed(2).replace('.', ',')} / sessão
                      </span>
                      {vlrTabela !== null && vlrTabela !== undefined && (
                        <span
                          className={`text-[11px] block ${
                            Math.abs(vlrCobrado - vlrTabela) > 0.009
                              ? 'text-red-600 font-bold'
                              : 'text-ink-400'
                          }`}
                        >
                          Tabela: R$ {vlrTabela.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="text-[11px] text-brand-700 font-bold block mt-0.5">
                        Total: R${' '}
                        {Number(guia.valor_total_guia || 0)
                          .toFixed(2)
                          .replace('.', ',')}
                      </span>
                    </td>

                    <td className="p-4">
                      {isRetida ? (
                        <div className="flex flex-col gap-1.5">
                          {criticas.map((c) => {
                            const cfg = BADGE_CRITICA_STYLE[c.codigo_critica];
                            return (
                              <span
                                key={c.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border w-max ${cfg.classes}`}
                              >
                                <i className={`ph ${cfg.icon} text-sm`}></i>
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <i className="ph ph-check-circle-fill text-emerald-600"></i>
                          Validado p/ XML
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {isRetida ? (
                        <button
                          type="button"
                          onClick={() => onAbrirDrawer(guia)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <i className="ph ph-wrench text-sm"></i>
                          Corrigir ({criticas.length})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAbrirDrawer(guia)}
                          className="text-ink-500 hover:text-ink-900 hover:bg-ink-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <i className="ph ph-eye text-sm"></i>
                          Inspecionar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
