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
      {/* Toolbar de Filtros */}
      <div className="p-5 border-b border-ink-100 flex flex-wrap gap-3 items-center justify-between bg-ink-50/30 rounded-t-[20px]">
        <div className="relative w-full md:w-80">
          <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
          <input
            type="text"
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar nome, CPF, carteira ou cidade..."
            className="filter-input w-full !pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filtroOperadoraId}
            onChange={e => {
              setFiltroOperadoraId(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-input text-ink-600 pr-8"
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
            className="filter-input text-ink-600 pr-8"
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

      {/* Tabela */}
      <div className="overflow-x-auto">
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
                          className="px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1"
                          title="Iniciar Registro de Atendimento / Guia para este paciente"
                        >
                          <i className="ph ph-stethoscope text-sm"></i> Atender
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditar(pac)}
                          className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar Paciente"
                        >
                          <i className="ph ph-pencil-simple text-lg"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => onExcluir(pac)}
                          className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      <div className="p-5 border-t border-ink-100 flex items-center justify-between text-sm">
        <p className="text-ink-500">
          Mostrando{' '}
          <span className="font-medium text-ink-900">{totalItems === 0 ? 0 : startIndex + 1}</span> a{' '}
          <span className="font-medium text-ink-900">{endIndex}</span> de{' '}
          <span className="font-medium text-ink-900">{totalItems}</span> pacientes
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
            className="p-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ph ph-caret-left"></i>
          </button>
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-medium text-sm border border-brand-100">
            {paginaSegura}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={paginaSegura === totalPages}
            className="p-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ph ph-caret-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
