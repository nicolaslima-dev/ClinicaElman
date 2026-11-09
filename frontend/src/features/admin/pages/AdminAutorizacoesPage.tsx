import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  AutorizacaoRecord,
  CreateAutorizacaoDTO,
  CreateTerapeutaDTO,
  EmitirGuiaSpSadtDTO,
  GuiaTissRecord,
  PacienteRecord,
  ProcedimentoTussRecord,
  TerapeutaRecord,
} from '@/features/admin/types';
import { listarPacientes } from '@/features/admin/api/pacientes.service';
import {
  criarAutorizacao,
  criarTerapeuta,
  emitirGuiaSpSadt,
  listarAutorizacoes,
  listarGuiasTiss,
  listarProcedimentosTuss,
  listarTerapeutas,
} from '@/features/admin/api/autorizacoes.service';
import { formatarDataBr } from '@/features/admin/utils/pacienteValidators';
import { ModalCadastroAutorizacao } from '../components/autorizacoes/ModalCadastroAutorizacao';
import { ModalCadastroTerapeuta } from '../components/autorizacoes/ModalCadastroTerapeuta';
import { ModalEmitirGuiaSpSadt } from '../components/autorizacoes/ModalEmitirGuiaSpSadt';
import { ModalGuiaSpSadtPrint } from '../components/autorizacoes/ModalGuiaSpSadtPrint';

