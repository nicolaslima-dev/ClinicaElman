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
  const [fonteDados, setFonteDados] = useState<'supabase' | 'local'>('local');

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
    setFonteDados(resPac.fonte === 'supabase' && resOp.fonte === 'supabase' ? 'supabase' : 'local');
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
          className={`fixed top-6 right-6 z-[150] px-4 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 fade-in ${
            feedback.tipo === 'sucesso'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-red-200 text-red-700'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            <i
              className={`ph ${
                feedback.tipo === 'sucesso' ? 'ph-check-circle' : 'ph-warning-circle'
              } text-lg`}
            ></i>
          </div>
          <span className="text-sm font-medium pr-2">{feedback.mensagem}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
              Pacientes & Convênios TISS
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                fonteDados === 'supabase'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                fonteDados === 'supabase'
                  ? 'Sincronizado diretamente com public.operadoras, public.planos_saude e public.pacientes no Supabase'
                  : 'Armazenando localmente — rode o script SQL 001_fase1_operadoras_planos_pacientes.sql no Supabase para persistir na nuvem'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  fonteDados === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
              {fonteDados === 'supabase' ? 'Supabase Conectado (3FN)' : 'Modo Local (Aguardando SQL Supabase)'}
            </span>
          </div>
          <p className="text-sm text-ink-400 mt-1">
            Cadastre pacientes completos e gerencie previamente operadoras e planos com suas versões TISS pré-definidas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModoModalConvenio({ tipo: 'nova_operadora' })}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center gap-2 shadow-card"
          >
            <i className="ph ph-buildings text-brand-600 text-lg"></i>
            Nova Operadora
          </button>

          <button
            type="button"
            onClick={() => {
              setPacienteEdicao(null);
              setModalPacienteOpen(true);
            }}
            className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-soft group"
          >
            <i className="ph ph-user-plus text-lg text-brand-300"></i>
            Novo Paciente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        <div className="action-card bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Pacientes Ativos
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {pacientes.length}{' '}
              <span className="text-sm font-medium font-sans text-ink-400">cadastrados</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-50 text-brand-600">
            <i className="ph ph-users text-xl"></i>
          </div>
        </div>

        <div className="action-card bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Operadoras TISS
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {operadoras.length}{' '}
              <span className="text-sm font-medium font-sans text-ink-400">
                ({totalPlanos} planos)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
            <i className="ph ph-buildings text-xl"></i>
          </div>
        </div>

        <div className="action-card bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Conferência Carteira
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {alertasCarteira}{' '}
              <span
                className={`text-sm font-medium font-sans ${
                  alertasCarteira > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {alertasCarteira === 1 ? 'divergência' : 'divergências'}
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold-500/10 text-gold-600">
            <i className="ph ph-identification-badge text-xl"></i>
          </div>
        </div>

        <div
          onClick={() => setAbaAtiva(abaAtiva === 'pacientes' ? 'operadoras' : 'pacientes')}
          className="action-card cursor-pointer p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between bg-gradient-to-br from-brand-900 to-ink-900 text-white"
        >
          <div>
            <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">
              Atalho Rápido
            </p>
            <p className="text-sm font-medium mt-1 leading-snug">
              {abaAtiva === 'pacientes' ? (
                <>
                  Gerenciar Operadoras
                  <br />e Versões TISS
                </>
              ) : (
                <>
                  Voltar para Lista
                  <br />de Pacientes
                </>
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
            <i className="ph ph-arrows-left-right text-xl"></i>
          </div>
        </div>
      </div>

      {/* Tabs: Pacientes vs Operadoras & Planos */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-white border border-ink-100 rounded-xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setAbaAtiva('pacientes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            abaAtiva === 'pacientes'
              ? 'bg-ink-900 text-white shadow-xs'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <i className="ph ph-users"></i>
          Pacientes Cadastrados
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              abaAtiva === 'pacientes' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {pacientes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('operadoras')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            abaAtiva === 'operadoras'
              ? 'bg-ink-900 text-white shadow-xs'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <i className="ph ph-buildings"></i>
          Operadoras & Planos (Versões TISS)
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
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
