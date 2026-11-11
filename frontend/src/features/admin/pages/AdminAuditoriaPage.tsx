import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AuditoriaCriticaRecord,
  CodigoCriticaAuditoria,
  CorrigirFalhaAuditoriaDTO,
  GuiaTissRecord,
  LoteFaturamentoRecord,
  ResumoAuditoriaLote,
  TerapeutaRecord,
} from '@/features/admin/types';
import { AuditoriaHeader } from '../components/auditoria/AuditoriaHeader';
import { AuditoriaFiltros } from '../components/auditoria/AuditoriaFiltros';
import { AuditoriaTable } from '../components/auditoria/AuditoriaTable';
import { AuditoriaDrawer } from '../components/auditoria/AuditoriaDrawer';
import { FaturamentoModalGeracao } from '../components/faturamento/FaturamentoModalGeracao';
import {
  corrigirFalhasAuditoriaGuia,
  executarConferenciaPreXml,
  semearOuRestaurarLoteDemonstracaoAuditoria,
} from '../api/auditoria.service';
import { listarTerapeutas } from '../api/autorizacoes.service';
import { listarOperadorasComPlanos } from '../api/convenios.service';
import { listarLotesFaturamento } from '../api/faturamento.service';

export function AdminAuditoriaPage() {
  const [loading, setLoading] = useState(true);
  const [salvandoCorrecao, setSalvandoCorrecao] = useState(false);

  const [guiasAuditadas, setGuiasAuditadas] = useState<GuiaTissRecord[]>([]);
  const [resumosLotes, setResumosLotes] = useState<ResumoAuditoriaLote[]>([]);
  const [todasCriticas, setTodasCriticas] = useState<AuditoriaCriticaRecord[]>([]);
  const [valorTabelaPorGuia, setValorTabelaPorGuia] = useState<
    Record<string, number | null>
  >({});
  const [terapeutas, setTerapeutas] = useState<TerapeutaRecord[]>([]);
  const [operadorasNomes, setOperadorasNomes] = useState<string[]>([]);
  const [lotes, setLotes] = useState<LoteFaturamentoRecord[]>([]);
  const [isModalXmlOpen, setIsModalXmlOpen] = useState(false);
  const [loteParaXml, setLoteParaXml] = useState<LoteFaturamentoRecord | null>(
    null
  );

  // Filtros
  const [busca, setBusca] = useState('');
  const [convenio, setConvenio] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [tipoCritica, setTipoCritica] = useState<CodigoCriticaAuditoria | ''>('');
  const [statusFiltro, setStatusFiltro] = useState<
    'todos' | 'retidas' | 'validadas'
  >('todos');

  // Drawer de Resolução
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState<GuiaTissRecord | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  const rodarConferencia = useCallback(async () => {
    setLoading(true);
    const [resConferencia, resTerapeutas, resOperadoras, resLotes] =
      await Promise.all([
        executarConferenciaPreXml(),
        listarTerapeutas(),
        listarOperadorasComPlanos(),
        listarLotesFaturamento(),
      ]);

    setGuiasAuditadas(resConferencia.guiasAuditadas);
    setResumosLotes(resConferencia.resumosLotes);
    setTodasCriticas(resConferencia.todasCriticasPendentes);
    setValorTabelaPorGuia(resConferencia.valorTabelaPorGuia);
    setTerapeutas(resTerapeutas.data);
    setOperadorasNomes(resOperadoras.data.map((op) => op.nome));
    setLotes(resLotes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    rodarConferencia();
  }, [rodarConferencia]);

  const handleRestaurarLoteTeste = async () => {
    setLoading(true);
    await semearOuRestaurarLoteDemonstracaoAuditoria(true);
    await rodarConferencia();
    setNumeroLote('904026');
    setBannerFeedback(
      'Lote de Demonstração #904026 (BRADESCO SAÚDE) carregado com as 4 falhas críticas obrigatórias para validação!'
    );
  };

  const abrirDrawer = (guia: GuiaTissRecord) => {
    setSelectedGuia(guia);
    setIsDrawerOpen(true);
  };

  const fecharDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedGuia(null), 250);
  };

  const handleAplicarCorrecao = async (dto: CorrigirFalhaAuditoriaDTO) => {
    setSalvandoCorrecao(true);
    const { guiaAtualizada, criticasRestantes, error } =
      await corrigirFalhasAuditoriaGuia(dto);
    setSalvandoCorrecao(false);

    if (error) {
      alert(error);
      return;
    }

    await rodarConferencia();

    if (guiaAtualizada && criticasRestantes.length === 0) {
      setBannerFeedback(
        `Guia #${guiaAtualizada.numero_guia_prestador} corrigida e aprovada na conferência TISS! Nenhuma crítica pendente.`
      );
      fecharDrawer();
    } else if (guiaAtualizada) {
      setSelectedGuia(guiaAtualizada);
      setBannerFeedback(
        `Ajuste aplicado na Guia #${guiaAtualizada.numero_guia_prestador}. Restam ${criticasRestantes.length} crítica(s) para resolver.`
      );
    }
  };

  // Contadores individuais das 4 Críticas Obrigatórias
  const contadores4Criticas = useMemo(() => {
    return {
      datasRepetidas: todasCriticas.filter(
        (c) => c.codigo_critica === 'CRIT_DATA_REPETIDA'
      ).length,
      qtdDiferente1: todasCriticas.filter(
        (c) => c.codigo_critica === 'CRIT_QTD_DIFERENTE_1'
      ).length,
      terapeutaDivergente: todasCriticas.filter(
        (c) => c.codigo_critica === 'CRIT_TERAPEUTA_DIVERGENTE'
      ).length,
      valorTabelaPlano: todasCriticas.filter(
        (c) => c.codigo_critica === 'CRIT_VALOR_TABELA_PLANO'
      ).length,
    };
  }, [todasCriticas]);

  // Contadores totais de retidas e validadas para os filtros
  const totalRetidas = useMemo(
    () => guiasAuditadas.filter((g) => (g.criticas_auditoria || []).length > 0).length,
    [guiasAuditadas]
  );
  const totalValidadas = useMemo(
    () => guiasAuditadas.filter((g) => (g.criticas_auditoria || []).length === 0).length,
    [guiasAuditadas]
  );

  const handleLimparFiltros = () => {
    setBusca('');
    setConvenio('');
    setNumeroLote('');
    setTipoCritica('');
    setStatusFiltro('todos');
  };

  // Filtragem das guias na tabela
  const guiasFiltradas = useMemo(() => {
    return guiasAuditadas.filter((g) => {
      if (busca.trim()) {
        const termo = busca.trim().toLowerCase();
        const matchGuia = g.numero_guia_prestador?.toLowerCase().includes(termo);
        const matchPaciente = g.paciente?.nome?.toLowerCase().includes(termo);
        const matchSenha = g.numero_senha?.toLowerCase().includes(termo);
        const matchLote = g.numero_lote?.toLowerCase().includes(termo);
        const matchTuss = g.codigo_tuss?.toLowerCase().includes(termo);
        const matchTermo = g.descricao_termo?.toLowerCase().includes(termo);
        if (
          !matchGuia &&
          !matchPaciente &&
          !matchSenha &&
          !matchLote &&
          !matchTuss &&
          !matchTermo
        ) {
          return false;
        }
      }
      if (numeroLote && g.numero_lote !== numeroLote) return false;
      if (
        convenio &&
        g.plano?.operadora?.nome?.toUpperCase() !== convenio.toUpperCase()
      ) {
        return false;
      }
      const criticas = g.criticas_auditoria || [];
      if (statusFiltro === 'retidas' && criticas.length === 0) return false;
      if (statusFiltro === 'validadas' && criticas.length > 0) return false;
      if (
        tipoCritica &&
        !criticas.some((c) => c.codigo_critica === tipoCritica)
      ) {
        return false;
      }
      return true;
    });
  }, [guiasAuditadas, busca, numeroLote, convenio, statusFiltro, tipoCritica]);

  return (
    <div
      id="view-auditoria"
      className="view-section fade-in max-w-7xl mx-auto flex flex-col w-full min-h-0 pb-12"
    >
      <AuditoriaHeader
        pendentesCount={todasCriticas.length}
        auditing={loading}
        onRestaurar={handleRestaurarLoteTeste}
        onExecutarConferencia={rodarConferencia}
      />

      {bannerFeedback && (
        <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shadow-xs">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <i className="ph ph-check-circle-fill text-lg text-emerald-600 shrink-0 mt-0.5 sm:mt-0"></i>
            <span className="leading-snug">{bannerFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerFeedback(null)}
            className="self-end sm:self-auto text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 rounded cursor-pointer text-xs"
          >
            Fechar ✕
          </button>
        </div>
      )}

      {/* Cards das 4 Regras Críticas Obrigatórias (Grid Responsivo 2x2 no mobile, 4 no desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
        {/* Card 1: Datas Repetidas */}
        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_DATA_REPETIDA' ? '' : 'CRIT_DATA_REPETIDA'
            )
          }
          className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            tipoCritica === 'CRIT_DATA_REPETIDA'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500 leading-tight">
              1 • Datas Repetidas
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <i className="ph ph-calendar-x text-xs sm:text-base"></i>
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-ink-900 leading-none">
              {contadores4Criticas.datasRepetidas}
            </p>
            <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1 leading-tight">
              Mesma data na guia ou lote
            </p>
          </div>
        </button>

        {/* Card 2: Quantidade ≠ 1 */}
        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_QTD_DIFERENTE_1'
                ? ''
                : 'CRIT_QTD_DIFERENTE_1'
            )
          }
          className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            tipoCritica === 'CRIT_QTD_DIFERENTE_1'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500 leading-tight">
              2 • Qtd. Diferente 1
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <i className="ph ph-hash text-xs sm:text-base"></i>
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-ink-900 leading-none">
              {contadores4Criticas.qtdDiferente1}
            </p>
            <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1 leading-tight">
              Sessões com quantidade ≠ 1
            </p>
          </div>
        </button>

        {/* Card 3: Terapeuta Divergente */}
        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_TERAPEUTA_DIVERGENTE'
                ? ''
                : 'CRIT_TERAPEUTA_DIVERGENTE'
            )
          }
          className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            tipoCritica === 'CRIT_TERAPEUTA_DIVERGENTE'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500 leading-tight">
              3 • Terapeuta Diverg.
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <i className="ph ph-user-switch text-xs sm:text-base"></i>
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-ink-900 leading-none">
              {contadores4Criticas.terapeutaDivergente}
            </p>
            <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1 leading-tight">
              Executante ≠ designado
            </p>
          </div>
        </button>

        {/* Card 4: Valor ≠ Tabela */}
        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_VALOR_TABELA_PLANO'
                ? ''
                : 'CRIT_VALOR_TABELA_PLANO'
            )
          }
          className={`text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            tipoCritica === 'CRIT_VALOR_TABELA_PLANO'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500 leading-tight">
              4 • Valor ≠ Tabela
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <i className="ph ph-currency-circle-dollar text-xs sm:text-base"></i>
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-ink-900 leading-none">
              {contadores4Criticas.valorTabelaPlano}
            </p>
            <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1 leading-tight">
              Valor unitário difere do plano
            </p>
          </div>
        </button>
      </div>

      {/* Painel de Status de Liberação dos Lotes para XML */}
      {resumosLotes.length > 0 && (
        <div className="mb-5 sm:mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
              <i className="ph ph-package text-brand-600 text-base shrink-0"></i>
              Status de Conferência Pré-XML por Lote
            </span>
            <span className="text-[10px] sm:text-[11px] text-ink-400">
              O Lote só é liberado para XML quando possui 0 guias retidas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resumosLotes.map((resumo) => (
              <div
                key={resumo.loteId}
                onClick={() =>
                  setNumeroLote(
                    numeroLote === resumo.numeroLote ? '' : resumo.numeroLote
                  )
                }
                className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 ${
                  resumo.aptoParaGerarXml
                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                    : 'bg-red-50/50 border-red-200 hover:bg-red-50'
                } ${
                  numeroLote === resumo.numeroLote
                    ? 'ring-2 ring-ink-900 shadow-xs'
                    : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-mono font-bold text-xs text-ink-900">
                      Lote #{resumo.numeroLote}
                    </span>
                    <span className="text-[11px] font-semibold text-ink-600 truncate">
                      {resumo.operadoraNome} (TISS {resumo.versaoTiss})
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-500 mt-1">
                    {resumo.guiasAprovadas}/{resumo.totalGuias} guias aprovadas • Total R${' '}
                    {resumo.valorTotalLote.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {resumo.aptoParaGerarXml ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const found =
                        lotes.find((l) => l.numero_lote === resumo.numeroLote) ||
                        null;
                      setLoteParaXml(found);
                      setIsModalXmlOpen(true);
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide shrink-0 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <i className="ph ph-file-code text-xs"></i>
                    Gerar XML TISS
                  </button>
                ) : (
                  <span className="w-full sm:w-auto px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide shrink-0 text-center">
                    Retido ({resumo.guiasRetidas} guia{resumo.guiasRetidas !== 1 && 's'})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AuditoriaFiltros
        busca={busca}
        setBusca={setBusca}
        convenio={convenio}
        setConvenio={setConvenio}
        numeroLote={numeroLote}
        setNumeroLote={setNumeroLote}
        tipoCritica={tipoCritica}
        setTipoCritica={setTipoCritica}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        resumosLotes={resumosLotes}
        operadorasNomes={operadorasNomes}
        totalGuias={guiasAuditadas.length}
        totalRetidas={totalRetidas}
        totalValidadas={totalValidadas}
        onLimparFiltros={handleLimparFiltros}
      />

      <AuditoriaTable
        guias={guiasFiltradas}
        valorTabelaPorGuia={valorTabelaPorGuia}
        onAbrirDrawer={abrirDrawer}
      />

      <AuditoriaDrawer
        isOpen={isDrawerOpen}
        guia={selectedGuia}
        valorTabelaOperadora={
          selectedGuia ? valorTabelaPorGuia[selectedGuia.id] ?? null : null
        }
        terapeutas={terapeutas}
        salvando={salvandoCorrecao}
        onClose={fecharDrawer}
        onAplicarCorrecao={handleAplicarCorrecao}
      />

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
          setBannerFeedback(
            `Arquivo TISS ${nomeArq} gerado e baixado com sucesso (Hash MD5 ANS: ${hash})!`
          );
          await rodarConferencia();
        }}
      />
    </div>
  );
}
