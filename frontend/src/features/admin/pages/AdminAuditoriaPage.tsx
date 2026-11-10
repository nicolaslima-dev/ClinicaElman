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

  // Filtragem das guias na tabela
  const guiasFiltradas = useMemo(() => {
    return guiasAuditadas.filter((g) => {
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
  }, [guiasAuditadas, numeroLote, convenio, statusFiltro, tipoCritica]);

  return (
    <div
      id="view-auditoria"
      className="view-section fade-in max-w-7xl mx-auto flex flex-col h-full min-h-[700px] pb-10"
    >
      <AuditoriaHeader
        pendentesCount={todasCriticas.length}
        auditing={loading}
        onRestaurar={handleRestaurarLoteTeste}
        onExecutarConferencia={rodarConferencia}
      />

      {bannerFeedback && (
        <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <i className="ph ph-check-circle-fill text-lg text-emerald-600"></i>
            <span>{bannerFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cards das 4 Regras Críticas Obrigatórias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_DATA_REPETIDA' ? '' : 'CRIT_DATA_REPETIDA'
            )
          }
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            tipoCritica === 'CRIT_DATA_REPETIDA'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-ink-400">
              Crítica 1 — Datas Repetidas
            </span>
            <i className="ph ph-calendar-x text-lg text-red-600"></i>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-1.5">
            {contadores4Criticas.datasRepetidas}
          </p>
          <p className="text-[11px] text-ink-400 mt-0.5">
            Mesma data na guia ou em outra guia do paciente
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_QTD_DIFERENTE_1'
                ? ''
                : 'CRIT_QTD_DIFERENTE_1'
            )
          }
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            tipoCritica === 'CRIT_QTD_DIFERENTE_1'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-ink-400">
              Crítica 2 — Quantidade ≠ 1
            </span>
            <i className="ph ph-hash text-lg text-red-600"></i>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-1.5">
            {contadores4Criticas.qtdDiferente1}
          </p>
          <p className="text-[11px] text-ink-400 mt-0.5">
            Linhas de sessão com quantidade diferente de 1
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_TERAPEUTA_DIVERGENTE'
                ? ''
                : 'CRIT_TERAPEUTA_DIVERGENTE'
            )
          }
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            tipoCritica === 'CRIT_TERAPEUTA_DIVERGENTE'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-ink-400">
              Crítica 3 — Terapeuta Divergente
            </span>
            <i className="ph ph-user-switch text-lg text-amber-600"></i>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-1.5">
            {contadores4Criticas.terapeutaDivergente}
          </p>
          <p className="text-[11px] text-ink-400 mt-0.5">
            Executante difere do designado na guia/senha
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setTipoCritica(
              tipoCritica === 'CRIT_VALOR_TABELA_PLANO'
                ? ''
                : 'CRIT_VALOR_TABELA_PLANO'
            )
          }
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            tipoCritica === 'CRIT_VALOR_TABELA_PLANO'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-ink-100 shadow-card hover:border-ink-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-ink-400">
              Crítica 4 — Valor ≠ Tabela
            </span>
            <i className="ph ph-currency-circle-dollar text-lg text-amber-600"></i>
          </div>
          <p className="text-2xl font-bold font-heading text-ink-900 mt-1.5">
            {contadores4Criticas.valorTabelaPlano}
          </p>
          <p className="text-[11px] text-ink-400 mt-0.5">
            Valor unitário difere da tabela do plano
          </p>
        </button>
      </div>

      {/* Painel de Status de Liberação dos Lotes para XML */}
      {resumosLotes.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-ink-100 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
              <i className="ph ph-package text-brand-600 text-base"></i>
              Status de Conferência Pré-XML por Lote
            </span>
            <span className="text-[11px] text-ink-400">
              O Lote só é liberado para geração do XML quando possui 0 guias retidas
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
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  resumo.aptoParaGerarXml
                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                    : 'bg-red-50/50 border-red-200 hover:bg-red-50'
                } ${
                  numeroLote === resumo.numeroLote
                    ? 'ring-2 ring-ink-900'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-ink-900">
                      Lote #{resumo.numeroLote}
                    </span>
                    <span className="text-[11px] font-semibold text-ink-600">
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
                    className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <i className="ph ph-file-code text-xs"></i>
                    Gerar XML TISS
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide shrink-0">
                    Retido ({resumo.guiasRetidas} guia{resumo.guiasRetidas !== 1 && 's'})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AuditoriaFiltros
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
