import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  AuditoriaCriticaRecord,
  LoteFaturamentoRecord,
} from '../../types';
import { executarConferenciaPreXml } from '../../api/auditoria.service';
import { marcarLoteComoXmlGerado } from '../../api/faturamento.service';
import {
  baixarArquivoXmlTiss,
  gerarXmlLoteTiss,
} from '../../utils/tissXmlGenerator';

interface FaturamentoModalGeracaoProps {
  isOpen: boolean;
  onClose: () => void;
  lotes: LoteFaturamentoRecord[];
  loteInicial?: LoteFaturamentoRecord | null;
  onXmlExportado?: (
    lote: LoteFaturamentoRecord,
    nomeArquivo: string,
    hashMd5: string
  ) => void;
}

export function FaturamentoModalGeracao({
  isOpen,
  onClose,
  lotes,
  loteInicial,
  onXmlExportado,
}: FaturamentoModalGeracaoProps) {
  const navigate = useNavigate();
  const [numeroLoteSelecionado, setNumeroLoteSelecionado] = useState<string>('');
  const [criticasPorLote, setCriticasPorLote] = useState<
    Record<string, AuditoriaCriticaRecord[]>
  >({});
  const [verificandoAuditoria, setVerificandoAuditoria] = useState(false);
  const [exibirCodigoXml, setExibirCodigoXml] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCopiado(false);

    const lotePadrao =
      loteInicial?.numero_lote || lotes[0]?.numero_lote || '';
    setNumeroLoteSelecionado(lotePadrao);

    let ativo = true;
    const rodarConferencia = async () => {
      setVerificandoAuditoria(true);
      const { guiasAuditadas } = await executarConferenciaPreXml();
      if (!ativo) return;

      const mapa: Record<string, AuditoriaCriticaRecord[]> = {};
      guiasAuditadas.forEach((g) => {
        if (!g.numero_lote) return;
        const crits = g.criticas_auditoria || [];
        if (crits.length > 0) {
          mapa[g.numero_lote] = [...(mapa[g.numero_lote] || []), ...crits];
        }
      });
      setCriticasPorLote(mapa);
      setVerificandoAuditoria(false);
    };

    rodarConferencia();
    return () => {
      ativo = false;
    };
  }, [isOpen, loteInicial, lotes]);

  const loteSelecionado = useMemo(
    () =>
      lotes.find((l) => l.numero_lote === numeroLoteSelecionado) ||
      loteInicial ||
      null,
    [lotes, numeroLoteSelecionado, loteInicial]
  );

  const criticasPendentesDoLote = useMemo(() => {
    if (!loteSelecionado) return [];
    return criticasPorLote[loteSelecionado.numero_lote] || [];
  }, [loteSelecionado, criticasPorLote]);

  const resultadoXml = useMemo(() => {
    if (!loteSelecionado || (loteSelecionado.guias?.length || 0) === 0) {
      return null;
    }
    return gerarXmlLoteTiss({
      lote: loteSelecionado,
      guias: loteSelecionado.guias,
      operadora: loteSelecionado.operadora,
    });
  }, [loteSelecionado]);

  if (!isOpen) return null;

  const isBloqueadoAuditoria = criticasPendentesDoLote.length > 0;

  const handleCopiarXml = async () => {
    if (!resultadoXml) return;
    try {
      await navigator.clipboard.writeText(resultadoXml.xml);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleBaixarXmlOficial = async () => {
    if (!resultadoXml || !loteSelecionado || isBloqueadoAuditoria) return;
    setExportando(true);
    baixarArquivoXmlTiss(resultadoXml.nomeArquivoSugerido, resultadoXml.xml);
    const { lote: loteAtualizado } = await marcarLoteComoXmlGerado(
      loteSelecionado.numero_lote
    );
    setExportando(false);
    onXmlExportado?.(
      loteAtualizado || loteSelecionado,
      resultadoXml.nomeArquivoSugerido,
      resultadoXml.hashMd5
    );
  };

  return (
    <div
      id="modalConfirmacao"
      className="fixed inset-0 bg-ink-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="modalBox"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-ink-100 my-8"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-ink-100 flex justify-between items-center bg-ink-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-ink-900 text-brand-300 flex items-center justify-center shadow-sm">
              <i className="ph ph-file-code text-2xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-heading text-ink-900">
                  Motor de Exportação XML TISS (Padrão ANS)
                </h3>
                {resultadoXml && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-brand-100 text-brand-800 border border-brand-200">
                    ans:Padrao {resultadoXml.versaoTiss}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500">
                Geração estruturada ans:mensagemTISS (SP/SADT) com adaptação dinâmica de versão da operadora e Hash Epílogo MD5
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 p-2 rounded-lg hover:bg-ink-100 transition-colors cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Seleção do Lote */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-ink-50/60 p-4 rounded-2xl border border-ink-100">
            <div className="md:col-span-7">
              <label className="block text-xs font-bold text-ink-500 mb-1.5 uppercase tracking-wide">
                Selecionar Lote de Faturamento para Exportação XML
              </label>
              <select
                value={numeroLoteSelecionado}
                onChange={(e) => setNumeroLoteSelecionado(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-ink-900 outline-none focus:border-brand-400"
              >
                {lotes.length === 0 ? (
                  <option value="">Nenhum lote cadastrado</option>
                ) : (
                  lotes.map((l) => {
                    const qtdCrits = (criticasPorLote[l.numero_lote] || []).length;
                    return (
                      <option key={l.id} value={l.numero_lote}>
                        Lote #{l.numero_lote} — {l.operadora?.nome || 'OPERADORA'} • TISS{' '}
                        {l.versao_tiss} ({l.quantidade_guias} guia(s) — R${' '}
                        {Number(l.valor_total_lote).toFixed(2).replace('.', ',')}) —{' '}
                        {qtdCrits > 0
                          ? `⚠ RETIDO (${qtdCrits} crítica(s))`
                          : '✓ VALIDADO P/ XML'}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="md:col-span-5 flex justify-end">
              {verificandoAuditoria ? (
                <span className="text-xs text-ink-500 flex items-center gap-2 py-2">
                  <i className="ph ph-spinner animate-spin text-base"></i>
                  Conferindo regras de auditoria...
                </span>
              ) : isBloqueadoAuditoria ? (
                <span className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
                  <i className="ph ph-prohibit text-base"></i>
                  Lote Retido na Conferência Pré-XML ({criticasPendentesDoLote.length}{' '}
                  falha{criticasPendentesDoLote.length !== 1 && 's'})
                </span>
              ) : resultadoXml ? (
                <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <i className="ph ph-shield-check-fill text-base text-emerald-600"></i>
                  Conferência TISS Aprovada (0 Glosas)
                </span>
              ) : null}
            </div>
          </div>

          {/* Alerta de Bloqueio caso o Lote possua qualquer uma das 4 Críticas */}
          {isBloqueadoAuditoria && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                    <i className="ph ph-warning-octagon-fill text-lg text-red-600"></i>
                    Exportação XML Bloqueada pela Conferência Pré-XML (Fase 4)
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    Este lote contém guias retidas por falhas críticas obrigatórias. Resolva as críticas abaixo na Central de Auditoria para liberar o download do XML:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/auditoria');
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <i className="ph ph-wrench"></i>
                  Abrir Central de Auditoria
                </button>
              </div>

              <ul className="space-y-1.5 text-xs text-red-800 bg-white/80 p-3.5 rounded-xl border border-red-200">
                {criticasPendentesDoLote.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>{c.titulo}:</strong> {c.mensagem_detalhe}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadados Estruturais do XML Gerado */}
          {resultadoXml && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-ink-200">
                  <span className="text-[10px] font-bold uppercase text-ink-400 block">
                    Operadora & Registro ANS
                  </span>
                  <strong className="text-xs font-bold text-ink-900 block mt-1">
                    {resultadoXml.operadoraNome} (ANS {resultadoXml.registroAns})
                  </strong>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-ink-200">
                  <span className="text-[10px] font-bold uppercase text-ink-400 block">
                    Schema XSD & Versão TISS
                  </span>
                  <strong className="text-xs font-mono font-bold text-brand-700 block mt-1">
                    tissV{resultadoXml.versaoTiss.replace(/\./g, '_')}.xsd
                  </strong>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-ink-200">
                  <span className="text-[10px] font-bold uppercase text-ink-400 block">
                    Guias SP/SADT & Sessões
                  </span>
                  <strong className="text-xs font-bold text-ink-900 block mt-1">
                    {resultadoXml.quantidadeGuias} guia(s) •{' '}
                    {resultadoXml.quantidadeSessoes} sessão(ões)
                  </strong>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                    ans:valorTotalGeral
                  </span>
                  <strong className="text-sm font-mono font-bold text-emerald-800 block mt-1">
                    R$ {resultadoXml.valorTotalLote.toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              </div>

              {/* Hash Epílogo MD5 Oficial */}
              <div className="bg-ink-900 text-white p-4 rounded-xl flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <i className="ph ph-fingerprint text-xl text-brand-300"></i>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-ink-400 block font-semibold">
                      Assinatura Digital Epílogo ANS (&lt;ans:epilogo&gt;&lt;ans:hash&gt; MD5)
                    </span>
                    <code className="text-xs font-mono font-bold text-brand-200">
                      {resultadoXml.hashMd5}
                    </code>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-ink-300 bg-white/10 px-3 py-1 rounded-lg">
                  Arquivo: {resultadoXml.nomeArquivoSugerido}
                </span>
              </div>

              {/* Inspetor do Código XML TISS */}
              <div className="border border-ink-200 rounded-2xl overflow-hidden">
                <div className="bg-ink-50 px-4 py-2.5 border-b border-ink-200 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setExibirCodigoXml(!exibirCodigoXml)}
                    className="text-xs font-bold text-ink-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <i
                      className={`ph ${
                        exibirCodigoXml ? 'ph-caret-down' : 'ph-caret-right'
                      }`}
                    ></i>
                    Pré-visualização da Estrutura XML (&lt;ans:mensagemTISS&gt;)
                  </button>

                  <button
                    type="button"
                    onClick={handleCopiarXml}
                    className="px-3 py-1 rounded-lg bg-white border border-ink-200 hover:bg-ink-100 text-ink-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <i
                      className={`ph ${
                        copiado ? 'ph-check text-emerald-600' : 'ph-copy'
                      }`}
                    ></i>
                    {copiado ? 'XML Copiado!' : 'Copiar Código XML'}
                  </button>
                </div>

                {exibirCodigoXml && (
                  <pre className="p-4 bg-ink-950 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64">
                    {resultadoXml.xml}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-ink-50 border-t border-ink-100 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-ink-600 bg-white border border-ink-200 hover:bg-ink-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={
              !resultadoXml || isBloqueadoAuditoria || exportando || verificandoAuditoria
            }
            onClick={handleBaixarXmlOficial}
            className="bg-ink-900 hover:bg-ink-800 disabled:bg-ink-300 text-white font-semibold py-2.5 px-6 rounded-full transition-all text-xs flex items-center gap-2 shadow-soft cursor-pointer"
          >
            <i className="ph ph-download-simple text-base text-brand-300"></i>
            {exportando
              ? 'Gerando Arquivo XML...'
              : `Baixar Arquivo XML (${resultadoXml?.versaoTiss || 'TISS'})`}
          </button>
        </div>
      </div>
    </div>
  );
}