export function AdminAutorizacoesPage() {
  const [abaAtiva, setAbaAtiva] = useState<'autorizacoes' | 'guias'>('autorizacoes');
  const [loading, setLoading] = useState(true);
  const [fonteDados, setFonteDados] = useState<'supabase' | 'local'>('local');

  const [autorizacoes, setAutorizacoes] = useState<AutorizacaoRecord[]>([]);
  const [guias, setGuias] = useState<GuiaTissRecord[]>([]);
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([]);
  const [terapeutas, setTerapeutas] = useState<TerapeutaRecord[]>([]);
  const [procedimentosTuss, setProcedimentosTuss] = useState<ProcedimentoTussRecord[]>([]);

  const [busca, setBusca] = useState('');
  const [filtroTerapeutaId, setFiltroTerapeutaId] = useState('');

  // Modais
  const [isModalNovaAutOpen, setModalNovaAutOpen] = useState(false);
  const [isModalNovoTerapeutaOpen, setModalNovoTerapeutaOpen] = useState(false);
  const [autParaEmitirGuia, setAutParaEmitirGuia] = useState<AutorizacaoRecord | null>(null);
  const [guiaParaImprimir, setGuiaParaImprimir] = useState<GuiaTissRecord | null>(null);

  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  const exibirFeedback = (tipo: 'sucesso' | 'erro', mensagem: string) => {
    setFeedback({ tipo, mensagem });
    setTimeout(() => {
      setFeedback(atual => (atual?.mensagem === mensagem ? null : atual));
    }, 5000);
  };

  const carregarTudo = useCallback(async () => {
    setLoading(true);
    const [resAut, resGuias, resPac, resTer, resProc] = await Promise.all([
      listarAutorizacoes(),
      listarGuiasTiss(),
      listarPacientes(),
      listarTerapeutas(),
      listarProcedimentosTuss(),
    ]);

    setAutorizacoes(resAut.data);
    setGuias(resGuias.data);
    setPacientes(resPac.data);
    setTerapeutas(resTer.data);
    setProcedimentosTuss(resProc.data);
    setFonteDados(resAut.fonte === 'supabase' ? 'supabase' : 'local');
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const saldoTotalSessoes = useMemo(
    () =>
      autorizacoes.reduce(
        (acc, a) => acc + (a.saldo_disponivel ?? a.quantidade_total_sessoes),
        0
      ),
    [autorizacoes]
  );

  const guiasEnviadasFaturamento = useMemo(
    () => guias.filter(g => g.status_guia === 'enviada_faturamento').length,
    [guias]
  );

  const autorizacoesFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return autorizacoes.filter(a => {
      if (filtroTerapeutaId && a.terapeuta_id !== filtroTerapeutaId) return false;
      if (!q) return true;
      return (
        a.numero_autorizacao.toLowerCase().includes(q) ||
        a.codigo_tuss.toLowerCase().includes(q) ||
        a.descricao_termo.toLowerCase().includes(q) ||
        (a.paciente?.nome || '').toLowerCase().includes(q)
      );
    });
  }, [autorizacoes, busca, filtroTerapeutaId]);

  const guiasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return guias.filter(g => {
      if (filtroTerapeutaId && g.terapeuta_designado_id !== filtroTerapeutaId) return false;
      if (!q) return true;
      return (
        g.numero_guia_prestador.toLowerCase().includes(q) ||
        g.numero_senha.toLowerCase().includes(q) ||
        g.codigo_tuss.toLowerCase().includes(q) ||
        (g.paciente?.nome || '').toLowerCase().includes(q)
      );
    });
  }, [guias, busca, filtroTerapeutaId]);

  const handleSalvarAutorizacao = async (dados: CreateAutorizacaoDTO): Promise<boolean> => {
    const { guiaEmitida, error } = await criarAutorizacao(dados);
    if (error) {
      exibirFeedback('erro', error);
      return false;
    }

    await carregarTudo();
    if (guiaEmitida) {
      exibirFeedback(
        'sucesso',
        `Autorização salva e Guia SP/SADT #${guiaEmitida.numero_guia_prestador} enviada ao Terapeuta!`
      );
      setGuiaParaImprimir(guiaEmitida);
    } else {
      exibirFeedback('sucesso', 'Autorização cadastrada com sucesso!');
    }
    return true;
  };

  const handleEmitirGuia = async (dados: EmitirGuiaSpSadtDTO): Promise<boolean> => {
    const { data, error } = await emitirGuiaSpSadt(dados);
    if (error || !data) {
      exibirFeedback('erro', error || 'Erro ao emitir guia.');
      return false;
    }

    await carregarTudo();
    exibirFeedback(
      'sucesso',
      `Guia TISS SP/SADT #${data.numero_guia_prestador} gerada (Versão ${data.versao_tiss}) e enviada para ${data.terapeuta_designado?.nome || 'o Terapeuta'}!`
    );
    setGuiaParaImprimir(data);
    return true;
  };

  const handleSalvarTerapeuta = async (dados: CreateTerapeutaDTO): Promise<boolean> => {
    const { error } = await criarTerapeuta(dados);
    if (error) {
      exibirFeedback('erro', error);
      return false;
    }
    exibirFeedback('sucesso', `Terapeuta ${dados.nome} cadastrado com sucesso!`);
    await carregarTudo();
    return true;
  };

  const getBadgeStatusGuia = (status: GuiaTissRecord['status_guia']) => {
    switch (status) {
      case 'enviada_terapeuta':
        return {
          classe: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Enviada ao Terapeuta',
        };
      case 'em_preenchimento':
        return {
          classe: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Em Preenchimento pelo Terapeuta',
        };
      case 'enviada_faturamento':
        return {
          classe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Pronta p/ Faturamento',
        };
      default:
        return {
          classe: 'bg-ink-100 text-ink-700 border-ink-200',
          label: status,
        };
    }
  };

  return (
    <div id="view-autorizacoes" className="view-section fade-in max-w-7xl mx-auto w-full pb-10">
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

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
              Autorizações & Emissão de Guias TISS
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                fonteDados === 'supabase'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  fonteDados === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
              {fonteDados === 'supabase' ? 'Supabase Conectado' : 'Modo Local (SQL Fase 2 Pronto)'}
            </span>
          </div>
          <p className="text-sm text-ink-400 mt-1">
            Cadastre as senhas autorizadas pelo plano, gere as Guias SP/SADT com Campo 4 preenchido e envie aos terapeutas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setModalNovoTerapeutaOpen(true)}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center gap-2 shadow-card"
          >
            <i className="ph ph-stethoscope text-brand-600 text-lg"></i>
            Novo Terapeuta
          </button>

          <button
            type="button"
            onClick={() => setModalNovaAutOpen(true)}
            className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-soft"
          >
            <i className="ph ph-key text-lg text-brand-300"></i>
            Nova Autorização
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        <div className="action-card bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Senhas Ativas
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {autorizacoes.length}{' '}
              <span className="text-sm font-medium font-sans text-ink-400">autorizações</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-50 text-brand-600">
            <i className="ph ph-key text-xl"></i>
          </div>
        </div>

        <div className="action-card bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Saldo para Emissão
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {saldoTotalSessoes}{' '}
              <span className="text-sm font-medium font-sans text-ink-400">sessões livres</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
            <i className="ph ph-calendar-plus text-xl"></i>
          </div>
        </div>

        <div className="action-card bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Guias SP/SADT Geradas
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {guias.length}{' '}
              <span className="text-sm font-medium font-sans text-emerald-600">
                ({guiasEnviadasFaturamento} p/ faturar)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold-500/10 text-gold-600">
            <i className="ph ph-file-text text-xl"></i>
          </div>
        </div>

        <Link
          to="/portal-terapeuta"
          className="action-card cursor-pointer p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between bg-gradient-to-br from-brand-900 to-ink-900 text-white"
        >
          <div>
            <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">
              Fluxo Clínico
            </p>
            <p className="text-sm font-medium mt-1 leading-snug">
              Abrir Portal do
              <br />
              Terapeuta (Assinaturas)
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
            <i className="ph ph-arrow-right text-xl"></i>
          </div>
        </Link>
      </div>

      {/* Tabs + Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 bg-white border border-ink-100 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setAbaAtiva('autorizacoes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              abaAtiva === 'autorizacoes'
                ? 'bg-ink-900 text-white shadow-xs'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <i className="ph ph-key"></i>
            Autorizações Concedidas
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                abaAtiva === 'autorizacoes'
                  ? 'bg-white/20 text-white'
                  : 'bg-ink-100 text-ink-600'
              }`}
            >
              {autorizacoes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('guias')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              abaAtiva === 'guias'
                ? 'bg-ink-900 text-white shadow-xs'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <i className="ph ph-files"></i>
            Guias TISS Emitidas (SP/SADT)
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                abaAtiva === 'guias' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
              }`}
            >
              {guias.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar paciente, senha ou termo TUSS..."
              className="filter-input w-full !pl-10"
            />
          </div>

          <select
            value={filtroTerapeutaId}
            onChange={e => setFiltroTerapeutaId(e.target.value)}
            className="filter-input text-ink-600 pr-8"
          >
            <option value="">Todos os Terapeutas</option>
            {terapeutas.map(t => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ABA 1: TABELA DE AUTORIZAÇÕES */}
      {abaAtiva === 'autorizacoes' ? (
        <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-600">
              <thead>
                <tr className="bg-ink-50/50 border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-medium">Paciente / Convênio & TISS</th>
                  <th className="py-4 px-5 font-medium">Nº Autorização & Termo TUSS</th>
                  <th className="py-4 px-5 font-medium">Vigência (Campo 4 = Início)</th>
                  <th className="py-4 px-5 font-medium">Sessões & Freq. Semanal</th>
                  <th className="py-4 px-5 font-medium">Terapeuta Designado</th>
                  <th className="py-4 px-6 font-medium text-right">Emissão de Guia TISS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-400">
                      <i className="ph ph-spinner animate-spin text-2xl mb-2 inline-block"></i>
                      <p>Carregando autorizações...</p>
                    </td>
                  </tr>
                ) : autorizacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-400">
                      <p className="font-medium text-ink-600">Nenhuma autorização encontrada</p>
                    </td>
                  </tr>
                ) : (
                  autorizacoesFiltradas.map(aut => {
                    const operadora = aut.paciente?.plano?.operadora;
                    const emitidas = aut.sessoes_emitidas ?? 0;
                    const realizadas = aut.sessoes_realizadas ?? 0;
                    const saldo = aut.saldo_disponivel ?? aut.quantidade_total_sessoes;
                    const percentual = Math.min(
                      100,
                      Math.round((emitidas / aut.quantidade_total_sessoes) * 100)
                    );
                    const ultimaGuia = aut.guias?.[0];

                    return (
                      <tr key={aut.id} className="hover:bg-ink-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-ink-900">{aut.paciente?.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-ink-500">
                              {operadora?.nome} • {aut.paciente?.plano?.nome_plano}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-100">
                              TISS {operadora?.versao_tiss || '4.03.00'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-100">
                            {aut.numero_autorizacao}
                          </span>
                          <p className="text-xs font-medium text-ink-800 mt-1.5">
                            <strong className="font-mono">{aut.codigo_tuss}</strong> —{' '}
                            {aut.descricao_termo}
                          </p>
                        </td>

                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50/70 border border-brand-200 text-xs font-mono font-bold text-brand-900">
                            <span className="text-[10px] uppercase font-sans font-bold text-brand-700">
                              Campo 4:
                            </span>
                            {formatarDataBr(aut.data_inicio)}
                          </div>
                          <p className="text-xs text-ink-400 mt-1">
                            Até: <strong className="text-ink-700">{formatarDataBr(aut.data_fim)}</strong>
                          </p>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-ink-800">
                              {emitidas}/{aut.quantidade_total_sessoes} emitidas ({realizadas}{' '}
                              realizadas)
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink-100 text-ink-700">
                              {aut.quantidade_sessoes_semanais}x / sem
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-600 rounded-full transition-all"
                              style={{ width: `${percentual}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-ink-400 mt-1 block">
                            Saldo p/ novas guias: <strong>{saldo} sessões</strong>
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <p className="font-semibold text-ink-900">{aut.terapeuta?.nome}</p>
                          <p className="text-xs text-ink-400 font-mono">
                            {aut.terapeuta?.conselho} {aut.terapeuta?.numero_conselho}/
                            {aut.terapeuta?.uf_conselho}
                          </p>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {ultimaGuia && (
                              <button
                                type="button"
                                onClick={() => setGuiaParaImprimir(ultimaGuia)}
                                className="p-2 text-ink-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-ink-200 transition-colors"
                                title="Imprimir / Visualizar última Guia SP/SADT emitida"
                              >
                                <i className="ph ph-printer text-lg"></i>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={saldo <= 0}
                              onClick={() => setAutParaEmitirGuia(aut)}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-ink-900 hover:bg-ink-800 disabled:opacity-40 text-white transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              <i className="ph ph-file-plus text-brand-300 text-base"></i>
                              Gerar Guia TISS
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
        </div>
      ) : (
        /* ABA 2: TABELA DE GUIAS TISS SP/SADT EMITIDAS */
        <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-600">
              <thead>
                <tr className="bg-ink-50/50 border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-medium">Nº Guia / Versão TISS</th>
                  <th className="py-4 px-5 font-medium">Paciente & Carteirinha</th>
                  <th className="py-4 px-5 font-medium">Campo 4 (Data Autorização) & Senha</th>
                  <th className="py-4 px-5 font-medium">Terapeuta Designado</th>
                  <th className="py-4 px-5 font-medium">Datas Preenchidas / Assinatura</th>
                  <th className="py-4 px-5 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {guiasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-400">
                      Nenhuma Guia TISS SP/SADT emitida até o momento.
                    </td>
                  </tr>
                ) : (
                  guiasFiltradas.map(g => {
                    const badge = getBadgeStatusGuia(g.status_guia);
                    const qtdPreenchidas = g.sessoes?.length || 0;

                    return (
                      <tr key={g.id} className="hover:bg-ink-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-mono font-bold text-ink-900">
                            #{g.numero_guia_prestador}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-100">
                            {g.paciente?.plano?.operadora?.nome || 'CONVÊNIO'} • TISS {g.versao_tiss}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <p className="font-semibold text-ink-900">{g.paciente?.nome}</p>
                          <p className="text-xs font-mono text-ink-400">
                            Cart.: {g.paciente?.carteira_plano}
                          </p>
                        </td>

                        <td className="py-4 px-5">
                          <p className="text-xs font-mono font-bold text-brand-800">
                            4 - Data Aut.: {formatarDataBr(g.data_autorizacao_campo4)}
                          </p>
                          <p className="text-xs font-mono text-ink-500 mt-0.5">
                            Senha: {g.numero_senha} • Termo: {g.codigo_tuss}
                          </p>
                        </td>

                        <td className="py-4 px-5">
                          <p className="font-medium text-ink-900">{g.terapeuta_designado?.nome}</p>
                          <p className="text-xs text-ink-400">
                            {g.terapeuta_designado?.especialidade}
                          </p>
                        </td>

                        <td className="py-4 px-5">
                          <p className="text-xs font-semibold text-ink-800">
                            {qtdPreenchidas} / {g.qtd_sessoes_previstas} datas lançadas
                          </p>
                          <p className="text-xs mt-0.5">
                            {g.assinatura_paciente_base64 ? (
                              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                                <i className="ph-fill ph-check-circle"></i> Assinada ({g.nome_assinante})
                              </span>
                            ) : (
                              <span className="text-amber-600 inline-flex items-center gap-1">
                                <i className="ph ph-clock"></i> Aguardando assinatura
                              </span>
                            )}
                          </p>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.classe}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setGuiaParaImprimir(g)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors inline-flex items-center gap-1.5"
                          >
                            <i className="ph ph-printer text-sm"></i> Espelho ANS / PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      <ModalCadastroAutorizacao
        isOpen={isModalNovaAutOpen}
        pacientes={pacientes}
        terapeutas={terapeutas}
        procedimentosTuss={procedimentosTuss}
        onClose={() => setModalNovaAutOpen(false)}
        onSalvar={handleSalvarAutorizacao}
        onAbrirCadastroTerapeuta={() => setModalNovoTerapeutaOpen(true)}
      />

      <ModalCadastroTerapeuta
        isOpen={isModalNovoTerapeutaOpen}
        onClose={() => setModalNovoTerapeutaOpen(false)}
        onSalvar={handleSalvarTerapeuta}
      />

      <ModalEmitirGuiaSpSadt
        autorizacao={autParaEmitirGuia}
        onClose={() => setAutParaEmitirGuia(null)}
        onEmitir={handleEmitirGuia}
      />

      <ModalGuiaSpSadtPrint
        guia={guiaParaImprimir}
        onClose={() => setGuiaParaImprimir(null)}
      />
    </div>
  );
}

