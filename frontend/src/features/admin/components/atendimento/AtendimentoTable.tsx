import React, { useMemo, useState } from 'react';
import type { Atendimento } from '@/features/admin/types';

interface AtendimentoTableProps {
  atendimentos: Atendimento[];
  onOpenHistorico: (item: Atendimento) => void;
  onOpenImpressao: (item: Atendimento) => void;
}

export function AtendimentoTable({ atendimentos, onOpenHistorico, onOpenImpressao }: AtendimentoTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtros funcionais
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroProfissional, setFiltroProfissional] = useState('');

  // Lista dinâmica de profissionais presentes nos dados
  const listaProfissionais = useMemo(() => {
    const nomes = Array.from(new Set(atendimentos.map(a => a.profissional).filter(Boolean)));
    return nomes;
  }, [atendimentos]);

  // Filtragem dos atendimentos
  const atendimentosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return atendimentos.filter(item => {
      // Filtro de texto (paciente, guia, convênio)
      if (q) {
        const matchNome = item.paciente.toLowerCase().includes(q);
        const matchGuia = item.guia.toLowerCase().includes(q);
        const matchConvenio = item.convenio.toLowerCase().includes(q);
        if (!matchNome && !matchGuia && !matchConvenio) return false;
      }

      // Filtro de data (se selecionada)
      if (filtroData) {
        // Converte DD/MM/YYYY para YYYY-MM-DD para comparação caso venha como DD/MM/YYYY
        let dataItemIso = item.data;
        if (item.data.includes('/')) {
          const [d, m, y] = item.data.split('/');
          dataItemIso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (dataItemIso !== filtroData) return false;
      }

      // Filtro de status
      if (filtroStatus && item.status !== filtroStatus) {
        return false;
      }

      // Filtro de profissional
      if (filtroProfissional && item.profissional !== filtroProfissional) {
        return false;
      }

      return true;
    });
  }, [atendimentos, busca, filtroData, filtroStatus, filtroProfissional]);

  const totalItems = atendimentosFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = atendimentosFiltrados.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando':
        return {
          classe: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Aguardando',
        };
      case 'em_atendimento':
        return {
          classe: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Em Atendimento',
        };
      case 'realizado':
        return {
          classe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Realizado',
        };
      case 'cancelado':
        return {
          classe: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          label: 'Cancelado',
        };
      default:
        return {
          classe: 'bg-ink-100 text-ink-700 border-ink-200',
          dot: 'bg-ink-400',
          label: status,
        };
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 flex flex-col">
      {/* Table Toolbar (Filters Responsivos) */}
      <div className="p-3.5 sm:p-5 border-b border-ink-100 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between bg-ink-50/30 rounded-t-[20px]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1">
          {/* Busca por paciente ou guia com botão limpar */}
          <div className="relative w-full sm:flex-1 lg:max-w-xs">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
            <input
              type="text"
              value={busca}
              onChange={e => {
                setBusca(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input w-full !pl-10 !pr-8"
              placeholder="Buscar paciente ou guia..."
            />
            {busca && (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setCurrentPage(1);
                }}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-1 cursor-pointer"
              >
                <i className="ph ph-x text-xs"></i>
              </button>
            )}
          </div>

          {/* Filtro de Data */}
          <div className="w-full sm:w-auto">
            <input
              type="date"
              value={filtroData}
              onChange={e => {
                setFiltroData(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input text-ink-600 w-full sm:w-auto"
              title="Filtrar por data"
            />
          </div>
        </div>

        {/* Selects de Status e Profissional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full lg:w-auto">
          <select
            value={filtroStatus}
            onChange={e => {
              setFiltroStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-input text-ink-600 pr-8 w-full"
          >
            <option value="">Todos os Status</option>
            <option value="aguardando">Aguardando</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={filtroProfissional}
            onChange={e => {
              setFiltroProfissional(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-input text-ink-600 pr-8 w-full"
          >
            <option value="">Todos Profissionais</option>
            {listaProfissionais.map(nome => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VISUALIZAÇÃO MOBILE & TABLET (Cards Responsivos < lg) */}
      <div className="lg:hidden p-3.5 sm:p-5">
        {currentItems.length === 0 ? (
          <div className="py-10 text-center text-ink-400">
            <i className="ph ph-calendar-x text-3xl mb-2 inline-block text-ink-300"></i>
            <p className="font-medium text-ink-600 text-sm">Nenhum atendimento encontrado</p>
            <p className="text-xs mt-1">Ajuste os filtros de busca, data ou status acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentItems.map(item => {
              const statusBadge = getStatusBadge(item.status);
              const iniciais = item.paciente
                .split(' ')
                .slice(0, 2)
                .map(n => n[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-ink-100 bg-white p-4 shadow-xs hover:border-brand-200 transition-all flex flex-col justify-between gap-3.5"
                >
                  {/* Topo do Card: Paciente, Guia e Status Operacional */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center font-bold font-heading text-xs shrink-0">
                        {iniciais}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900 text-sm leading-snug truncate">
                          {item.paciente}
                        </p>
                        <p className="text-xs font-mono text-ink-400 mt-0.5">
                          Guia: <strong className="text-ink-700">#{item.guia}</strong>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusBadge.classe}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Bloco Central: Horário, Profissional e Convênio */}
                  <div className="p-3 rounded-xl bg-ink-50/70 border border-ink-100 space-y-2 text-xs">
                    {/* Horário e Sala */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-medium text-ink-800">
                        <i className="ph ph-clock text-brand-600 text-sm shrink-0"></i>
                        <span className="font-mono font-bold text-ink-900">{item.horario}</span>
                        <span className="text-ink-400">•</span>
                        <span className="text-ink-500">{item.data}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-ink-200 text-[11px] font-medium text-ink-700">
                        {item.local}
                      </span>
                    </div>

                    {/* Profissional */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-ink-200/60 text-ink-600">
                      <i className="ph ph-stethoscope text-ink-400 text-sm shrink-0"></i>
                      <span className="truncate">
                        Profissional: <strong className="text-ink-800">{item.profissional}</strong>
                      </span>
                    </div>

                    {/* Convênio & Status Financeiro */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-ink-200/60 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-800 truncate">{item.convenio}</p>
                        <p className="text-[11px] text-ink-400">{item.cobertura}</p>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-ink-600 bg-white border border-ink-200 px-2 py-0.5 rounded-md shrink-0">
                        Fin: {item.statusFinanceiro}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé de Ações com botões tácteis */}
                  <div className="pt-2 border-t border-ink-100 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenHistorico(item)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-ink-700 bg-ink-50 hover:bg-ink-100 border border-ink-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="ph ph-clock-counter-clockwise text-base text-brand-600"></i>
                      <span>Histórico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenImpressao(item)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="ph ph-printer text-base"></i>
                      <span>Imprimir Guia</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VISUALIZAÇÃO DESKTOP (Tabela Completa >= lg) */}
      <div className="hidden lg:block overflow-x-auto">
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
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-400">
                  <i className="ph ph-calendar-x text-3xl mb-2 inline-block text-ink-300"></i>
                  <p className="font-medium text-ink-600 text-sm">Nenhum atendimento encontrado</p>
                  <p className="text-xs mt-1">Ajuste os filtros de busca ou selecione outra data.</p>
                </td>
              </tr>
            ) : (
              currentItems.map((item) => {
                const statusBadge = getStatusBadge(item.status);
                const iniciais = item.paciente
                  .split(' ')
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={item.id} className="hover:bg-ink-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold font-heading text-xs shrink-0">
                          {iniciais}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{item.paciente}</p>
                          <p className="text-xs font-mono text-ink-400">Guia: #{item.guia}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-mono font-semibold text-ink-800">{item.horario}</p>
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.classe}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-ink-600 bg-ink-100 px-2 py-1 rounded uppercase tracking-wider text-[10px]">
                        {item.statusFinanceiro}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenHistorico(item)}
                          className="p-2 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer"
                          title="Histórico Clínico"
                        >
                          <i className="ph ph-clock-counter-clockwise text-lg"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenImpressao(item)}
                          className="p-2 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer"
                          title="Imprimir Guia ANS"
                        >
                          <i className="ph ph-printer text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Responsivo */}
      <div className="p-4 sm:p-5 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <p className="text-ink-500 text-center sm:text-left">
          Mostrando <span className="font-medium text-ink-900">{totalItems === 0 ? 0 : startIndex + 1}</span> a{' '}
          <span className="font-medium text-ink-900">{endIndex}</span> de{' '}
          <span className="font-medium text-ink-900">{totalItems}</span> atendimentos
        </p>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            aria-label="Página anterior"
            className="p-2 rounded-xl border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <i className="ph ph-caret-left text-sm"></i>
          </button>
          
          <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-semibold text-xs border border-brand-100">
            {currentPage}
          </span>
          
          <button 
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            aria-label="Próxima página"
            className="p-2 rounded-xl border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <i className="ph ph-caret-right text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
