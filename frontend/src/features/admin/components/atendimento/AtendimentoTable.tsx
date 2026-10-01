import React, { useState } from 'react';

export interface Atendimento {
  id: number;
  paciente: string;
  guia: string;
  horario: string;
  data: string;
  profissional: string;
  local: string;
  convenio: string;
  cobertura: string;
  status: string;
  statusFinanceiro: string;
}

interface AtendimentoTableProps {
  atendimentos: Atendimento[];
  onOpenHistorico: (item: Atendimento) => void;
  onOpenImpressao: (item: Atendimento) => void;
}

export function AtendimentoTable({ atendimentos, onOpenHistorico, onOpenImpressao }: AtendimentoTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalItems = atendimentos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = atendimentos.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'aguardando': return 'bg-yellow-100 text-yellow-800';
      case 'em_atendimento': return 'bg-blue-100 text-blue-800';
      case 'realizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aguardando': return 'Aguardando';
      case 'em_atendimento': return 'Em Atendimento';
      case 'realizado': return 'Realizado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 flex flex-col">
      {/* Table Toolbar (Filters) */}
      <div className="p-5 border-b border-ink-100 flex flex-wrap gap-4 items-center justify-between bg-ink-50/30 rounded-t-[20px]">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"></i>
            <input type="text" className="filter-input w-full !pl-10" placeholder="Buscar paciente ou guia..." />
          </div>
          <input type="date" className="filter-input text-ink-600" defaultValue="2026-09-01" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="filter-input text-ink-600 appearance-none pr-8">
            <option value="">Todos os Status</option>
            <option value="aguardando">Aguardando</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select className="filter-input text-ink-600 appearance-none pr-8">
            <option value="">Todos Profissionais</option>
            <option value="Dr. Carlos Mendes">Dr. Carlos Mendes</option>
            <option value="Dra. Luciana Silva">Dra. Luciana Silva</option>
            <option value="Dr. Roberto Almeida">Dr. Roberto Almeida</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-600">
          <thead>
            <tr className="bg-white border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
              <th className="py-4 px-6 font-medium">Paciente / Guia</th>
              <th className="py-4 px-6 font-medium">Horário</th>
              <th className="py-4 px-6 font-medium">Profissional / Local</th>
              <th className="py-4 px-6 font-medium">Convênio & Cobertura</th>
              <th className="py-4 px-6 font-medium">Status Operacional</th>
              <th className="py-4 px-6 font-medium">Status Financeiro</th>
              <th className="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-ink-50/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold font-heading text-xs">
                      {item.paciente.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">{item.paciente}</p>
                      <p className="text-xs text-ink-400">Guia: {item.guia}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <p className="font-medium text-ink-800">{item.horario}</p>
                  <p className="text-xs text-ink-400">{item.data}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-medium text-ink-800">{item.profissional}</p>
                  <p className="text-xs text-ink-400">{item.local}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-medium text-ink-800">{item.convenio}</p>
                  <p className="text-xs text-ink-400">{item.cobertura}</p>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusClass(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs font-medium text-ink-500 bg-ink-100 px-2 py-1 rounded">
                    {item.statusFinanceiro}
                  </span>
                </td>
                <td className="py-4 px-6 text-right relative">
                  <div className="flex items-center justify-end gap-2 opacity-100">
                    <button
                      onClick={() => onOpenHistorico(item)}
                      className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                      title="Histórico Clínico"
                    >
                      <i className="ph ph-clock-counter-clockwise text-lg"></i>
                    </button>
                    <button
                      onClick={() => onOpenImpressao(item)}
                      className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                      title="Imprimir Guia"
                    >
                      <i className="ph ph-printer text-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-5 border-t border-ink-100 flex items-center justify-between text-sm">
        <p className="text-ink-500">
          Mostrando <span className="font-medium text-ink-900">{totalItems === 0 ? 0 : startIndex + 1}</span> a <span className="font-medium text-ink-900">{endIndex}</span> de <span className="font-medium text-ink-900">{totalItems}</span> atendimentos
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ph ph-caret-left"></i>
          </button>
          
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-medium text-sm border border-brand-100">
            {currentPage}
          </span>
          
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ph ph-caret-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
