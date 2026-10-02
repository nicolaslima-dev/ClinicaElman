import React from 'react';
import type { AuditoriaGuia } from '@/features/admin/types';

interface AuditoriaTableProps {
  guias: AuditoriaGuia[];
  onAbrirDrawer: (guia: AuditoriaGuia) => void;
}

export function AuditoriaTable({ guias, onAbrirDrawer }: AuditoriaTableProps) {
  return (
    <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex-1 flex flex-col">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
            <th className="p-5 font-semibold">Data</th>
            <th className="p-5 font-semibold">Paciente</th>
            <th className="p-5 font-semibold">Convênio</th>
            <th className="p-5 font-semibold">Status Auditoria</th>
            <th className="p-5 font-semibold text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100" id="tbodyAuditoria">
          {guias.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400">
                <p>Nenhum registro encontrado para este filtro.</p>
              </td>
            </tr>
          ) : (
            guias.map((guia) => (
              <tr key={guia.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5">{new Date(guia.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="p-5 font-medium text-slate-900">{guia.paciente}</td>
                <td className="p-5">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold">{guia.convenio}</span>
                </td>
                <td className="p-5">
                  {guia.status === 'pendente' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Pendente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Validado
                    </span>
                  )}
                </td>
                <td className="p-5 text-right">
                  {guia.status === 'pendente' ? (
                    <button onClick={() => onAbrirDrawer(guia)} className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                      Corrigir Erro
                    </button>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium px-3 py-1.5">Liberado</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
