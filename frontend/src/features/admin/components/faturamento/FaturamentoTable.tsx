import React from 'react';
import type { GuiaFaturamento } from '@/features/admin/types';

interface FaturamentoTableProps {
  loading: boolean;
  guias: GuiaFaturamento[];
  selectedIds: Set<string>;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectOne: (id: string) => void;
  valorTotalLote: number;
}

export function FaturamentoTable({
  loading,
  guias,
  selectedIds,
  handleSelectAll,
  handleSelectOne,
  valorTotalLote
}: FaturamentoTableProps) {
  return (
    <div className="bg-white rounded-[20px] shadow-card flex-1 overflow-hidden flex flex-col">
      <div className="bg-white p-5 border-b border-ink-100 flex justify-between items-center">
        <span className="text-base font-semibold font-heading text-ink-900">
          Resultado da Filtragem 
          <span id="resultado-filtragem-badge" className="text-[11px] font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full ml-2">
            {guias.length} registro{guias.length !== 1 && 's'}
          </span>
        </span>
        <span className="text-xs font-medium text-ink-500 bg-ink-50 px-3 py-1.5 border border-ink-100 rounded-lg">Lote Num: <strong className="text-ink-900">302026</strong></span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-600">
          <thead>
            <tr className="bg-ink-50/50 border-b border-ink-100 text-xs font-semibold text-ink-400 uppercase tracking-wider">
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  id="selectAllGuias"
                  checked={selectedIds.size === guias.length && guias.length > 0} 
                  onChange={handleSelectAll}
                  className="rounded border-ink-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" 
                />
              </th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium">Paciente</th>
              <th className="p-4 font-medium">Convênio</th>
              <th className="p-4 font-medium">Matrícula</th>
              <th className="p-4 font-medium">Status Auditoria</th>
              <th className="p-4 font-medium text-right">Vlr. Total</th>
            </tr>
          </thead>
          <tbody id="tbodyFaturamento" className="divide-y divide-ink-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-400">
                  <i className="ph ph-spinner animate-spin text-2xl mb-2"></i>
                  <p>Carregando guias aprovadas...</p>
                </td>
              </tr>
            ) : guias.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-400">
                  <p>Nenhuma guia encontrada para este filtro.</p>
                </td>
              </tr>
            ) : (
              guias.map(guia => (
                <tr key={guia.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="guia-checkbox rounded border-ink-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" 
                      checked={selectedIds.has(guia.id)}
                      onChange={() => handleSelectOne(guia.id)}
                    />
                  </td>
                  <td className="p-4">{new Date(guia.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td className="p-4 font-medium text-ink-900">{guia.paciente}</td>
                  <td className="p-4">{guia.convenio}</td>
                  <td className="p-4 font-mono">{guia.matricula}</td>
                  <td className="p-4">
                    {guia.statusAuditoria === 'validado' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Validado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-700 border border-gold-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span> Pendente
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right font-medium text-ink-900">
                    R$ {guia.valorTotal.toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Resumo Contábil do Lote */}
      <div className="bg-brand-50/50 border-t border-ink-100 p-5 flex justify-between items-center mt-auto">
        <div className="text-sm text-ink-500 font-medium">
          Total de guias selecionadas: <strong id="totalGuiasSelecionadas" className="text-ink-900 font-bold">{selectedIds.size}</strong>
        </div>
        <div className="text-sm text-ink-500 font-medium">
          Valor Total Consolidado do Lote: <strong id="valorTotalLote" className="text-[20px] font-heading font-bold text-brand-700 ml-2">R$ {valorTotalLote.toFixed(2).replace('.', ',')}</strong>
        </div>
      </div>
    </div>
  );
}
