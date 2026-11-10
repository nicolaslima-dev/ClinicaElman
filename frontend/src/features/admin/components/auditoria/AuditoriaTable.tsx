import React from 'react';
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
  return (
    <div className="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto">
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
            {guias.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-ink-400">
                  <i className="ph ph-shield-check text-3xl text-ink-300 block mb-2"></i>
                  <p className="text-sm font-semibold text-ink-700">
                    Nenhuma guia encontrada para os filtros selecionados.
                  </p>
                </td>
              </tr>
            ) : (
              guias.map((guia) => {
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
                const terDesignado = guia.terapeuta_designado?.nome || 'Designado';
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
                      isRetida ? 'bg-red-50/20 hover:bg-red-50/40' : 'hover:bg-ink-50/50'
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
                          .map((s) => `${formatarDataBr(s.data_realizacao)} (${s.quantidade}x)`)
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
