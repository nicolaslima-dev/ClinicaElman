import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AutorizacaoRecord,
  GuiaTissRecord,
  LoteFaturamentoRecord,
  OperadoraRecord,
  PacienteRecord,
  ProcedimentoTussRecord,
  TerapeutaRecord,
} from '@/features/admin/types';
import {
  listarAutorizacoes,
  listarGuiasTiss,
  listarProcedimentosTuss,
  listarTerapeutas,
} from '../api/autorizacoes.service';
import { listarOperadorasComPlanos } from '../api/convenios.service';
import { listarPacientes } from '../api/pacientes.service';
import { listarLotesFaturamento } from '../api/faturamento.service';
import { formatarDataBr } from '../utils/pacienteValidators';
import { ModalDigitacaoGuiaFaturamento } from '../components/faturamento/ModalDigitacaoGuiaFaturamento';
import { ModalTabelaPrecosOperadora } from '../components/faturamento/ModalTabelaPrecosOperadora';
import { FaturamentoModalGeracao } from '../components/faturamento/FaturamentoModalGeracao';
import { ModalGuiaSpSadtPrint } from '../components/autorizacoes/ModalGuiaSpSadtPrint';

export function AdminFaturamentoPage() {
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'fila_guias' | 'lotes'>('fila_guias');

  const [pacientes, setPacientes] = useState<PacienteRecord[]>([]);
  const [operadoras, setOperadoras] = useState<OperadoraRecord[]>([]);
  const [autorizacoes, setAutorizacoes] = useState<AutorizacaoRecord[]>([]);
  const [terapeutas, setTerapeutas] = useState<TerapeutaRecord[]>([]);
  const [procedimentosTuss, setProcedimentosTuss] = useState<ProcedimentoTussRecord[]>([]);
  const [guias, setGuias] = useState<GuiaTissRecord[]>([]);
  const [lotes, setLotes] = useState<LoteFaturamentoRecord[]>([]);

  // Filtros
  const [filtroOperadora, setFiltroOperadora] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [loteExpandidoId, setLoteExpandidoId] = useState<string | null>(null);

  // Modais
  const [isModalDigitacaoOpen, setIsModalDigitacaoOpen] = useState(false);
  const [guiaSelecionadaParaDigitar, setGuiaSelecionadaParaDigitar] =
    useState<GuiaTissRecord | null>(null);
  const [isModalPrecosOpen, setIsModalPrecosOpen] = useState(false);
  const [isModalXmlOpen, setIsModalXmlOpen] = useState(false);
  const [loteParaXml, setLoteParaXml] = useState<LoteFaturamentoRecord | null>(
    null
  );
  const [guiaImpressao, setGuiaImpressao] = useState<GuiaTissRecord | null>(null);
  const [bannerSucesso, setBannerSucesso] = useState<string | null>(null);

  const carregarDadosFaturamento = useCallback(async () => {
    setLoading(true);
    const [
      resPacientes,
      resOperadoras,
      resAutorizacoes,
      resTerapeutas,
      resProcedimentos,
      resGuias,
      resLotes,
    ] = await Promise.all([
      listarPacientes(),
      listarOperadorasComPlanos(),
      listarAutorizacoes(),
      listarTerapeutas(),
      listarProcedimentosTuss(),
      listarGuiasTiss(),
      listarLotesFaturamento(),
    ]);

    setPacientes(resPacientes.data);
    setOperadoras(resOperadoras.data);
    setAutorizacoes(resAutorizacoes.data);
    setTerapeutas(resTerapeutas.data);
    setProcedimentosTuss(resProcedimentos.data);
    setGuias(resGuias.data);
    setLotes(resLotes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarDadosFaturamento();
  }, [carregarDadosFaturamento]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const aguardandoRecebimento = guias.filter(
      (g) => g.status_guia === 'enviada_faturamento'
    ).length;
    const digitadasEmLote = guias.filter(
      (g) =>
        g.status_guia === 'em_lote' ||
        g.status_guia === 'retida_auditoria' ||
        g.status_guia === 'validada_lote' ||
        g.status_guia === 'faturada_xml'
    ).length;
    const totalLotes = lotes.length;
    const valorConsolidadoLotes = lotes.reduce(
      (acc, l) => acc + (Number(l.valor_total_lote) || 0),
      0
    );

    return {
      aguardandoRecebimento,
      digitadasEmLote,
      totalLotes,
      valorConsolidadoLotes,
    };
  }, [guias, lotes]);

  const guiasFiltradas = useMemo(() => {
    return guias.filter((g) => {
      if (filtroStatus === 'recebidas_terapeuta' && g.status_guia !== 'enviada_faturamento') {
        return false;
      }
      if (
        filtroStatus === 'em_lote' &&
        g.status_guia !== 'em_lote' &&
        g.status_guia !== 'retida_auditoria' &&
        g.status_guia !== 'validada_lote' &&
        g.status_guia !== 'faturada_xml'
      ) {
        return false;
      }
      if (filtroOperadora) {
        const nomeOp = g.plano?.operadora?.nome || '';
        const idOp = g.plano?.operadora_id || g.plano?.operadora?.id || '';
        if (idOp !== filtroOperadora && nomeOp !== filtroOperadora) {
          return false;
        }
      }
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const matchPac = g.paciente?.nome?.toLowerCase().includes(q);
        const matchSenha = g.numero_senha?.toLowerCase().includes(q);
        const matchGuia = g.numero_guia_prestador?.toLowerCase().includes(q);
        const matchLote = g.numero_lote?.toLowerCase().includes(q);
        if (!matchPac && !matchSenha && !matchGuia && !matchLote) {
          return false;
        }
      }
      return true;
    });
  }, [guias, filtroStatus, filtroOperadora, buscaTexto]);

  const lotesFiltrados = useMemo(() => {
    return lotes.filter((l) => {
      if (filtroOperadora && l.operadora_id !== filtroOperadora) {
        return false;
      }
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const matchNumero = l.numero_lote.toLowerCase().includes(q);
        const matchOp = l.operadora?.nome?.toLowerCase().includes(q);
        const matchPac = (l.guias || []).some((g) =>
          g.paciente?.nome?.toLowerCase().includes(q)
        );
        if (!matchNumero && !matchOp && !matchPac) return false;
      }
      return true;
    });
  }, [lotes, filtroOperadora, buscaTexto]);

  const handleAbrirNovaDigitacao = () => {
    setGuiaSelecionadaParaDigitar(null);
    setIsModalDigitacaoOpen(true);
  };

  const handleReceberGuiaTerapeuta = (guia: GuiaTissRecord) => {
    setGuiaSelecionadaParaDigitar(guia);
    setIsModalDigitacaoOpen(true);
  };

  const handleGuiaDigitadaComSucesso = async (
    guiaSalva: GuiaTissRecord,
    loteSalvo: LoteFaturamentoRecord
  ) => {
    setIsModalDigitacaoOpen(false);
    setGuiaSelecionadaParaDigitar(null);
    setBannerSucesso(
      `Guia #${guiaSalva.numero_guia_prestador} conferida e vinculada com sucesso ao Lote #${loteSalvo.numero_lote} (${
        guiaSalva.sessoes?.length || guiaSalva.qtd_sessoes_previstas
      } sessões — R$ ${Number(guiaSalva.valor_total_guia || 0)
        .toFixed(2)
        .replace('.', ',')})!`
    );
    await carregarDadosFaturamento();
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'enviada_faturamento') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          Recebida do Terapeuta
        </span>
      );
    }
    if (status === 'retida_auditoria') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          Retida em Auditoria
        </span>
      );
    }
    if (status === 'faturada_xml') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <i className="ph ph-file-code"></i>
          XML TISS Gerado
        </span>
      );
    }
    if (status === 'validada_lote') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Validada (Apta XML)
        </span>
      );
    }
    if (status === 'em_lote') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
          Digitada no Lote
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-ink-100 text-ink-600">
        No Portal Terapeuta
      </span>
    );
  };

  return (
    <div
      id="view-faturamento"
      className="view-section fade-in w-full min-w-0 max-w-7xl mx-auto flex flex-col h-full min-h-[700px] space-y-4 sm:space-y-6 pb-10"
    >
      {/* Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 print:hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
            <i className="ph ph-receipt"></i>
            Setor de Faturamento TISS — Fase 3
          </span>
          <h1 className="text-2xl sm:text-[28px] font-semibold font-heading text-ink-900 tracking-tight leading-tight">
            Recebimento, Digitação de Guias e Gestão de Lotes
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-1 max-w-3xl">
            Confira as guias recebidas dos terapeutas ou digite novas guias validando saldo da autorização, periodicidade semanal ISO e vínculo ao lote.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsModalPrecosOpen(true)}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <i className="ph ph-currency-circle-dollar text-base text-brand-600"></i>
            Tabela TUSS & Contratos
          </button>

          <button
            type="button"
            onClick={() => {
              setLoteParaXml(null);
              setIsModalXmlOpen(true);
            }}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-brand-800 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <i className="ph ph-file-code text-base text-brand-600"></i>
            Exportar XML TISS
          </button>

          <button
            type="button"
            onClick={handleAbrirNovaDigitacao}
            className="bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 px-5 rounded-full transition-all text-xs flex items-center justify-center gap-2 shadow-soft cursor-pointer w-full sm:w-auto"
          >
            <i className="ph ph-plus-circle text-base text-brand-300"></i>
            Digitar Guia de Atendimento
          </button>
        </div>
      </div>

      {bannerSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <i className="ph ph-check-circle-fill text-lg text-emerald-600 shrink-0"></i>
            <span>{bannerSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerSucesso(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer self-end sm:self-auto"
          >
            ✕ Fechar
          </button>
        </div>
      )}

      {/* KPIs da Fase 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 print:hidden">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-ink-400 uppercase tracking-wide truncate">
              Fila de Recebimento
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <i className="ph ph-tray-arrow-down text-sm sm:text-lg"></i>
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold font-heading text-ink-900 mt-1.5 sm:mt-2">
            {kpis.aguardandoRecebimento}
          </p>
          <p className="text-[10px] sm:text-xs text-ink-400 mt-0.5 sm:mt-1 line-clamp-2">
            Guias enviadas pelos terapeutas
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-ink-400 uppercase tracking-wide truncate">
              Guias em Lote
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <i className="ph ph-files text-sm sm:text-lg"></i>
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold font-heading text-ink-900 mt-1.5 sm:mt-2">
            {kpis.digitadasEmLote}
          </p>
          <p className="text-[10px] sm:text-xs text-ink-400 mt-0.5 sm:mt-1 line-clamp-2">
            Conferidas (máx. 10 datas)
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-ink-400 uppercase tracking-wide truncate">
              Lotes Gerados
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <i className="ph ph-folders text-sm sm:text-lg"></i>
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold font-heading text-ink-900 mt-1.5 sm:mt-2">
            {kpis.totalLotes}
          </p>
          <p className="text-[10px] sm:text-xs text-ink-400 mt-0.5 sm:mt-1 line-clamp-2">
            Por Operadora e Versão TISS
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-ink-400 uppercase tracking-wide truncate">
              Total em Lotes
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
              <i className="ph ph-currency-dollar text-sm sm:text-lg"></i>
            </div>
          </div>
          <p className="text-base sm:text-2xl font-bold font-heading text-brand-700 mt-1.5 sm:mt-2 truncate">
            R$ {kpis.valorConsolidadoLotes.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] sm:text-xs text-ink-400 mt-0.5 sm:mt-1 line-clamp-2">
            Calculado conforme tabela
          </p>
        </div>
      </div>

      {/* Abas e Filtros */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-ink-100 shadow-card space-y-4 print:hidden w-full min-w-0">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 sm:gap-4 border-b border-ink-100 pb-4 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto min-w-0">
            <button
              type="button"
              onClick={() => setAbaAtiva('fila_guias')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer truncate ${
                abaAtiva === 'fila_guias'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              <i className="ph ph-list-checks text-base shrink-0"></i>
              <span className="truncate">Recebimento & Digitação ({guias.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('lotes')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer truncate ${
                abaAtiva === 'lotes'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              <i className="ph ph-package text-base shrink-0"></i>
              <span className="truncate">Gestão de Lotes ({lotes.length})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto min-w-0">
            <div className="relative w-full sm:w-64 min-w-0">
              <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm pointer-events-none"></i>
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Buscar paciente, senha, lote..."
                className="w-full min-w-0 max-w-full bg-ink-50 border border-ink-200 rounded-xl py-2 pl-9 pr-8 text-xs text-ink-800 outline-none focus:bg-white focus:border-brand-400"
              />
              {buscaTexto && (
                <button
                  type="button"
                  onClick={() => setBuscaTexto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 p-0.5 cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <i className="ph ph-x text-xs"></i>
                </button>
              )}
            </div>

            <select
              value={filtroOperadora}
              onChange={(e) => setFiltroOperadora(e.target.value)}
              className="w-full sm:w-auto min-w-0 max-w-full bg-ink-50 border border-ink-200 rounded-xl py-2 px-3 text-xs text-ink-700 outline-none focus:bg-white truncate cursor-pointer"
            >
              <option value="">Todas as Operadoras</option>
              {operadoras.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nome} (TISS {op.versao_tiss})
                </option>
              ))}
            </select>

            {abaAtiva === 'fila_guias' && (
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full sm:w-auto min-w-0 max-w-full bg-ink-50 border border-ink-200 rounded-xl py-2 px-3 text-xs text-ink-700 outline-none focus:bg-white truncate cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="recebidas_terapeuta">
                  Recebidas (Aguardando Lote)
                </option>
                <option value="em_lote">Digitadas em Lote</option>
              </select>
            )}
          </div>
        </div>

        {/* CONTEÚDO ABA 1: Fila de Recebimento & Guias Digitadas */}
        {abaAtiva === 'fila_guias' && (
          <>
            {/* Visualização Mobile: Cards estruturados (oculto em telas grandes) */}
            <div className="lg:hidden space-y-3.5 min-w-0">
              {loading ? (
                <div className="p-8 text-center text-ink-400">
                  <i className="ph ph-spinner animate-spin text-2xl mb-2 block"></i>
                  Carregando fila de faturamento...
                </div>
              ) : guiasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-ink-400 border border-dashed border-ink-200 rounded-2xl">
                  <i className="ph ph-magnifying-glass text-2xl mb-2 block text-ink-300"></i>
                  Nenhuma guia encontrada para os filtros selecionados.
                </div>
              ) : (
                guiasFiltradas.map((guia) => {
                  const qtdDatas = guia.sessoes?.length || 0;
                  const vlrUnit =
                    guia.valor_unitario_sessao ||
                    guia.autorizacao?.valor_unitario_sessao ||
                    0;
                  const vlrTotal =
                    guia.valor_total_guia && guia.valor_total_guia > 0
                      ? guia.valor_total_guia
                      : qtdDatas * vlrUnit;

                  return (
                    <div
                      key={guia.id}
                      className="bg-white border border-ink-150 rounded-2xl p-4 shadow-xs space-y-3 hover:border-brand-300 transition-colors w-full min-w-0"
                    >
                      {/* Topo do Card: Paciente e Status */}
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-ink-900 text-sm block truncate">
                            {guia.paciente?.nome || 'Paciente'}
                          </span>
                          <span className="font-mono text-[11px] text-ink-400 block mt-0.5 truncate">
                            Carteira: {guia.paciente?.carteira_plano || '—'}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {renderStatusBadge(guia.status_guia)}
                        </div>
                      </div>

                      {/* Grade de Detalhes da Guia */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-ink-100 text-xs min-w-0">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-ink-400 block">
                            Nº Guia / Senha
                          </span>
                          <span className="font-mono font-bold text-ink-900 block mt-0.5 truncate">
                            #{guia.numero_guia_prestador}
                          </span>
                          <span
                            className="font-mono text-[11px] text-ink-500 block truncate"
                            title={guia.numero_senha}
                          >
                            Senha: {guia.numero_senha}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-ink-400 block">
                            Operadora / TISS
                          </span>
                          <span className="font-bold text-ink-800 block mt-0.5 truncate">
                            {guia.plano?.operadora?.nome || 'Convênio'}
                          </span>
                          <span className="text-[11px] font-mono text-brand-700 block truncate">
                            TISS {guia.versao_tiss}
                          </span>
                        </div>

                        {/* Termo Autorizado */}
                        <div className="col-span-2 bg-ink-50/70 p-2.5 rounded-xl border border-ink-100 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-semibold text-ink-400">
                              Termo Autorizado
                            </span>
                            <span className="font-mono font-bold text-brand-700 text-xs shrink-0">
                              {guia.codigo_tuss}
                            </span>
                          </div>
                          <p className="text-xs text-ink-700 font-medium mt-1 leading-snug break-words">
                            {guia.descricao_termo}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-ink-400 block">
                            Terapeuta
                          </span>
                          <span className="font-medium text-ink-800 block mt-0.5 truncate">
                            {guia.terapeuta_designado?.nome || 'Terapeuta'}
                          </span>
                          <span className="text-[11px] text-ink-400 block truncate">
                            Campo 4: {formatarDataBr(guia.data_autorizacao_campo4)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-ink-400 block">
                            Nº Lote
                          </span>
                          {guia.numero_lote ? (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-lg font-mono font-bold text-xs bg-brand-50 text-brand-700 border border-brand-200 truncate">
                              #{guia.numero_lote}
                            </span>
                          ) : (
                            <span className="text-ink-400 text-xs mt-0.5 block italic truncate">
                              Sem lote vinculado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rodapé: Resumo de Datas e Valor Total */}
                      <div className="pt-2.5 border-t border-ink-100 flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-ink-100 text-ink-800 shrink-0 whitespace-nowrap"
                            title="Datas registradas na guia"
                          >
                            <i className="ph ph-calendar-check text-ink-500"></i>
                            {qtdDatas}/10 datas
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-semibold text-ink-400 block leading-tight">
                            Valor Total
                          </span>
                          <span className="font-mono font-bold text-sm sm:text-base text-emerald-700 whitespace-nowrap">
                            {vlrTotal > 0
                              ? `R$ ${Number(vlrTotal).toFixed(2).replace('.', ',')}`
                              : 'A calcular'}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Ações: Botões Perfeitamente Dimensionados para Telas Menores */}
                      <div className="grid grid-cols-[auto_1fr] gap-2 pt-1 w-full min-w-0">
                        <button
                          type="button"
                          onClick={() => setGuiaImpressao(guia)}
                          title="Visualizar Espelho Oficial Guia SP/SADT"
                          className="h-10 px-3.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 active:bg-ink-100 text-ink-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          aria-label="Imprimir Espelho Guia SP/SADT"
                        >
                          <i className="ph ph-printer text-base"></i>
                          <span className="text-xs">Espelho</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReceberGuiaTerapeuta(guia)}
                          className="h-10 px-4 rounded-xl bg-ink-900 hover:bg-ink-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all min-w-0"
                        >
                          <i className="ph ph-check-square-offset text-base text-brand-300 shrink-0"></i>
                          <span className="truncate">
                            {guia.numero_lote ? 'Editar Lote/Datas' : 'Conferir & Lote'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Visualização Desktop: Tabela de 10 colunas tradicional (oculto em mobile) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-ink-700">
                <thead>
                  <tr className="bg-ink-50/60 border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
                    <th className="p-3.5">Nº Guia / Senha</th>
                    <th className="p-3.5">Paciente & Carteira</th>
                    <th className="p-3.5">Operadora / TISS</th>
                    <th className="p-3.5">Termo Autorizado</th>
                    <th className="p-3.5">Terapeuta</th>
                    <th className="p-3.5 text-center">Datas (Máx 10)</th>
                    <th className="p-3.5 text-center">Nº Lote</th>
                    <th className="p-3.5 text-right">Valor Guia</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-ink-400">
                        Carregando fila de faturamento...
                      </td>
                    </tr>
                  ) : guiasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-ink-400">
                        Nenhuma guia encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    guiasFiltradas.map((guia) => {
                      const qtdDatas = guia.sessoes?.length || 0;
                      const vlrUnit =
                        guia.valor_unitario_sessao ||
                        guia.autorizacao?.valor_unitario_sessao ||
                        0;
                      const vlrTotal =
                        guia.valor_total_guia && guia.valor_total_guia > 0
                          ? guia.valor_total_guia
                          : qtdDatas * vlrUnit;

                      return (
                        <tr key={guia.id} className="hover:bg-ink-50/50 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-ink-900 block">
                              #{guia.numero_guia_prestador}
                            </span>
                            <span className="font-mono text-[11px] text-ink-400">
                              Senha: {guia.numero_senha}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-ink-900 block">
                              {guia.paciente?.nome || 'Paciente'}
                            </span>
                            <span className="font-mono text-[11px] text-ink-400">
                              Carteira: {guia.paciente?.carteira_plano || '—'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-ink-800 block">
                              {guia.plano?.operadora?.nome || 'Convênio'}
                            </span>
                            <span className="text-[11px] font-mono text-brand-700">
                              TISS {guia.versao_tiss}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-brand-700">
                              {guia.codigo_tuss}
                            </span>
                            <span className="block text-[11px] text-ink-500 truncate max-w-[180px]">
                              {guia.descricao_termo}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-ink-800 block">
                              {guia.terapeuta_designado?.nome || 'Terapeuta'}
                            </span>
                            <span className="text-[11px] text-ink-400">
                              Campo 4: {formatarDataBr(guia.data_autorizacao_campo4)}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-ink-100 text-ink-800">
                              {qtdDatas} / 10
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {guia.numero_lote ? (
                              <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
                                #{guia.numero_lote}
                              </span>
                            ) : (
                              <span className="text-ink-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-ink-900">
                            {vlrTotal > 0
                              ? `R$ ${Number(vlrTotal).toFixed(2).replace('.', ',')}`
                              : 'A calcular'}
                          </td>
                          <td className="p-3.5">
                            {renderStatusBadge(guia.status_guia)}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReceberGuiaTerapeuta(guia)}
                                className="px-3 py-1.5 rounded-xl bg-ink-900 hover:bg-ink-800 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <i className="ph ph-check-square-offset"></i>
                                {guia.numero_lote ? 'Editar Lote/Datas' : 'Conferir & Lote'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setGuiaImpressao(guia)}
                                title="Visualizar Espelho Oficial Guia SP/SADT"
                                className="p-1.5 rounded-xl border border-ink-200 text-ink-600 hover:bg-ink-50 cursor-pointer"
                              >
                                <i className="ph ph-printer text-sm"></i>
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
          </>
        )}

        {/* CONTEÚDO ABA 2: Gestão de Lotes de Faturamento */}
        {abaAtiva === 'lotes' && (
          <div className="space-y-3">
            {lotesFiltrados.length === 0 ? (
              <div className="p-8 sm:p-10 text-center text-ink-400 border border-dashed border-ink-200 rounded-2xl">
                <i className="ph ph-package text-3xl mb-2 block text-ink-300"></i>
                <p className="text-sm font-semibold text-ink-700">
                  Nenhum lote de faturamento gerado ainda
                </p>
                <p className="text-xs text-ink-400 mt-1 max-w-md mx-auto">
                  Clique em &ldquo;Digitar Guia de Atendimento&rdquo; ou confira uma guia enviada pelo terapeuta para gerar um lote.
                </p>
              </div>
            ) : (
              lotesFiltrados.map((lote) => {
                const isExpanded = loteExpandidoId === lote.id;
                return (
                  <div
                    key={lote.id}
                    className="border border-ink-200 rounded-2xl overflow-hidden bg-white shadow-xs"
                  >
                    <div className="p-3.5 sm:p-4 bg-ink-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          LOTE
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base font-bold font-mono text-ink-900">
                              Lote #{lote.numero_lote}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-800">
                              {lote.operadora?.nome || 'Operadora'} • TISS {lote.versao_tiss}
                            </span>
                            {lote.status_lote === 'xml_gerado' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                XML Exportado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-500 mt-0.5">
                            {lote.quantidade_guias} guia(s) digitada(s) para este lote
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-ink-100 min-w-0">
                        <div className="flex items-center justify-between sm:block text-left sm:text-right mr-0 sm:mr-2">
                          <span className="text-[10px] sm:text-[11px] uppercase font-semibold text-ink-400 block">
                            Valor Total do Lote
                          </span>
                          <strong className="text-sm sm:text-base font-heading font-bold text-emerald-700">
                            R$ {Number(lote.valor_total_lote).toFixed(2).replace('.', ',')}
                          </strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setLoteParaXml(lote);
                              setIsModalXmlOpen(true);
                            }}
                            className="px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                          >
                            <i className="ph ph-file-code text-sm"></i>
                            <span className="hidden sm:inline">Gerar / Baixar XML TISS</span>
                            <span className="sm:hidden">XML TISS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setLoteExpandidoId(isExpanded ? null : lote.id)
                            }
                            className="px-3 py-2.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-xs font-semibold text-ink-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <i
                              className={`ph ${
                                isExpanded ? 'ph-caret-up' : 'ph-caret-down'
                              }`}
                            ></i>
                            <span>{isExpanded ? 'Ocultar' : 'Ver Guias'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3.5 sm:p-4 border-t border-ink-100 bg-white space-y-3">
                        {/* Sub-cards Mobile das Guias no Lote */}
                        <div className="lg:hidden space-y-2.5">
                          {(lote.guias || []).length === 0 ? (
                            <p className="text-xs text-ink-400 text-center py-4">
                              Nenhuma guia vinculada a este lote.
                            </p>
                          ) : (
                            (lote.guias || []).map((g) => (
                              <div
                                key={g.id}
                                className="p-3 rounded-xl bg-ink-50/70 border border-ink-150 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="font-mono font-bold text-xs text-ink-900 block">
                                      #{g.numero_guia_prestador}
                                    </span>
                                    <span className="font-semibold text-xs text-ink-800 block">
                                      {g.paciente?.nome || 'Paciente'}
                                    </span>
                                  </div>
                                  <span className="font-mono font-bold text-xs text-emerald-700">
                                    R${' '}
                                    {Number(g.valor_total_guia || 0)
                                      .toFixed(2)
                                      .replace('.', ',')}
                                  </span>
                                </div>

                                <div className="text-[11px] text-ink-600 space-y-1 pt-1.5 border-t border-ink-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-ink-400">Senha / Autorização:</span>
                                    <span className="font-mono font-bold text-ink-700">
                                      {g.numero_senha || '—'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono font-bold text-brand-700">
                                      {g.codigo_tuss}
                                    </span>{' '}
                                    — {g.descricao_termo}
                                  </div>
                                  <div>
                                    <span className="text-ink-400 block mb-0.5">
                                      Datas realizadas:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {(g.sessoes || []).map((s, idx) => (
                                        <span
                                          key={idx}
                                          className="font-mono px-1.5 py-0.5 rounded bg-white border border-ink-200 text-[10px] text-ink-700"
                                        >
                                          {formatarDataBr(s.data_realizacao)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Tabela Desktop das Guias no Lote */}
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="w-full text-left text-xs text-ink-700">
                            <thead>
                              <tr className="border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase">
                                <th className="py-2 px-3">Nº Guia</th>
                                <th className="py-2 px-3">Paciente</th>
                                <th className="py-2 px-3">Nº Autorização</th>
                                <th className="py-2 px-3">Termo Autorizado</th>
                                <th className="py-2 px-3">Datas Realizadas (Máx 10)</th>
                                <th className="py-2 px-3 text-right">Valor da Guia</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100">
                              {(lote.guias || []).map((g) => (
                                <tr key={g.id}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-ink-900">
                                    #{g.numero_guia_prestador}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-ink-900">
                                    {g.paciente?.nome}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {g.numero_senha}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="font-mono font-bold text-brand-700">
                                      {g.codigo_tuss}
                                    </span>{' '}
                                    — {g.descricao_termo}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px]">
                                    {(g.sessoes || [])
                                      .map((s) => formatarDataBr(s.data_realizacao))
                                      .join(', ')}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                    R${' '}
                                    {Number(g.valor_total_guia || 0)
                                      .toFixed(2)
                                      .replace('.', ',')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Digitação e Conferência de Guia no Faturamento */}
      <ModalDigitacaoGuiaFaturamento
        isOpen={isModalDigitacaoOpen}
        onClose={() => {
          setIsModalDigitacaoOpen(false);
          setGuiaSelecionadaParaDigitar(null);
        }}
        guiaRecebida={guiaSelecionadaParaDigitar}
        pacientes={pacientes}
        autorizacoes={autorizacoes}
        terapeutas={terapeutas}
        lotesExistentes={lotes}
        onSaved={handleGuiaDigitadaComSucesso}
      />

      {/* Modal 2: Catálogo TUSS e Contratos de Valores por Operadora (Fluxo em 3 Etapas) */}
      <ModalTabelaPrecosOperadora
        isOpen={isModalPrecosOpen}
        onClose={() => setIsModalPrecosOpen(false)}
        operadoras={operadoras}
        procedimentosTuss={procedimentosTuss}
        onUpdated={carregarDadosFaturamento}
      />

      {/* Modal 3: Espelho Oficial Guia SP/SADT Padrão ANS */}
      <ModalGuiaSpSadtPrint
        onClose={() => setGuiaImpressao(null)}
        guia={guiaImpressao}
      />

      {/* Modal 4: Exportador Real de XML TISS (Fase 5) */}
      <FaturamentoModalGeracao
        isOpen={isModalXmlOpen}
        onClose={() => {
          setIsModalXmlOpen(false);
          setLoteParaXml(null);
        }}
        lotes={lotes}
        loteInicial={loteParaXml}
        onXmlExportado={async (_lote, nomeArq, hash) => {
          setIsModalXmlOpen(false);
          setLoteParaXml(null);
          setBannerSucesso(
            `Arquivo TISS ${nomeArq} gerado e baixado com sucesso (Hash MD5 Epílogo ANS: ${hash})!`
          );
          await carregarDadosFaturamento();
        }}
      />
    </div>
  );
}
