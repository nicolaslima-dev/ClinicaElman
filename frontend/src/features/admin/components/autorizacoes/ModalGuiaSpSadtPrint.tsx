import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GuiaTissRecord } from '@/features/admin/types';
import { formatarCPF, formatarDataBr } from '@/features/admin/utils/pacienteValidators';

interface ModalGuiaSpSadtPrintProps {
  guia: GuiaTissRecord | null;
  onClose: () => void;
}

const DOC_BASE_WIDTH = 760;

export function ModalGuiaSpSadtPrint({ guia, onClose }: ModalGuiaSpSadtPrintProps) {
  if (!guia) return null;

  const operadora = guia.paciente?.plano?.operadora || guia.plano?.operadora;
  const paciente = guia.paciente;
  const terapeuta = guia.terapeuta_designado;
  const sessoes = guia.sessoes || [];

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [docHeight, setDocHeight] = useState<number>(0);
  const [userScale, setUserScale] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<{
    initialDist: number;
    initialScale: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      if (docRef.current) {
        setDocHeight(docRef.current.offsetHeight);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);
    if (docRef.current) {
      resizeObserver.observe(docRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [guia]);

  // Calcula escala para caber perfeitamente na largura do modal em telas menores
  const fitScale = useMemo(() => {
    if (!containerWidth) return 1;
    const availableWidth = Math.max(260, containerWidth - 16);
    if (availableWidth >= DOC_BASE_WIDTH) {
      return 1;
    }
    return Math.min(1, Math.max(0.3, Number((availableWidth / DOC_BASE_WIDTH).toFixed(3))));
  }, [containerWidth]);

  const currentScale = userScale !== null ? userScale : fitScale;

  // Zoom com gesto de pinça (pinch-to-zoom com 2 dedos) no celular/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current = {
        initialDist: dist,
        initialScale: currentScale,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStateRef.current.initialDist;
      const nextScale = Math.min(
        2.5,
        Math.max(0.3, Number((touchStateRef.current.initialScale * factor).toFixed(3)))
      );
      setUserScale(nextScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStateRef.current = null;
    }
  };

  // Suporte a zoom com Cmd/Ctrl + Scroll do mouse
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      const next = Math.min(2.5, Math.max(0.3, Number((currentScale + delta).toFixed(2))));
      setUserScale(next);
    }
  };

  const linhasExecucao = Array.from({ length: 10 }, (_, idx) => {
    const ordem = idx + 1;
    const sessao = sessoes.find(s => s.ordem_sessao === ordem) || sessoes[idx];
    return { ordem, sessao };
  });

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center sm:p-6 print:p-0 print:static print:block">
      <div
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-ink-200 w-full max-w-5xl max-h-[96dvh] sm:max-h-[94dvh] flex flex-col overflow-hidden z-10 fade-in print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Barra Superior de Ações (Oculta na impressão) */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-ink-900 text-white flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white/10 items-center justify-center text-brand-300 shrink-0">
              <i className="ph ph-printer text-xl"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold font-heading truncate">
                <span className="sm:hidden">Guia SP/SADT — TISS {guia.versao_tiss}</span>
                <span className="hidden sm:inline">
                  Espelho Oficial ANS — Guia de SP/SADT (Versão TISS {guia.versao_tiss})
                </span>
              </h3>
              <p className="text-[11px] text-brand-200 truncate">
                <span className="sm:hidden">Campo 4: {formatarDataBr(guia.data_autorizacao_campo4)}</span>
                <span className="hidden sm:inline">
                  Campo 4 (Data da Autorização) preenchido com a Data Início da senha ({formatarDataBr(guia.data_autorizacao_campo4)})
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] sm:flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="justify-center px-4 sm:px-5 py-2.5 sm:py-2 rounded-full text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <i className="ph ph-printer text-base"></i>
              <span className="sm:inline">Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Barra de Controles de Zoom e Visualização (Oculta na impressão) */}
        <div className="px-3 sm:px-6 py-2 bg-ink-50 border-b border-ink-200 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-1.5 text-ink-600 min-w-0">
            <i className="ph ph-magnifying-glass text-sm text-ink-400 shrink-0"></i>
            <span className="hidden xs:inline font-medium text-ink-600">Visualização:</span>
            <span className="font-mono font-bold text-ink-900 bg-white px-2 py-0.5 rounded-md border border-ink-200 text-xs shrink-0">
              {Math.round(currentScale * 100)}%
            </span>
            <span className="text-[11px] text-ink-400 hidden sm:inline truncate">
              (Use pinça com 2 dedos ou os botões para dar zoom)
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setUserScale(Math.max(0.3, Number((currentScale - 0.15).toFixed(2))))}
              disabled={currentScale <= 0.35}
              className="w-8 h-8 rounded-lg bg-white border border-ink-200 hover:bg-ink-100 disabled:opacity-40 text-ink-700 flex items-center justify-center cursor-pointer transition-colors"
              title="Diminuir Zoom"
              aria-label="Diminuir Zoom"
            >
              <i className="ph ph-minus text-sm"></i>
            </button>

            <button
              type="button"
              onClick={() => setUserScale(null)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                userScale === null || Math.abs(currentScale - fitScale) < 0.02
                  ? 'bg-brand-50 border-brand-300 text-brand-800'
                  : 'bg-white border-ink-200 text-ink-700 hover:bg-ink-100'
              }`}
              title="Ajustar automaticamente à largura da tela"
            >
              <i className="ph ph-arrows-in-simple text-sm"></i>
              <span>Ajustar à Tela</span>
            </button>

            <button
              type="button"
              onClick={() => setUserScale(1.0)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                Math.abs(currentScale - 1.0) < 0.02
                  ? 'bg-brand-50 border-brand-300 text-brand-800'
                  : 'bg-white border-ink-200 text-ink-700 hover:bg-ink-100'
              }`}
              title="Visualizar em tamanho real (100%)"
            >
              <span>100%</span>
            </button>

            <button
              type="button"
              onClick={() => setUserScale(Math.min(2.5, Number((currentScale + 0.15).toFixed(2))))}
              disabled={currentScale >= 2.4}
              className="w-8 h-8 rounded-lg bg-white border border-ink-200 hover:bg-ink-100 disabled:opacity-40 text-ink-700 flex items-center justify-center cursor-pointer transition-colors"
              title="Aumentar Zoom"
              aria-label="Aumentar Zoom"
            >
              <i className="ph ph-plus text-sm"></i>
            </button>
          </div>
        </div>

        {/* Documento Oficial ANS SP/SADT com Redimensionamento e Zoom Suave */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="p-2 sm:p-6 overflow-auto overscroll-contain flex-1 bg-ink-100/60 text-ink-900 print:p-0 print:overflow-visible flex justify-center items-start touch-pan-x touch-pan-y"
        >
          {/* Caixa sizer que informa a largura e altura exatas pós-zoom para a rolagem nativa */}
          <div
            style={{
              width: `${DOC_BASE_WIDTH * currentScale}px`,
              height: docHeight > 0 ? `${docHeight * currentScale}px` : 'auto',
              minWidth: `${DOC_BASE_WIDTH * currentScale}px`,
              transition: touchStateRef.current ? 'none' : 'width 0.15s ease-out, height 0.15s ease-out',
            }}
            className="relative shrink-0 print:!w-auto print:!h-auto print:!min-w-0"
          >
            <div
              ref={docRef}
              style={{
                width: `${DOC_BASE_WIDTH}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top left',
                transition: touchStateRef.current ? 'none' : 'transform 0.15s ease-out',
              }}
              className="bg-white border-2 border-ink-900 p-4 space-y-2.5 text-[11px] leading-tight font-sans shadow-md print:shadow-none print:border-none print:transform-none print:w-auto print:p-0"
            >
            {/* Cabeçalho Oficial da Guia */}
            <div className="grid grid-cols-12 gap-2 items-center border-b-2 border-ink-900 pb-3">
              <div className="col-span-3 border-r border-ink-300 pr-2">
                <span className="text-[9px] uppercase font-bold text-ink-500 block">
                  Operadora de Saúde
                </span>
                <span className="text-sm font-extrabold font-heading text-ink-950 uppercase">
                  {operadora?.nome || 'OPERADORA'}
                </span>
                <span className="text-[10px] text-ink-600 block">
                  Plano: {paciente?.plano?.nome_plano || 'Nacional'}
                </span>
              </div>

              <div className="col-span-6 text-center px-2">
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-ink-950">
                  GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA - SP/SADT
                </h2>
                <p className="text-[10px] font-semibold text-brand-800 mt-0.5">
                  Padrão ANS TISS — Versão {guia.versao_tiss}
                </p>
              </div>

              <div className="col-span-3 border-l border-ink-300 pl-3 text-right">
                <span className="text-[9px] uppercase font-bold text-ink-500 block">
                  2 - Nº Guia no Prestador
                </span>
                <span className="text-sm font-mono font-bold text-ink-950">
                  {guia.numero_guia_prestador}
                </span>
              </div>
            </div>

            {/* Linha 1: Campos 1 a 6 (Destaque para o Campo 4 - Data da Autorização) */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2 border border-ink-400 p-1.5 rounded-xs">
                <span className="text-[8px] font-bold uppercase text-ink-500 block">
                  1 - Registro ANS
                </span>
                <span className="font-mono font-bold text-xs text-ink-900">
                  {operadora?.registro_ans || '005711'}
                </span>
              </div>

              <div className="col-span-3 border border-ink-400 p-1.5 rounded-xs">
                <span className="text-[8px] font-bold uppercase text-ink-500 block">
                  3 - Nº da Guia Principal / Operadora
                </span>
                <span className="font-mono font-bold text-xs text-ink-900">
                  {guia.numero_guia_operadora || guia.numero_senha}
                </span>
              </div>

              <div className="col-span-3 border-2 border-brand-700 bg-brand-50/70 p-1.5 rounded-xs">
                <span className="text-[8px] font-extrabold uppercase text-brand-900 block">
                  4 - Data da Autorização (Data Início)
                </span>
                <span className="font-mono font-extrabold text-xs text-brand-900">
                  {formatarDataBr(guia.data_autorizacao_campo4)}
                </span>
              </div>

              <div className="col-span-2 border border-ink-400 p-1.5 rounded-xs">
                <span className="text-[8px] font-bold uppercase text-ink-500 block">
                  5 - Senha
                </span>
                <span className="font-mono font-bold text-xs text-ink-900">
                  {guia.numero_senha}
                </span>
              </div>

              <div className="col-span-2 border border-ink-400 p-1.5 rounded-xs">
                <span className="text-[8px] font-bold uppercase text-ink-500 block">
                  6 - Data Validade da Senha
                </span>
                <span className="font-mono font-bold text-xs text-ink-900">
                  {formatarDataBr(guia.data_validade_senha)}
                </span>
              </div>
            </div>

            {/* Bloco: Dados do Beneficiário */}
            <div>
              <div className="bg-ink-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-800 border border-ink-400 border-b-0">
                Dados do Beneficiário (Paciente)
              </div>
              <div className="grid grid-cols-12 border border-ink-400 divide-x divide-ink-400">
                <div className="col-span-3 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    8 - Número da Carteira
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {paciente?.carteira_plano || '-'}
                  </span>
                </div>
                <div className="col-span-2 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    9 - Validade da Carteira
                  </span>
                  <span className="font-mono text-xs">
                    {formatarDataBr(paciente?.validade_carteira)}
                  </span>
                </div>
                <div className="col-span-5 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    10 - Nome do Beneficiário
                  </span>
                  <span className="font-bold text-xs uppercase">{paciente?.nome || '-'}</span>
                </div>
                <div className="col-span-2 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    CPF / Nascimento
                  </span>
                  <span className="font-mono text-[10px]">
                    {paciente ? formatarCPF(paciente.cpf) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco: Contratado Executante e Terapeuta Designado */}
            <div>
              <div className="bg-ink-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-800 border border-ink-400 border-b-0">
                Dados do Contratado Executante & Profissional (Terapeuta Designado)
              </div>
              <div className="grid grid-cols-12 border border-ink-400 divide-x divide-ink-400">
                <div className="col-span-2 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    29 - Código na Operadora
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {operadora?.codigo_prestador || 'ELMAN001'}
                  </span>
                </div>
                <div className="col-span-3 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    30 - Nome do Contratado
                  </span>
                  <span className="font-bold text-xs">CLÍNICA ELMAN MULTIDISCIPLINAR</span>
                </div>
                <div className="col-span-3 p-1.5 bg-brand-50/40">
                  <span className="text-[8px] font-bold uppercase text-brand-800 block">
                    Profissional / Terapeuta Designado
                  </span>
                  <span className="font-bold text-xs text-ink-950">
                    {terapeuta?.nome || 'Terapeuta Designado'}
                  </span>
                </div>
                <div className="col-span-2 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    Conselho / Número / UF
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {terapeuta
                      ? `${terapeuta.conselho} ${terapeuta.numero_conselho}/${terapeuta.uf_conselho}`
                      : '-'}
                  </span>
                </div>
                <div className="col-span-2 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    Código CBO
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {terapeuta?.cbo || '251510'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco: Termo Autorizado (Procedimento TUSS) */}
            <div>
              <div className="bg-ink-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-800 border border-ink-400 border-b-0">
                Procedimento / Termo Autorizado
              </div>
              <div className="grid grid-cols-12 border border-ink-400 divide-x divide-ink-400">
                <div className="col-span-1 p-1.5 text-center">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    19 - Tabela
                  </span>
                  <span className="font-mono font-bold text-xs">22</span>
                </div>
                <div className="col-span-2 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    20 - Código do Termo
                  </span>
                  <span className="font-mono font-bold text-xs text-brand-900">
                    {guia.codigo_tuss}
                  </span>
                </div>
                <div className="col-span-6 p-1.5">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    21 - Descrição do Termo Autorizado
                  </span>
                  <span className="font-bold text-xs">{guia.descricao_termo}</span>
                </div>
                <div className="col-span-1 p-1.5 text-center">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    22 - Qtd. Guia
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {guia.qtd_sessoes_previstas}
                  </span>
                </div>
                <div className="col-span-2 p-1.5 text-center">
                  <span className="text-[8px] font-bold uppercase text-ink-500 block">
                    Sessões Realizadas
                  </span>
                  <span className="font-mono font-bold text-xs text-brand-800">
                    {sessoes.length} / {guia.qtd_sessoes_previstas}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco: Série de Sessões (Datas 1 a 10) e Assinatura do Paciente / Responsável */}
            <div>
              <div className="bg-ink-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-ink-800 border border-ink-400 border-b-0 flex items-center justify-between">
                <span>
                  Datas de Realização das Sessões (Máx. 10 por Guia) & Assinatura do Beneficiário / Responsável Legal
                </span>
                <span className="text-brand-800">
                  Obrigatório obedecer Data Inicial do Campo 4 ({formatarDataBr(guia.data_autorizacao_campo4)})
                </span>
              </div>

              <table className="w-full border-collapse border border-ink-400 text-xs">
                <thead>
                  <tr className="bg-ink-50 text-[9px] font-bold uppercase text-ink-600 border-b border-ink-400">
                    <th className="border-r border-ink-400 py-1 px-2 w-12 text-center">Seq.</th>
                    <th className="border-r border-ink-400 py-1 px-3 w-36 text-center">
                      Data de Realização
                    </th>
                    <th className="border-r border-ink-400 py-1 px-3 w-28 text-center">
                      Termo TUSS
                    </th>
                    <th className="border-r border-ink-400 py-1 px-2 w-16 text-center">Qtd.</th>
                    <th className="py-1 px-3 text-left">
                      Assinatura do Paciente ou Responsável Legal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-400">
                  {linhasExecucao.map(({ ordem, sessao }) => (
                    <tr key={ordem} className="h-8">
                      <td className="border-r border-ink-400 text-center font-mono font-bold text-ink-600">
                        {String(ordem).padStart(2, '0')}
                      </td>
                      <td className="border-r border-ink-400 text-center font-mono font-bold text-ink-900">
                        {sessao ? formatarDataBr(sessao.data_realizacao) : '____/____/________'}
                      </td>
                      <td className="border-r border-ink-400 text-center font-mono text-ink-700">
                        {sessao ? guia.codigo_tuss : guia.codigo_tuss}
                      </td>
                      <td className="border-r border-ink-400 text-center font-mono font-bold">
                        {sessao ? sessao.quantidade : '1'}
                      </td>
                      <td className="px-3 py-0.5">
                        {sessao && guia.assinatura_paciente_base64 ? (
                          <div className="flex items-center justify-between gap-2">
                            <img
                              src={guia.assinatura_paciente_base64}
                              alt="Assinatura Paciente"
                              className="h-6 object-contain"
                            />
                            <span className="text-[9px] text-ink-500 font-medium truncate">
                              Assinado por: {guia.nome_assinante || paciente?.nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-300 text-[10px]">
                            ____________________________________________________________________
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé de Assinaturas Finais */}
            <div className="grid grid-cols-2 gap-6 pt-3">
              <div className="border border-ink-400 p-2.5 text-center">
                <div className="h-12 flex items-center justify-center">
                  {guia.assinatura_paciente_base64 ? (
                    <img
                      src={guia.assinatura_paciente_base64}
                      alt="Assinatura Beneficiário"
                      className="h-11 object-contain"
                    />
                  ) : null}
                </div>
                <div className="border-t border-ink-400 pt-1 text-[9px] font-bold uppercase text-ink-700">
                  Assinatura do Beneficiário / Responsável Legal ({guia.nome_assinante || paciente?.nome})
                </div>
              </div>

              <div className="border border-ink-400 p-2.5 text-center">
                <div className="h-12 flex flex-col items-center justify-center">
                  <span className="font-heading font-bold text-xs text-ink-800">
                    {terapeuta?.nome}
                  </span>
                  <span className="font-mono text-[10px] text-ink-500">
                    {terapeuta?.conselho} {terapeuta?.numero_conselho}/{terapeuta?.uf_conselho} • CBO {terapeuta?.cbo}
                  </span>
                </div>
                <div className="border-t border-ink-400 pt-1 text-[9px] font-bold uppercase text-ink-700">
                  Assinatura e Carimbo do Terapeuta Executante
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
}

