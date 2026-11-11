import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [avisoSemSessoes, setAvisoSemSessoes] = useState<AutorizacaoRecord | null>(null);

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
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && avisoSemSessoes) {
        setAvisoSemSessoes(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [avisoSemSessoes]);

  const handleCliqueImprimirAutorizacao = (aut: AutorizacaoRecord) => {
    const realizadas = aut.sessoes_realizadas ?? 0;
    const ultimaGuia = aut.guias?.[0];

    if (!ultimaGuia || realizadas === 0 || (ultimaGuia.sessoes?.length || 0) === 0) {
      setAvisoSemSessoes(aut);
      return;
    }

    setGuiaParaImprimir(ultimaGuia);
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5 sm:mb-7">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold font-heading text-ink-900 tracking-tight leading-tight">
              Autorizações & Emissão de Guias TISS
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Cadastre as senhas autorizadas pelo plano, gere as Guias SP/SADT com Campo 4 preenchido e envie aos terapeutas.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setModalNovoTerapeutaOpen(true)}
            className="h-10 px-2 sm:px-5 rounded-full text-[11px] sm:text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center justify-center gap-1 sm:gap-2 shadow-card cursor-pointer whitespace-nowrap"
          >
            <i className="ph ph-stethoscope text-brand-600 text-sm sm:text-lg shrink-0"></i>
            <span>Novo Terapeuta</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovaAutOpen(true)}
            className="h-10 px-2 sm:px-6 bg-ink-900 hover:bg-ink-800 text-white font-semibold rounded-full transition-all text-[11px] sm:text-sm flex items-center justify-center gap-1 sm:gap-2 shadow-soft cursor-pointer whitespace-nowrap"
          >
            <i className="ph ph-key text-sm sm:text-lg text-brand-300 shrink-0"></i>
            <span>Nova Autorização</span>
          </button>
        </div>
      </div>

      {/* KPIs (Grid 2x2 no celular, 4 colunas no desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 mb-5 sm:mb-7">
        {/* Card 1: Senhas Ativas */}
        <div className="action-card bg-white p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider leading-tight">
              Senhas Ativas
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-brand-50 text-brand-600 shrink-0">
              <i className="ph ph-key text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold font-heading text-ink-900 leading-none">
                {autorizacoes.length}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-ink-500">
                autorizações
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Saldo para Emissão */}
        <div className="action-card bg-white p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider leading-tight">
              Saldo p/ Emissão
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
              <i className="ph ph-calendar-plus text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold font-heading text-ink-900 leading-none">
                {saldoTotalSessoes}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-ink-500">
                sessões livres
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Guias SP/SADT */}
        <div className="action-card bg-white p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider leading-tight">
              Guias SP/SADT
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
              <i className="ph ph-file-text text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold font-heading text-ink-900 leading-none">
                {guias.length}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-600">
                ({guiasEnviadasFaturamento} p/ faturar)
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Fluxo Clínico */}
        <Link
          to="/portal-terapeuta"
          className="action-card cursor-pointer p-3 sm:p-5 rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between bg-gradient-to-br from-brand-900 to-ink-900 text-white group"
        >
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-brand-200 uppercase tracking-wider leading-tight">
              Fluxo Clínico
            </span>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 shrink-0 group-hover:bg-white/20 transition-colors">
              <i className="ph ph-arrow-right text-xs sm:text-lg"></i>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white leading-tight">
              Portal Terapeuta
            </p>
            <p className="text-[10px] sm:text-xs text-brand-300 font-medium leading-tight mt-0.5">
              Assinaturas
            </p>
          </div>
        </Link>
      </div>

      {/* Tabs + Filtros Responsivos */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 p-1 bg-white border border-ink-100 rounded-xl w-full sm:w-fit shadow-xs">
          <button
            type="button"
            onClick={() => setAbaAtiva('autorizacoes')}
            className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              abaAtiva === 'autorizacoes'
                ? 'bg-ink-900 text-white shadow-xs'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <i className="ph ph-key shrink-0 text-xs sm:text-sm"></i>
            <span className="whitespace-nowrap">Autorizações</span>
            <span className="hidden sm:inline">Concedidas</span>
            <span
              className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
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
            className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              abaAtiva === 'guias'
                ? 'bg-ink-900 text-white shadow-xs'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <i className="ph ph-files shrink-0 text-xs sm:text-sm"></i>
            <span className="whitespace-nowrap">Guias TISS</span>
            <span className="hidden sm:inline">(SP/SADT)</span>
            <span
              className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                abaAtiva === 'guias' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
              }`}
            >
              {guias.length}
            </span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:flex-1 lg:w-72">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar paciente, senha ou termo TUSS..."
              className="filter-input w-full !pl-10 !pr-8"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-1 cursor-pointer"
              >
                <i className="ph ph-x text-xs"></i>
              </button>
            )}
          </div>

          <select
            value={filtroTerapeutaId}
            onChange={e => setFiltroTerapeutaId(e.target.value)}
            className="filter-input text-ink-600 pr-8 w-full sm:w-auto"
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

      {/* ABA 1: AUTORIZAÇÕES CONCEDIDAS */}
      {abaAtiva === 'autorizacoes' ? (
        <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 overflow-hidden">
          {/* VISUALIZAÇÃO MOBILE & TABLET (< lg): Cards de Autorização */}
          <div className="lg:hidden p-3.5 sm:p-5">
            {loading ? (
              <div className="py-12 text-center text-ink-400">
                <i className="ph ph-spinner animate-spin text-2xl mb-2 inline-block"></i>
                <p className="text-sm">Carregando autorizações...</p>
              </div>
            ) : autorizacoesFiltradas.length === 0 ? (
              <div className="py-10 text-center text-ink-400">
                <i className="ph ph-key text-3xl mb-2 inline-block text-ink-300"></i>
                <p className="font-medium text-ink-600 text-sm">Nenhuma autorização encontrada</p>
                <p className="text-xs mt-1">Cadastre uma nova autorização ou ajuste os filtros acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {autorizacoesFiltradas.map(aut => {
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
                    <div
                      key={aut.id}
                      className="rounded-2xl border border-ink-100 bg-white p-4 shadow-xs hover:border-brand-200 transition-all flex flex-col justify-between gap-3.5"
                    >
                      {/* Topo do Card: Paciente, Operadora e Versão TISS */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 text-sm leading-snug truncate">
                            {aut.paciente?.nome || 'Paciente'}
                          </p>
                          <p className="text-xs text-ink-500 mt-0.5 truncate">
                            {operadora?.nome || 'Convênio'} • {aut.paciente?.plano?.nome_plano || 'Plano'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                          TISS {operadora?.versao_tiss || '4.03.00'}
                        </span>
                      </div>

                      {/* Bloco Central: Senha, TUSS e Vigência (Campo 4) */}
                      <div className="p-3 rounded-xl bg-ink-50/70 border border-ink-100 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-ink-400 uppercase">
                              Senha:
                            </span>
                            <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/80">
                              {aut.numero_autorizacao}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-brand-200 text-[11px] font-mono font-semibold text-brand-900">
                            <span className="text-[9px] uppercase font-sans font-bold text-brand-700">
                              Campo 4:
                            </span>
                            {formatarDataBr(aut.data_inicio)}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-ink-200/60">
                          <p className="text-xs font-medium text-ink-800 leading-snug">
                            <strong className="font-mono text-brand-800">{aut.codigo_tuss}</strong> —{' '}
                            {aut.descricao_termo}
                          </p>
                          <p className="text-[11px] text-ink-400 mt-1">
                            Vigência até:{' '}
                            <strong className="text-ink-700">{formatarDataBr(aut.data_fim)}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso de Sessões */}
                      <div className="space-y-1.5 px-0.5">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold text-ink-800">
                            {emitidas}/{aut.quantidade_total_sessoes} emitidas ({realizadas} realizadas)
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink-100 text-ink-700 shrink-0">
                            {aut.quantidade_sessoes_semanais}x / sem
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full transition-all"
                            style={{ width: `${percentual}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-ink-500">
                            Saldo p/ novas guias: <strong className="text-ink-900 font-bold">{saldo} sessões</strong>
                          </span>
                          <span className="text-ink-400 text-[10px] font-medium">
                            {percentual}% emitido
                          </span>
                        </div>
                      </div>

                      {/* Bloco do Terapeuta: Nome acima, Código/Conselho abaixo para telas menores */}
                      <div className="p-3 rounded-xl bg-ink-50/70 border border-ink-100">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            <i className="ph ph-stethoscope text-xs"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] uppercase font-bold text-ink-400 tracking-wider block leading-none mb-1">
                              Terapeuta Designado
                            </span>
                            {/* Nome da Terapeuta ACIMA (largura total) */}
                            <p className="text-xs sm:text-sm font-bold text-ink-900 break-words leading-tight">
                              {aut.terapeuta?.nome || 'Não designado'}
                            </p>

                            {/* Código do Conselho (CRFa/CRP) e Especialidade ABAIXO */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1.5">
                              {aut.terapeuta?.numero_conselho && (
                                <span className="font-mono text-[10px] font-bold text-brand-900 bg-white border border-brand-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                                  {aut.terapeuta.conselho} {aut.terapeuta.numero_conselho}/{aut.terapeuta.uf_conselho}
                                </span>
                              )}
                              {aut.terapeuta?.especialidade && (
                                <span className="text-[10px] text-ink-500 font-medium">
                                  {aut.terapeuta.especialidade}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé: Botões de Ação com largura total e área de toque confortável */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCliqueImprimirAutorizacao(aut)}
                          className={`h-11 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                            realizadas > 0 && ultimaGuia
                              ? 'bg-white border-ink-200 text-ink-700 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-300 shadow-xs'
                              : 'bg-ink-50/80 border-ink-200/80 text-ink-400 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                          }`}
                          title={
                            realizadas > 0 && ultimaGuia
                              ? 'Imprimir Guia SP/SADT'
                              : 'Sem sessões registradas para impressão'
                          }
                        >
                          <i className="ph ph-printer text-lg"></i>
                          <span className="text-xs font-semibold hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                          type="button"
                          disabled={saldo <= 0}
                          onClick={() => setAutParaEmitirGuia(aut)}
                          className="flex-1 h-11 px-4 rounded-xl text-xs font-bold bg-ink-900 hover:bg-ink-800 disabled:opacity-40 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <i className="ph ph-file-plus text-brand-300 text-base shrink-0"></i>
                          <span>Gerar Guia TISS</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VISUALIZAÇÃO DESKTOP (>= lg): Tabela Completa */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-600">
              <thead>
                <tr className="bg-ink-50/50 border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-medium">Paciente / Convênio & TISS</th>
                  <th className="py-4 px-5 font-medium">Nº Autorização & Termo TUSS</th>
                  <th className="py-4 px-5 font-medium">Vigência (Campo 4 = Início)</th>
                  <th className="py-4 px-5 font-medium">Sessões & Freq. Semanal</th>
                  <th className="py-4 px-5 font-medium">Terapeuta Designado</th>
                  <th className="py-4 px-6 font-medium text-right whitespace-nowrap min-w-[210px] w-[210px]">
                    Emissão de Guia TISS
                  </th>
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

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleCliqueImprimirAutorizacao(aut)}
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                realizadas > 0 && ultimaGuia
                                  ? 'bg-white border-ink-200 text-ink-700 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-300 shadow-xs'
                                  : 'bg-ink-50/80 border-ink-200/80 text-ink-400 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                              }`}
                              title={
                                realizadas > 0 && ultimaGuia
                                  ? 'Imprimir / Visualizar Guia SP/SADT'
                                  : 'Sem sessões registradas para impressão (clique para ver detalhes)'
                              }
                            >
                              <i className="ph ph-printer text-lg"></i>
                            </button>
                            <button
                              type="button"
                              disabled={saldo <= 0}
                              onClick={() => setAutParaEmitirGuia(aut)}
                              className="h-10 px-4 rounded-xl text-xs font-semibold bg-ink-900 hover:bg-ink-800 disabled:opacity-40 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                            >
                              <i className="ph ph-file-plus text-brand-300 text-base shrink-0"></i>
                              <span>Gerar Guia TISS</span>
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
        /* ABA 2: GUIAS TISS SP/SADT EMITIDAS */
        <div className="bg-white rounded-[20px] shadow-card border border-ink-100/50 overflow-hidden">
          {/* VISUALIZAÇÃO MOBILE & TABLET (< lg): Cards de Guias SP/SADT */}
          <div className="lg:hidden p-3.5 sm:p-5">
            {guiasFiltradas.length === 0 ? (
              <div className="py-10 text-center text-ink-400">
                <i className="ph ph-files text-3xl mb-2 inline-block text-ink-300"></i>
                <p className="font-medium text-ink-600 text-sm">
                  Nenhuma Guia TISS SP/SADT emitida até o momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {guiasFiltradas.map(g => {
                  const badge = getBadgeStatusGuia(g.status_guia);
                  const qtdPreenchidas = g.sessoes?.length || 0;

                  return (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-ink-100 bg-white p-4 shadow-xs hover:border-brand-200 transition-all flex flex-col justify-between gap-3.5"
                    >
                      {/* Cabeçalho do Card da Guia */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-ink-900 text-sm">
                              #{g.numero_guia_prestador}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
                              {g.paciente?.plano?.operadora?.nome || 'CONVÊNIO'} • TISS {g.versao_tiss}
                            </span>
                          </div>
                          <p className="font-semibold text-ink-900 text-sm mt-1.5">
                            {g.paciente?.nome}
                          </p>
                          <p className="text-xs font-mono text-ink-400">
                            Carteirinha: {g.paciente?.carteira_plano}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0 ${badge.classe}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Bloco TISS: Campo 4, Senha e Termo TUSS */}
                      <div className="p-3 rounded-xl bg-ink-50/70 border border-ink-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                          <span className="font-mono font-bold text-brand-800">
                            Campo 4 (Aut.): {formatarDataBr(g.data_autorizacao_campo4)}
                          </span>
                          <span className="font-mono text-ink-600 text-[11px]">
                            Senha: <strong>{g.numero_senha}</strong>
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-ink-500 pt-1 border-t border-ink-200/60">
                          Procedimento TUSS: <strong className="text-ink-800">{g.codigo_tuss}</strong>
                        </p>
                      </div>

                      {/* Terapeuta & Progresso de Assinatura/Sessões */}
                      <div className="flex items-center justify-between gap-2 text-xs px-0.5">
                        <div className="min-w-0">
                          <p className="text-[10px] text-ink-400 uppercase font-semibold">Terapeuta</p>
                          <p className="font-semibold text-ink-900 break-words leading-snug">
                            {g.terapeuta_designado?.nome}
                          </p>
                          <p className="text-[11px] text-ink-400">
                            {g.terapeuta_designado?.especialidade}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-semibold text-ink-800">
                            {qtdPreenchidas} / {g.qtd_sessoes_previstas} datas
                          </p>
                          <p className="text-[11px] mt-0.5">
                            {g.assinatura_paciente_base64 ? (
                              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                                <i className="ph-fill ph-check-circle"></i> Assinada
                              </span>
                            ) : (
                              <span className="text-amber-600 inline-flex items-center gap-1">
                                <i className="ph ph-clock"></i> Pendente
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Rodapé de Ação */}
                      <div className="pt-2.5 border-t border-ink-100">
                        <button
                          type="button"
                          onClick={() => setGuiaParaImprimir(g)}
                          className="w-full py-2 px-3.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <i className="ph ph-printer text-sm"></i> Visualizar Espelho ANS / PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VISUALIZAÇÃO DESKTOP (>= lg): Tabela Completa */}
          <div className="hidden lg:block overflow-x-auto">
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
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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

      {/* Pop-up Elegante: Aviso de Ausência de Sessões para Impressão */}
      {avisoSemSessoes &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm fade-in"
            onClick={() => setAvisoSemSessoes(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-ink-100 max-w-sm sm:max-w-md w-full space-y-4 scale-in relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-xs">
                <i className="ph ph-printer text-2xl"></i>
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-bold font-heading text-lg text-ink-900">
                  Impressão Indisponível
                </h3>
                <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
                  Não é possível imprimir a Guia TISS SP/SADT da autorização{' '}
                  <strong className="font-mono text-ink-800 font-bold">
                    {avisoSemSessoes.numero_autorizacao}
                  </strong>{' '}
                  pois ainda não há sessões registradas pelo terapeuta.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAvisoSemSessoes(null)}
                  className="w-full h-11 rounded-xl bg-ink-900 hover:bg-ink-800 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-soft flex items-center justify-center"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

