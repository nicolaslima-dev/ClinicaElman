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
      (g) => g.status_guia === 'em_lote' || g.status_guia === 'faturada_xml'
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

  return (
    <div
      id="view-faturamento"
      className="view-section fade-in max-w-7xl mx-auto flex flex-col h-full min-h-[700px] space-y-6 pb-10"
    >
      {/* Cabeçalho Principal */}
      <div className="flex flex-wrap justify-between items-end gap-4 print:hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
            <i className="ph ph-receipt"></i>
            Setor de Faturamento TISS — Fase 3
          </span>
          <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
            Recebimento, Digitação de Guias e Gestão de Lotes
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Confira as guias recebidas dos terapeutas ou digite novas guias validando saldo da autorização, periodicidade semanal ISO e vínculo ao lote.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsModalPrecosOpen(true)}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <i className="ph ph-currency-circle-dollar text-base text-brand-600"></i>
            Tabela TUSS & Contratos Operadoras
          </button>

          <button
            type="button"
            onClick={handleAbrirNovaDigitacao}
            className="bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 px-5 rounded-full transition-all text-xs flex items-center gap-2 shadow-soft cursor-pointer"
          >
            <i className="ph ph-plus-circle text-base text-brand-300"></i>
            Digitar Guia de Atendimento
          </button>
        </div>
      </div>

      {bannerSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2.5">
            <i className="ph ph-check-circle-fill text-lg text-emerald-600"></i>
            <span>{bannerSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerSucesso(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPIs da Fase 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-400 uppercase">
              Fila de Recebimento
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ph ph-tray-arrow-down text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-2">
            {kpis.aguardandoRecebimento}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Guias enviadas pelos terapeutas p/ digitar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-400 uppercase">
              Guias Digitadas em Lote
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ph ph-files text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-2">
            {kpis.digitadasEmLote}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Conferidas (máx. 10 datas e periodicidade OK)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-400 uppercase">
              Lotes Gerados
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <i className="ph ph-folders text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-2">
            {kpis.totalLotes}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Agrupados por Operadora e Versão TISS
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-400 uppercase">
              Total Consolidado Lotes
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <i className="ph ph-currency-dollar text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-brand-700 mt-2">
            R$ {kpis.valorConsolidadoLotes.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Calculado conforme tabela de cada plano
          </p>
        </div>
      </div>

      {/* Abas e Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-card space-y-4 print:hidden">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-ink-100 pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('fila_guias')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'fila_guias'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              <i className="ph ph-list-checks text-base"></i>
              Recebimento & Digitação de Guias ({guias.length})
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('lotes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'lotes'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              <i className="ph ph-package text-base"></i>
              Gestão de Lotes de Faturamento ({lotes.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Buscar paciente, senha, guia ou nº lote..."
              className="bg-ink-50 border border-ink-200 rounded-xl py-2 px-3.5 text-xs text-ink-800 outline-none focus:bg-white focus:border-brand-400 w-64"
            />

            <select
              value={filtroOperadora}
              onChange={(e) => setFiltroOperadora(e.target.value)}
              className="bg-ink-50 border border-ink-200 rounded-xl py-2 px-3 text-xs text-ink-700 outline-none focus:bg-white"
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
                className="bg-ink-50 border border-ink-200 rounded-xl py-2 px-3 text-xs text-ink-700 outline-none focus:bg-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="recebidas_terapeuta">
                  Recebidas dos Terapeutas (Aguardando Lote)
                </option>
                <option value="em_lote">Digitadas em Lote</option>
              </select>
            )}
          </div>
        </div>

        {/* CONTEÚDO ABA 1: Fila de Recebimento & Guias Digitadas */}
        {abaAtiva === 'fila_guias' && (
          <div className="overflow-x-auto">
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
                          {guia.status_guia === 'enviada_faturamento' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Recebida do Terapeuta
                            </span>
                          ) : guia.status_guia === 'em_lote' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Digitada no Lote
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-ink-100 text-ink-600">
                              No Portal Terapeuta
                            </span>
                          )}
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
        )}

        {/* CONTEÚDO ABA 2: Gestão de Lotes de Faturamento */}
        {abaAtiva === 'lotes' && (
          <div className="space-y-3">
            {lotesFiltrados.length === 0 ? (
              <div className="p-10 text-center text-ink-400 border border-dashed border-ink-200 rounded-2xl">
                <i className="ph ph-package text-3xl mb-2 block text-ink-300"></i>
                <p className="text-sm font-semibold text-ink-700">
                  Nenhum lote de faturamento gerado ainda
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  Clique em &ldquo;Digitar Guia de Atendimento&rdquo; ou confira uma guia enviada pelo terapeuta para gerar um lote.
                </p>
              </div>
            ) : (
              lotesFiltrados.map((lote) => {
                const isExpanded = loteExpandidoId === lote.id;
                return (
                  <div
                    key={lote.id}
                    className="border border-ink-200 rounded-2xl overflow-hidden bg-white"
                  >
                    <div className="p-4 bg-ink-50/60 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                          LOTE
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold font-mono text-ink-900">
                              Lote #{lote.numero_lote}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-800">
                              {lote.operadora?.nome || 'Operadora'} • TISS {lote.versao_tiss}
                            </span>
                          </div>
                          <p className="text-xs text-ink-500 mt-0.5">
                            {lote.quantidade_guias} guia(s) digitada(s) para este lote
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[11px] uppercase font-semibold text-ink-400 block">
                            Valor Total do Lote
                          </span>
                          <strong className="text-base font-heading font-bold text-emerald-700">
                            R$ {Number(lote.valor_total_lote).toFixed(2).replace('.', ',')}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setLoteExpandidoId(isExpanded ? null : lote.id)
                          }
                          className="px-3.5 py-2 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-xs font-semibold text-ink-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <i
                            className={`ph ${
                              isExpanded ? 'ph-caret-up' : 'ph-caret-down'
                            }`}
                          ></i>
                          {isExpanded ? 'Ocultar Guias' : 'Ver Guias do Lote'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t border-ink-100 bg-white">
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
    </div>
  );
}
