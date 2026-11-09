import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PacienteRecord } from '@/features/admin/types';
import { listarPacientes } from '@/features/admin/api/pacientes.service';
import {
  formatarCPF,
  formatarDataBr,
  formatarEnderecoCompleto,
} from '@/features/admin/utils/pacienteValidators';

interface IdentificacaoSectionProps {
  onPacienteChange?: (paciente: PacienteRecord | null) => void;
}

export function IdentificacaoSection({ onPacienteChange }: IdentificacaoSectionProps) {
  const [searchParams] = useSearchParams();
  const pacienteIdUrl = searchParams.get('pacienteId');

  const [pacientes, setPacientes] = useState<PacienteRecord[]>([]);
  const [busca, setBusca] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteRecord | null>(null);

  useEffect(() => {
    let ativo = true;
    listarPacientes().then(res => {
      if (!ativo) return;
      setPacientes(res.data);

      const alvo =
        (pacienteIdUrl ? res.data.find(p => p.id === pacienteIdUrl) : null) ||
        res.data[0] ||
        null;

      if (alvo) {
        setPacienteSelecionado(alvo);
        setBusca(`${alvo.nome} (CPF: ${formatarCPF(alvo.cpf)})`);
        onPacienteChange?.(alvo);
      }
    });
    return () => {
      ativo = false;
    };
  }, [pacienteIdUrl]);

  const sugestoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 8);
    const qDig = q.replace(/\D/g, '');
    return pacientes
      .filter(
        p =>
          p.nome.toLowerCase().includes(q) ||
          p.carteira_plano.toLowerCase().includes(q) ||
          (qDig.length >= 2 && p.cpf.replace(/\D/g, '').includes(qDig))
      )
      .slice(0, 8);
  }, [pacientes, busca]);

  const selecionarPaciente = (pac: PacienteRecord) => {
    setPacienteSelecionado(pac);
    setBusca(`${pac.nome} (CPF: ${formatarCPF(pac.cpf)})`);
    setDropdownAberto(false);
    onPacienteChange?.(pac);
  };

  const operadora = pacienteSelecionado?.plano?.operadora;
  const plano = pacienteSelecionado?.plano;

  return (
    <div className="bg-white p-7 rounded-[20px] shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-ink-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            <i className="ph ph-user text-lg"></i>
          </div>
          <div>
            <h3 className="text-base font-semibold font-heading text-ink-900">
              Identificação e Elegibilidade
            </h3>
            <p className="text-xs text-ink-400">
              Ao selecionar o paciente cadastrado, o Plano de Saúde, Carteirinha e Versão TISS são carregados automaticamente.
            </p>
          </div>
        </div>

        <Link
          to="/pacientes"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
        >
          <i className="ph ph-user-plus"></i> Gerenciar / Novo Paciente
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Busca Autocomplete de Paciente */}
        <div className="col-span-1 md:col-span-4 relative">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">
            Buscar Paciente Cadastrado (Nome, CPF ou Carteirinha)
          </label>
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
            <input
              type="text"
              value={busca}
              onFocus={() => setDropdownAberto(true)}
              onChange={e => {
                setBusca(e.target.value);
                setDropdownAberto(true);
              }}
              className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 pl-10 pr-9 text-sm outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 transition-all text-ink-900"
              placeholder="Digite o nome, CPF ou número da carteira..."
            />
            {busca && (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setPacienteSelecionado(null);
                  onPacienteChange?.(null);
                  setDropdownAberto(true);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                title="Limpar busca"
              >
                <i className="ph ph-x"></i>
              </button>
            )}
          </div>

          {dropdownAberto && sugestoes.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-ink-100 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-ink-100">
              {sugestoes.map(pac => (
                <button
                  key={pac.id}
                  type="button"
                  onClick={() => selecionarPaciente(pac)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-50/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{pac.nome}</p>
                    <p className="text-xs text-ink-400">
                      CPF: {formatarCPF(pac.cpf)} • Nasc: {formatarDataBr(pac.data_nascimento)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                      {pac.plano?.operadora?.nome || 'Convênio'} • TISS{' '}
                      {pac.plano?.operadora?.versao_tiss || '4.03.00'}
                    </span>
                    <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                      Cart.: {pac.carteira_plano}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campos Pré-definidos herdados automaticamente do vínculo Paciente -> Plano -> Operadora */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-ink-500">Operadora / Convênio</label>
            {operadora?.versao_tiss && (
              <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                TISS {operadora.versao_tiss}
              </span>
            )}
          </div>
          <input
            type="text"
            readOnly
            value={operadora?.nome || ''}
            placeholder="Automático pelo paciente"
            className="w-full bg-ink-50/70 border border-ink-100 rounded-lg p-2.5 text-sm font-semibold text-ink-900 outline-none cursor-default"
          />
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Plano de Saúde</label>
          <input
            type="text"
            readOnly
            value={plano?.nome_plano || ''}
            placeholder="Automático pelo paciente"
            className="w-full bg-ink-50/70 border border-ink-100 rounded-lg p-2.5 text-sm text-ink-900 outline-none cursor-default"
          />
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">
            Matrícula / Carteirinha
          </label>
          <input
            type="text"
            readOnly
            value={pacienteSelecionado?.carteira_plano || ''}
            placeholder="Automático pelo paciente"
            className="w-full bg-ink-50/70 border border-ink-100 rounded-lg p-2.5 text-sm text-ink-900 font-mono outline-none cursor-default"
          />
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">
            Validade da Carteira
          </label>
          <input
            type="date"
            readOnly
            value={pacienteSelecionado?.validade_carteira?.split('T')[0] || ''}
            className="w-full bg-ink-50/70 border border-ink-100 rounded-lg p-2.5 text-sm text-ink-900 outline-none cursor-default"
          />
        </div>

        {pacienteSelecionado && (
          <div className="col-span-1 md:col-span-4 bg-ink-50/60 border border-ink-100 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-600">
            <div className="flex items-center gap-2">
              <i className="ph ph-map-pin text-brand-600 text-base"></i>
              <span>
                <strong className="text-ink-800">Endereço Cadastrado:</strong>{' '}
                {formatarEnderecoCompleto(pacienteSelecionado)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                <strong className="text-ink-800">Nascimento:</strong>{' '}
                {formatarDataBr(pacienteSelecionado.data_nascimento)}
              </span>
              {operadora?.registro_ans && (
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-ink-200 text-ink-700">
                  ANS: {operadora.registro_ans}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
