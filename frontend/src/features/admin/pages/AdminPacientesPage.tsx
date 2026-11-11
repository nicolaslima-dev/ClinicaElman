import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CreateOperadoraDTO,
  CreatePacienteDTO,
  CreatePlanoSaudeDTO,
  OperadoraRecord,
  PacienteRecord,
} from '@/features/admin/types';
import {
  atualizarOperadora,
  criarOperadora,
  criarPlanoSaude,
  listarOperadorasComPlanos,
} from '@/features/admin/api/convenios.service';
import {
  atualizarPaciente,
  criarPaciente,
  excluirPaciente,
  listarPacientes,
} from '@/features/admin/api/pacientes.service';
import { validarCarteiraPorOperadora } from '@/features/admin/utils/pacienteValidators';
import { PacientesTable } from '../components/pacientes/PacientesTable';
import { OperadorasPlanosSection } from '../components/pacientes/OperadorasPlanosSection';
import { ModalCadastroPaciente } from '../components/pacientes/ModalCadastroPaciente';
import {
  ModalOperadoraPlano,
  type ModoModalConvenio,
} from '../components/pacientes/ModalOperadoraPlano';

export function AdminPacientesPage() {
  const [abaAtiva, setAbaAtiva] = useState<'pacientes' | 'operadoras'>('pacientes');
  const [loading, setLoading] = useState(true);

  const [pacientes, setPacientes] = useState<PacienteRecord[]>([]);
  const [operadoras, setOperadoras] = useState<OperadoraRecord[]>([]);

  const [isModalPacienteOpen, setModalPacienteOpen] = useState(false);
  const [pacienteEdicao, setPacienteEdicao] = useState<PacienteRecord | null>(null);
  const [modoModalConvenio, setModoModalConvenio] = useState<ModoModalConvenio | null>(null);

  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  const exibirFeedback = (tipo: 'sucesso' | 'erro', mensagem: string) => {
    setFeedback({ tipo, mensagem });
    setTimeout(() => {
      setFeedback(atual => (atual?.mensagem === mensagem ? null : atual));
    }, 4500);
  };

  const carregarDados = useCallback(async () => {
    setLoading(true);
    const [resOp, resPac] = await Promise.all([
      listarOperadorasComPlanos(),
      listarPacientes(),
    ]);
    setOperadoras(resOp.data);
    setPacientes(resPac.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const totalPlanos = useMemo(
    () => operadoras.reduce((acc, op) => acc + (op.planos?.length || 0), 0),
    [operadoras]
  );

  const alertasCarteira = useMemo(
    () =>
      pacientes.filter(p => {
        const check = validarCarteiraPorOperadora(
          p.carteira_plano,
          p.plano?.operadora?.tamanho_matricula
        );
        return !check.conforme;
      }).length,
    [pacientes]
  );

  const handleSalvarPaciente = async (
    dados: CreatePacienteDTO,
    idEdicao?: string
  ): Promise<boolean> => {
    if (idEdicao) {
      const { error } = await atualizarPaciente(idEdicao, dados);
      if (error) {
        exibirFeedback('erro', error);
        return false;
      }
      exibirFeedback('sucesso', 'Cadastro do paciente atualizado com sucesso!');
    } else {
      const { error } = await criarPaciente(dados);
      if (error) {
        exibirFeedback('erro', error);
        return false;
      }
      exibirFeedback('sucesso', 'Paciente cadastrado com sucesso!');
    }

    await carregarDados();
    return true;
  };

  const handleExcluirPaciente = async (paciente: PacienteRecord) => {
    const confirmar = window.confirm(
      `Deseja realmente remover o cadastro do paciente "${paciente.nome}"?`
    );
    if (!confirmar) return;

    const { error } = await excluirPaciente(paciente.id);
    if (error) {
      exibirFeedback('erro', error);
      return;
    }
    exibirFeedback('sucesso', `Paciente "${paciente.nome}" removido.`);
    await carregarDados();
  };

  const handleSalvarOperadora = async (
    dados: CreateOperadoraDTO,
    idEdicao?: string
  ): Promise<boolean> => {
    if (idEdicao) {
      const { error } = await atualizarOperadora(idEdicao, dados);
      if (error) {
        exibirFeedback('erro', error);
        return false;
      }
      exibirFeedback('sucesso', `Operadora ${dados.nome} atualizada (TISS ${dados.versao_tiss}).`);
    } else {
      const { error } = await criarOperadora(dados);
      if (error) {
        exibirFeedback('erro', error);
        return false;
      }
      exibirFeedback(
        'sucesso',
        `Operadora ${dados.nome} pré-cadastrada com padrão TISS ${dados.versao_tiss}!`
      );
    }

    await carregarDados();
    return true;
  };

  const handleSalvarPlano = async (dados: CreatePlanoSaudeDTO): Promise<boolean> => {
    const { error } = await criarPlanoSaude(dados);
    if (error) {
      exibirFeedback('erro', error);
      return false;
    }
    exibirFeedback('sucesso', `Plano "${dados.nome_plano}" vinculado à operadora!`);
    await carregarDados();
    return true;
  };

  return (
    <div id="view-pacientes" className="view-section fade-in max-w-7xl mx-auto w-full pb-10">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-[150] px-4 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 fade-in ${feedback.tipo === 'sucesso'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-red-200 text-red-700'
            }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
              }`}
          >
            <i
              className={`ph ${feedback.tipo === 'sucesso' ? 'ph-check-circle' : 'ph-warning-circle'
                } text-lg`}
            ></i>
          </div>
          <span className="text-xs sm:text-sm font-medium pr-2">{feedback.mensagem}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5 sm:mb-7">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold font-heading text-ink-900 tracking-tight leading-tight">
              Pacientes & Convênios TISS
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Cadastre pacientes completos e gerencie operadoras e planos com suas versões TISS pré-definidas.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setModoModalConvenio({ tipo: 'nova_operadora' })}
            className="h-10 px-2 sm:px-5 rounded-full text-[11px] sm:text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center justify-center gap-1 sm:gap-2 shadow-card cursor-pointer whitespace-nowrap"
          >
            <i className="ph ph-buildings text-brand-600 text-sm sm:text-lg shrink-0"></i>
            <span>Nova Operadora</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPacienteEdicao(null);
              setModalPacienteOpen(true);
            }}
            className="h-10 px-2 sm:px-6 bg-ink-900 hover:bg-ink-800 text-white font-semibold rounded-full transition-all text-[11px] sm:text-sm flex items-center justify-center gap-1 sm:gap-2 shadow-soft group cursor-pointer whitespace-nowrap"
          >
            <i className="ph ph-user-plus text-sm sm:text-lg text-brand-300 shrink-0"></i>
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Grid 2x2 no celular, 4 colunas no desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 mb-5 sm:mb-7">
        {/* Card 1: Pacientes Ativos */}
        <div className="action-card bg-white p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider leading-tight">
              Pacientes Ativos
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-brand-50 text-brand-600 shrink-0">
              <i className="ph ph-users text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold font-heading text-ink-900 leading-none">
                {pacientes.length}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-ink-500">
                cadastrados
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Operadoras TISS */}
        <div className="action-card bg-white p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider leading-tight">
              Operadoras TISS
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
              <i className="ph ph-buildings text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold font-heading text-ink-900 leading-none">
                {operadoras.length}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-ink-500">
                ({totalPlanos} planos)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Conferência Carteira */}
        <div className="action-card bg-white p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider leading-tight">
              Conferência
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
              <i className="ph ph-identification-badge text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold font-heading text-ink-900 leading-none">
                {alertasCarteira}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-semibold ${
                  alertasCarteira > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {alertasCarteira === 1 ? 'divergência' : 'divergências'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Atalho Rápido */}
        <div
          onClick={() => setAbaAtiva(abaAtiva === 'pacientes' ? 'operadoras' : 'pacientes')}
          className="action-card cursor-pointer p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between bg-gradient-to-br from-brand-900 to-ink-900 text-white group"
        >
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-brand-200 uppercase tracking-wider leading-tight">
              Atalho Rápido
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 shrink-0 group-hover:bg-white/20 transition-colors">
              <i className="ph ph-arrows-left-right text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white leading-tight">
              {abaAtiva === 'pacientes' ? 'Gerenciar Operadoras' : 'Lista de Pacientes'}
            </p>
            <p className="text-[10px] sm:text-xs text-brand-300 font-medium leading-tight mt-0.5">
              {abaAtiva === 'pacientes' ? 'Planos & Versões TISS' : 'Voltar aos cadastros'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Pacientes vs Operadoras & Planos */}
      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-6 p-1 bg-white border border-ink-100 rounded-xl w-full sm:w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setAbaAtiva('pacientes')}
          className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            abaAtiva === 'pacientes'
              ? 'bg-ink-900 text-white shadow-xs'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <i className="ph ph-users shrink-0 text-xs sm:text-sm"></i>
          <span className="whitespace-nowrap">Pacientes</span>
          <span className="hidden sm:inline">Cadastrados</span>
          <span
            className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
              abaAtiva === 'pacientes' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {pacientes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('operadoras')}
          className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            abaAtiva === 'operadoras'
              ? 'bg-ink-900 text-white shadow-xs'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <i className="ph ph-buildings shrink-0 text-xs sm:text-sm"></i>
          <span className="whitespace-nowrap">Operadoras</span>
          <span className="hidden sm:inline">& Planos (TISS)</span>
          <span
            className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
              abaAtiva === 'operadoras' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {operadoras.length}
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {abaAtiva === 'pacientes' ? (
        <PacientesTable
          loading={loading}
          pacientes={pacientes}
          operadoras={operadoras}
          onEditar={pac => {
            setPacienteEdicao(pac);
            setModalPacienteOpen(true);
          }}
          onExcluir={handleExcluirPaciente}
        />
      ) : (
        <OperadorasPlanosSection
          operadoras={operadoras}
          pacientes={pacientes}
          onAbrirModal={modo => setModoModalConvenio(modo)}
        />
      )}

      {/* Modais */}
      <ModalCadastroPaciente
        isOpen={isModalPacienteOpen}
        pacienteEdicao={pacienteEdicao}
        operadoras={operadoras}
        onClose={() => {
          setModalPacienteOpen(false);
          setPacienteEdicao(null);
        }}
        onSalvar={handleSalvarPaciente}
        onAbrirCadastroOperadora={() => setModoModalConvenio({ tipo: 'nova_operadora' })}
      />

      <ModalOperadoraPlano
        modo={modoModalConvenio}
        onClose={() => setModoModalConvenio(null)}
        onSalvarOperadora={handleSalvarOperadora}
        onSalvarPlano={handleSalvarPlano}
      />
    </div>
  );
}
