import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OperadoraRecord, PacienteRecord } from '@/features/admin/types';
import {
  calcularIdade,
  formatarCEP,
  formatarCPF,
  formatarDataBr,
  validarCarteiraPorOperadora,
} from '@/features/admin/utils/pacienteValidators';

interface PacientesTableProps {
  loading: boolean;
  pacientes: PacienteRecord[];
  operadoras: OperadoraRecord[];
  onEditar: (paciente: PacienteRecord) => void;
  onExcluir: (paciente: PacienteRecord) => void;
}

export function PacientesTable({
  loading,
  pacientes,
  operadoras,
  onEditar,
  onExcluir,
}: PacientesTableProps) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [filtroOperadoraId, setFiltroOperadoraId] = useState('');
  const [filtroVersaoTiss, setFiltroVersaoTiss] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const versoesEmUso = useMemo(() => {
    const set = new Set<string>();
    operadoras.forEach(op => {
      if (op.versao_tiss) set.add(op.versao_tiss);
    });
    return Array.from(set).sort().reverse();
  }, [operadoras]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const termoDigitos = termo.replace(/\D/g, '');

    return pacientes.filter(p => {
      const operadora = p.plano?.operadora;
      if (filtroOperadoraId && operadora?.id !== filtroOperadoraId) return false;
      if (filtroVersaoTiss && operadora?.versao_tiss !== filtroVersaoTiss) return false;

      if (!termo) return true;

      const matchNome = p.nome.toLowerCase().includes(termo);
      const matchCidade = p.cidade.toLowerCase().includes(termo);
      const matchCarteira = p.carteira_plano.toLowerCase().includes(termo);
      const matchCpf =
        p.cpf.toLowerCase().includes(termo) ||
        (termoDigitos.length >= 3 && p.cpf.replace(/\D/g, '').includes(termoDigitos));

      return matchNome || matchCidade || matchCarteira || matchCpf;
    });
  }, [pacientes, busca, filtroOperadoraId, filtroVersaoTiss]);

  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginaSegura = Math.min(currentPage, totalPages);
  const startIndex = (paginaSegura - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const itensPagina = filtrados.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 flex flex-col">
      {/* Toolbar de Filtros Responsiva */}
      <div className="p-4 sm:p-5 border-b border-ink-100 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-ink-50/30 rounded-t-[20px]">
        <div className="relative w-full lg:w-80">
          <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
          <input
            type="text"
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar nome, CPF, carteira ou cidade..."
            className="filter-input w-full !pl-10 !pr-8"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <select
            value={filtroOperadoraId}
            onChange={e => {
              setFiltroOperadoraId(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-input text-ink-600 pr-8 w-full lg:w-auto"
          >
            <option value="">Todas as Operadoras</option>
            {operadoras.map(op => (
              <option key={op.id} value={op.id}>
                {op.nome}
              </option>
            ))}
          </select>

          <select
            value={filtroVersaoTiss}
            onChange={e => {
              setFiltroVersaoTiss(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-input text-ink-600 pr-8 w-full lg:w-auto"
          >
            <option value="">Todas Versões TISS</option>
            {versoesEmUso.map(v => (
              <option key={v} value={v}>
                Padrão TISS {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VISUALIZAÇÃO MOBILE & TABLET (Cards Responsivos < lg) */}
      <div className="lg:hidden p-3.5 sm:p-5">
        {loading ? (
          <div className="py-12 text-center text-ink-400">
            <i className="ph ph-spinner animate-spin text-2xl mb-2 inline-block"></i>
            <p className="text-sm">Carregando cadastro de pacientes...</p>
          </div>
        ) : itensPagina.length === 0 ? (
          <div className="py-10 text-center text-ink-400">
            <i className="ph ph-users text-3xl mb-2 inline-block text-ink-300"></i>
            <p className="font-medium text-ink-600 text-sm">Nenhum paciente encontrado</p>
            <p className="text-xs mt-1">Cadastre um novo paciente ou ajuste os filtros acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {itensPagina.map(pac => {
              const idade = calcularIdade(pac.data_nascimento);
              const operadora = pac.plano?.operadora;
              const checkCarteira = validarCarteiraPorOperadora(
                pac.carteira_plano,
                operadora?.tamanho_matricula
              );
              const iniciais = pac.nome
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(n => n[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={pac.id}
                  className="rounded-2xl border border-ink-100 bg-white p-3.5 sm:p-4 shadow-xs hover:border-brand-200 transition-all flex flex-col justify-between gap-3"
                >
                  {/* Cabeçalho do Card: Avatar + Nome + Idade no topo, CPF e Nascimento abaixo */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold font-heading text-xs shrink-0 border border-brand-100">
                          {iniciais}
                        </div>
                        <p className="font-bold text-ink-900 text-sm leading-tight break-words">
                          {pac.nome}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ink-50 text-ink-700 border border-ink-100 shrink-0 whitespace-nowrap shadow-2xs">
                        <i className="ph ph-cake text-brand-600"></i>
                        {idade !== null ? `${idade} anos` : formatarDataBr(pac.data_nascimento)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-ink-500 font-mono pl-11.5 flex-wrap">
                      <span className="whitespace-nowrap">
                        CPF: <strong className="font-semibold text-ink-800">{formatarCPF(pac.cpf)}</strong>
                      </span>
                      <span className="text-ink-300">•</span>
                      <span className="text-ink-400 font-sans text-[11px] whitespace-nowrap">
                        Nasc: {formatarDataBr(pac.data_nascimento)}
                      </span>
                    </div>
                  </div>

                  {/* Bloco Destacado: Operadora, Plano, TISS e Carteirinha */}
                  <div className="p-3 rounded-xl bg-ink-50/70 border border-ink-100 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink-900 leading-tight">
                          {operadora?.nome || 'Operadora'}
                        </p>
                        <p className="text-[11px] text-ink-500 leading-tight mt-0.5 break-words">
                          {pac.plano?.nome_plano || 'Plano vinculado'}
                        </p>
                      </div>
                      {operadora?.versao_tiss && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200 shrink-0 whitespace-nowrap shadow-2xs">
                          TISS {operadora.versao_tiss}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">
                          Carteira:
                        </span>
                        <span className="font-mono text-xs font-bold text-ink-800 bg-white px-2 py-0.5 rounded-md border border-ink-200/80 shadow-2xs">
                          {pac.carteira_plano}
                        </span>
                        {!checkCarteira.conforme && (
                          <span
                            title={checkCarteira.mensagem}
                            className="text-amber-600 inline-flex items-center"
                          >
                            <i className="ph-fill ph-warning-circle text-sm"></i>
                          </span>
                        )}
                      </div>

                      {pac.validade_carteira && (
                        <span className="text-[10px] text-ink-400 font-medium whitespace-nowrap">
                          Val: {formatarDataBr(pac.validade_carteira)}
                        </span>
                      )}
                    </div>

                    {!checkCarteira.conforme && (
                      <p className="text-[10px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200/60 leading-tight">
                        {checkCarteira.mensagem}
                      </p>
                    )}
                  </div>

                  {/* Endereço Completo e Legível */}
                  <div className="flex items-start gap-2 text-[11px] sm:text-xs text-ink-500 px-0.5">
                    <i className="ph ph-map-pin text-brand-600 text-sm shrink-0 mt-0.5"></i>
                    <p className="leading-snug line-clamp-3 sm:line-clamp-none break-words">
                      <span className="font-semibold text-ink-800">
                        {pac.logradouro}, {pac.numero}
                        {pac.complemento ? ` (${pac.complemento})` : ''}
                      </span>{' '}
                      — {pac.bairro}, {pac.cidade}/{pac.uf} • CEP {formatarCEP(pac.cep)}
                    </p>
                  </div>

                  {/* Rodapé de Ações Padronizadas e Responsivas */}
                  <div className="pt-2.5 border-t border-ink-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/atendimento/novo?pacienteId=${pac.id}`)}
                      className="w-full h-10 px-4 rounded-xl text-xs font-bold text-white bg-ink-900 hover:bg-ink-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <i className="ph ph-stethoscope text-base text-brand-300 shrink-0"></i>
                      <span>Iniciar Atendimento</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onEditar(pac)}
                        className="h-9 px-3 rounded-xl text-xs font-semibold text-ink-700 bg-white hover:bg-ink-50 border border-ink-200 active:scale-[0.99] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Editar Paciente"
                      >
                        <i className="ph ph-pencil-simple text-sm text-ink-500 shrink-0"></i>
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onExcluir(pac)}
                        className="h-9 px-3 rounded-xl text-xs font-semibold text-red-600 bg-red-50/60 hover:bg-red-50 border border-red-200/60 active:scale-[0.99] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Excluir Paciente"
                        aria-label={`Excluir paciente ${pac.nome}`}
                      >
                        <i className="ph ph-trash text-sm shrink-0"></i>
                        <span>Excluir</span>
                      </button>
                    </div>
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
              <th className="py-4 px-6 font-medium">Paciente / CPF</th>
              <th className="py-4 px-5 font-medium">Nascimento</th>
              <th className="py-4 px-5 font-medium">Endereço Completo</th>
              <th className="py-4 px-5 font-medium">Plano de Saúde & TISS</th>
              <th className="py-4 px-5 font-medium">Carteira do Plano</th>
              <th className="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-400">
                  <i className="ph ph-spinner animate-spin text-2xl mb-2 inline-block"></i>
                  <p>Carregando cadastro de pacientes...</p>
                </td>
              </tr>
            ) : itensPagina.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-400">
                  <i className="ph ph-users text-3xl mb-2 inline-block text-ink-300"></i>
                  <p className="font-medium text-ink-600">Nenhum paciente encontrado</p>
                  <p className="text-xs mt-1">Cadastre um novo paciente ou ajuste os filtros acima.</p>
                </td>
              </tr>
            ) : (
              itensPagina.map(pac => {
                const idade = calcularIdade(pac.data_nascimento);
                const operadora = pac.plano?.operadora;
                const checkCarteira = validarCarteiraPorOperadora(
                  pac.carteira_plano,
                  operadora?.tamanho_matricula
                );
                const iniciais = pac.nome
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={pac.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold font-heading text-xs shrink-0 border border-brand-100">
                          {iniciais}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{pac.nome}</p>
                          <p className="text-xs font-mono text-ink-500">CPF: {formatarCPF(pac.cpf)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="font-medium text-ink-800">{formatarDataBr(pac.data_nascimento)}</p>
                      {idade !== null && (
                        <p className="text-xs text-ink-400">{idade} anos</p>
                      )}
                    </td>

                    <td className="py-4 px-5 max-w-xs">
                      <p className="font-medium text-ink-800 truncate" title={`${pac.logradouro}, ${pac.numero}${pac.complemento ? ` - ${pac.complemento}` : ''}`}>
                        {pac.logradouro}, {pac.numero}
                        {pac.complemento ? ` (${pac.complemento})` : ''}
                      </p>
                      <p className="text-xs text-ink-400 truncate">
                        {pac.bairro} • {pac.cidade}/{pac.uf} • CEP {formatarCEP(pac.cep)}
                      </p>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink-900">
                          {operadora?.nome || 'Operadora'}
                        </span>
                        {operadora?.versao_tiss && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                            TISS {operadora.versao_tiss}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {pac.plano?.nome_plano || 'Plano vinculado'}
                      </p>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-ink-800 bg-ink-50 px-2.5 py-1 rounded-lg border border-ink-100">
                          {pac.carteira_plano}
                        </span>
                        {!checkCarteira.conforme && (
                          <span
                            title={checkCarteira.mensagem}
                            className="text-amber-600 cursor-help"
                          >
                            <i className="ph-fill ph-warning-circle text-base"></i>
                          </span>
                        )}
                      </div>
                      {pac.validade_carteira && (
                        <p className="text-[11px] text-ink-400 mt-1">
                          Validade: {formatarDataBr(pac.validade_carteira)}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/atendimento/novo?pacienteId=${pac.id}`)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Iniciar Registro de Atendimento / Guia para este paciente"
                        >
                          <i className="ph ph-stethoscope text-sm"></i> Atender
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditar(pac)}
                          className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Paciente"
                        >
                          <i className="ph ph-pencil-simple text-lg"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => onExcluir(pac)}
                          className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Paciente"
                        >
                          <i className="ph ph-trash text-lg"></i>
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

      {/* Paginação */}
      <div className="p-4 sm:p-5 border-t border-ink-100 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <p className="text-ink-500">
          Mostrando{' '}
          <span className="font-medium text-ink-900">{totalItems === 0 ? 0 : startIndex + 1}</span> a{' '}
          <span className="font-medium text-ink-900">{endIndex}</span> de{' '}
          <span className="font-medium text-ink-900">{totalItems}</span> pacientes
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
            className="p-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <i className="ph ph-caret-left"></i>
          </button>
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-medium text-xs sm:text-sm border border-brand-100">
            {paginaSegura}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={paginaSegura === totalPages}
            className="p-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <i className="ph ph-caret-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
