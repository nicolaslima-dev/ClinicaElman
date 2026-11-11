import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { GuiaTissRecord, TerapeutaRecord } from '@/features/admin/types';
import {
  enviarGuiaParaFaturamento,
  listarGuiasTiss,
  listarTerapeutas,
  salvarAssinaturaGuia,
  salvarSessoesGuiaTerapeuta,
} from '@/features/admin/api/autorizacoes.service';
import { formatarDataBr } from '@/features/admin/utils/pacienteValidators';
import {
  ModalAssinatura,
  type DadosAssinaturaColetada,
} from '../components/atendimento/ModalAssinatura';
import { ModalPreencherGuiaTerapeuta } from '../components/autorizacoes/ModalPreencherGuiaTerapeuta';
import { ModalGuiaSpSadtPrint } from '../components/autorizacoes/ModalGuiaSpSadtPrint';

export function PortalTerapeutaPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [abaStatus, setAbaStatus] = useState<'pendentes' | 'enviadas'>('pendentes');
  const [guias, setGuias] = useState<GuiaTissRecord[]>([]);
  const [terapeutas, setTerapeutas] = useState<TerapeutaRecord[]>([]);
  const [terapeutaAtivoId, setTerapeutaAtivoId] = useState<string>('');

  // Modais
  const [guiaPreenchimentoId, setGuiaPreenchimentoId] = useState<string | null>(null);
  const [guiaParaAssinar, setGuiaParaAssinar] = useState<GuiaTissRecord | null>(null);
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

  const carregarDados = useCallback(async () => {
    setLoading(true);
    const [resGuias, resTer] = await Promise.all([
      listarGuiasTiss(),
      listarTerapeutas(),
    ]);
    setGuias(resGuias.data);
    setTerapeutas(resTer.data);

    // Se for profissional (role medico), vincula automaticamente pelo profile_id, email ou nome
    if (profile && !isAdmin) {
      const encontrado = resTer.data.find(
        t =>
          (t.profile_id && t.profile_id === profile.id) ||
          (t.email && profile.email && t.email.toLowerCase() === profile.email.toLowerCase()) ||
          t.nome.toLowerCase().includes((profile.nome || '').toLowerCase())
      );
      if (encontrado) {
        setTerapeutaAtivoId(encontrado.id);
      } else if (resTer.data[0]) {
        setTerapeutaAtivoId(resTer.data[0].id);
      }
    }
    setLoading(false);
  }, [profile, isAdmin]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const terapeutaAtual = useMemo(
    () => terapeutas.find(t => t.id === terapeutaAtivoId) || null,
    [terapeutas, terapeutaAtivoId]
  );

  // Guias pertencentes ao terapeuta logado (ou filtradas pelo Admin)
  const guiasDoTerapeuta = useMemo(() => {
    if (!terapeutaAtivoId) return guias;
    return guias.filter(g => g.terapeuta_designado_id === terapeutaAtivoId);
  }, [guias, terapeutaAtivoId]);

  const guiasPendentes = useMemo(
    () =>
      guiasDoTerapeuta.filter(
        g => g.status_guia === 'enviada_terapeuta' || g.status_guia === 'em_preenchimento'
      ),
    [guiasDoTerapeuta]
  );

  const guiasEnviadas = useMemo(
    () =>
      guiasDoTerapeuta.filter(
        g =>
          g.status_guia === 'enviada_faturamento' ||
          g.status_guia === 'em_lote' ||
          g.status_guia === 'faturada_xml'
      ),
    [guiasDoTerapeuta]
  );

  const totalSessoesLancadas = useMemo(
    () => guiasDoTerapeuta.reduce((acc, g) => acc + (g.sessoes?.length || 0), 0),
    [guiasDoTerapeuta]
  );

  const guiaEmEdicao = useMemo(
    () => guias.find(g => g.id === guiaPreenchimentoId) || null,
    [guias, guiaPreenchimentoId]
  );

  const handleSalvarDatas = async (guiaId: string, datas: string[]): Promise<boolean> => {
    const { error } = await salvarSessoesGuiaTerapeuta(guiaId, datas);
    if (error) {
      exibirFeedback('erro', error);
      return false;
    }
    await carregarDados();
    exibirFeedback('sucesso', 'Datas de realização salvas na Guia TISS!');
    return true;
  };

  const handleConfirmarAssinatura = async (dados?: DadosAssinaturaColetada) => {
    if (!guiaParaAssinar || !dados?.assinaturaBase64) return;

    const { error } = await salvarAssinaturaGuia(
      guiaParaAssinar.id,
      dados.assinaturaBase64,
      dados.nomeAssinante
    );
    setGuiaParaAssinar(null);

    if (error) {
      exibirFeedback('erro', error);
      return;
    }
    await carregarDados();
    exibirFeedback(
      'sucesso',
      `Assinatura de "${dados.nomeAssinante}" vinculada à Guia #${guiaParaAssinar.numero_guia_prestador}!`
    );
  };

  const handleEnviarFaturamento = async (
    guiaId: string,
    datasAtuais?: string[]
  ): Promise<boolean> => {
    if (datasAtuais) {
      const resSalvar = await salvarSessoesGuiaTerapeuta(guiaId, datasAtuais);
      if (resSalvar.error) {
        exibirFeedback('erro', resSalvar.error);
        return false;
      }
    }

    const { data, error } = await enviarGuiaParaFaturamento(guiaId);
    if (error || !data) {
      exibirFeedback('erro', error || 'Não foi possível enviar a guia para faturamento.');
      return false;
    }

    await carregarDados();
    exibirFeedback(
      'sucesso',
      `Guia #${data.numero_guia_prestador} enviada com sucesso para o Faturamento da Clínica Elman!`
    );
    return true;
  };

  const listaExibida = abaStatus === 'pendentes' ? guiasPendentes : guiasEnviadas;

  return (
    <div id="view-portal-terapeuta" className="view-section fade-in max-w-7xl mx-auto w-full pb-10">
      {/* Toast Feedback (largura total no celular) */}
      {feedback && (
        <div
          role="status"
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:top-6 sm:right-6 sm:max-w-md z-[150] px-4 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 fade-in ${
            feedback.tipo === 'sucesso'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-red-200 text-red-700'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
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
          <span className="text-xs sm:text-sm font-medium pr-2">{feedback.mensagem}</span>
        </div>
      )}

      {/* Header do Portal do Terapeuta */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-4 mb-5 sm:mb-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold font-heading text-ink-900 tracking-tight leading-tight">
              Portal do Terapeuta
              <span className="hidden sm:inline"> — Guias TISS</span>
            </h1>
            {terapeutaAtual && (
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 max-w-full truncate">
                {terapeutaAtual.nome} ({terapeutaAtual.conselho} {terapeutaAtual.numero_conselho})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-400 mt-1.5 sm:mt-1">
            Preencha as datas realizadas obedecendo o <strong>Campo 4 – Data de Autorização</strong>, colete a assinatura do paciente/responsável e envie para faturamento.
          </p>
        </div>

        {/* Seletor de Terapeuta (Visível para Admin supervisionar/testar ou para seleção de fila) */}
        <label className="flex items-center gap-2.5 bg-white px-3.5 sm:px-4 py-2 rounded-xl border border-ink-200 shadow-card w-full lg:w-auto lg:max-w-sm cursor-pointer">
          <i className="ph ph-stethoscope text-brand-600 text-lg shrink-0"></i>
          <div className="text-xs min-w-0 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 block">
              {isAdmin ? 'Supervisão / Fila do Profissional' : 'Profissional Designado'}
            </span>
            <select
              value={terapeutaAtivoId}
              onChange={e => setTerapeutaAtivoId(e.target.value)}
              className="w-full font-semibold text-ink-900 bg-transparent outline-none pr-4 cursor-pointer truncate text-sm sm:text-xs"
            >
              {isAdmin && <option value="">Todos os Terapeutas ({guias.length} guias)</option>}
              {terapeutas.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nome} — {t.especialidade}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      {/* KPIs do Terapeuta (3 colunas compactas no celular) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-5 mb-5 sm:mb-7">
        {[
          {
            label: 'Pendentes',
            labelLong: 'Minhas Guias Pendentes',
            valor: guiasPendentes.length,
            sufixo: 'aguardando envio',
            sufixoCor: 'text-amber-600',
            icone: 'ph-notebook',
            iconeCor: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Sessões',
            labelLong: 'Sessões Realizadas',
            valor: totalSessoesLancadas,
            sufixo: 'datas preenchidas',
            sufixoCor: 'text-ink-400',
            icone: 'ph-calendar-check',
            iconeCor: 'bg-brand-50 text-brand-600',
          },
          {
            label: 'Enviadas',
            labelLong: 'Enviadas p/ Faturamento',
            valor: guiasEnviadas.length,
            sufixo: 'concluídas',
            sufixoCor: 'text-emerald-600',
            icone: 'ph-paper-plane-right',
            iconeCor: 'bg-emerald-50 text-emerald-600',
          },
        ].map(kpi => (
          <div
            key={kpi.labelLong}
            className="bg-white p-3 sm:p-5 rounded-[16px] border border-ink-100 shadow-card flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-2"
          >
            <div className="min-w-0 w-full">
              <p className="text-[10px] sm:text-xs font-medium text-ink-400 uppercase tracking-wide truncate">
                <span className="sm:hidden">{kpi.label}</span>
                <span className="hidden sm:inline">{kpi.labelLong}</span>
              </p>
              <p className="text-xl sm:text-2xl font-semibold font-heading text-ink-900 mt-0.5 sm:mt-1">
                {kpi.valor}{' '}
                <span className={`hidden sm:inline text-sm font-medium font-sans ${kpi.sufixoCor}`}>
                  {kpi.sufixo}
                </span>
              </p>
            </div>
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${kpi.iconeCor}`}
            >
              <i className={`ph ${kpi.icone} text-base sm:text-xl`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Abas (largura total e rótulos curtos no celular) */}
      <div
        role="tablist"
        className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-6 p-1 bg-white border border-ink-100 rounded-xl w-full sm:w-fit shadow-xs"
      >
        {(
          [
            {
              id: 'pendentes',
              icone: 'ph-calendar-plus',
              curto: 'Para Preencher',
              longo: 'Guias para Preenchimento e Assinatura',
              qtd: guiasPendentes.length,
            },
            {
              id: 'enviadas',
              icone: 'ph-check-circle',
              curto: 'Enviadas',
              longo: 'Enviadas para a Clínica Faturar',
              qtd: guiasEnviadas.length,
            },
          ] as const
        ).map(aba => {
          const ativa = abaStatus === aba.id;
          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAbaStatus(aba.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer min-w-0 ${
                ativa ? 'bg-ink-900 text-white shadow-xs' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <i className={`ph ${aba.icone} shrink-0`}></i>
              <span className="truncate sm:hidden">{aba.curto}</span>
              <span className="hidden sm:inline">{aba.longo}</span>
              <span
                className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                  ativa ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
                }`}
              >
                {aba.qtd}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards de Guias do Terapeuta */}
      {loading ? (
        <div className="bg-white rounded-[20px] p-10 sm:p-12 text-center text-ink-400 shadow-card">
          <i className="ph ph-spinner animate-spin text-2xl mb-2 inline-block"></i>
          <p className="text-sm">Carregando suas guias TISS...</p>
        </div>
      ) : listaExibida.length === 0 ? (
        <div className="bg-white rounded-[20px] p-8 sm:p-12 text-center text-ink-400 shadow-card border border-ink-100">
          <i className="ph ph-files text-4xl text-ink-300 mb-2 inline-block"></i>
          <p className="font-semibold text-ink-700 text-sm sm:text-base">
            Nenhuma guia encontrada nesta fila
          </p>
          <p className="text-xs mt-1">
            Assim que novas guias TISS forem geradas a partir das autorizações, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
          {listaExibida.map(g => {
            const sessoes = g.sessoes || [];
            const operadora = g.paciente?.plano?.operadora;
            const jaEnviada = g.status_guia === 'enviada_faturamento';
            const previstas = g.qtd_sessoes_previstas || 0;
            const percentual = previstas
              ? Math.min(100, Math.round((sessoes.length / previstas) * 100))
              : 0;

            return (
              <article
                key={g.id}
                className="bg-white rounded-[20px] p-4 sm:p-6 shadow-card border border-ink-100 flex flex-col justify-between hover:border-brand-200 transition-all min-w-0"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 sm:pb-4 border-b border-ink-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-ink-500">
                          Guia #{g.numero_guia_prestador}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-100 max-w-full truncate">
                          {operadora?.nome || 'CONVÊNIO'} • TISS {g.versao_tiss}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold font-heading text-ink-900 mt-1 leading-snug break-words">
                        {g.paciente?.nome}
                      </h3>
                      <p className="text-xs text-ink-500 flex flex-col sm:block gap-0.5">
                        <span>
                          Carteirinha:{' '}
                          <strong className="font-mono break-all">{g.paciente?.carteira_plano}</strong>
                        </span>
                        <span className="hidden sm:inline"> • </span>
                        <span>
                          Terapeuta: <strong>{g.terapeuta_designado?.nome}</strong>
                        </span>
                      </p>
                    </div>

                    {/* Campo 4: faixa horizontal no celular, bloco à direita no desktop */}
                    <div className="bg-brand-50 border-2 border-brand-200 rounded-xl px-3 sm:px-3.5 py-2 flex sm:block items-center justify-between gap-3 sm:text-right shrink-0">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-800 block">
                          4 – Data da Autorização
                        </span>
                        <span className="text-sm font-mono font-extrabold text-brand-900">
                          {formatarDataBr(g.data_autorizacao_campo4)}
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-700 block text-right">
                        Validade: <span className="font-mono font-semibold">{formatarDataBr(g.data_validade_senha)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Termo e Senha */}
                  <div className="py-3 sm:py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs border-b border-ink-100">
                    <div className="sm:col-span-2 min-w-0">
                      <span className="text-ink-400 block text-[11px]">Termo Autorizado (TUSS):</span>
                      <strong className="text-ink-900 break-words">
                        {g.codigo_tuss} — {g.descricao_termo}
                      </strong>
                    </div>
                    <div className="flex sm:block items-center justify-between gap-2">
                      <span className="text-ink-400 block text-[11px]">5 – Senha Autorizada:</span>
                      <strong className="font-mono text-brand-800 break-all">{g.numero_senha}</strong>
                    </div>
                  </div>

                  {/* Datas Preenchidas & Status da Assinatura */}
                  <div className="py-3.5 sm:py-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-ink-700">
                        Datas de Realização ({sessoes.length} de {previstas})
                      </span>
                      {g.assinatura_paciente_base64 ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 max-w-full min-w-0">
                          <i className="ph-fill ph-signature shrink-0"></i>
                          <span className="truncate">Assinada ({g.nome_assinante})</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <i className="ph ph-warning-circle"></i> Falta Assinatura
                        </span>
                      )}
                    </div>

                    {/* Barra de progresso das sessões */}
                    <div
                      className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={sessoes.length}
                      aria-valuemin={0}
                      aria-valuemax={previstas}
                      aria-label="Sessões preenchidas"
                    >
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all"
                        style={{ width: `${percentual}%` }}
                      ></div>
                    </div>

                    {sessoes.length === 0 ? (
                      <div className="p-3 rounded-xl bg-ink-50/70 border border-dashed border-ink-200 text-xs text-ink-400 text-center">
                        Nenhuma sessão datada ainda. Toque em &ldquo;Preencher Datas&rdquo; abaixo.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap gap-1.5">
                        {sessoes.map((s, idx) => (
                          <span
                            key={s.id}
                            className="px-2 sm:px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-200 text-[11px] sm:text-xs font-mono font-semibold text-ink-800 text-center whitespace-nowrap"
                          >
                            {idx + 1}ª: {formatarDataBr(s.data_realizacao)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Terapeuta */}
                {!jaEnviada ? (
                  <div className="pt-3.5 sm:pt-4 border-t border-ink-100 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2">
                    {/* Ação principal: largura total no celular */}
                    <button
                      type="button"
                      onClick={() => setGuiaPreenchimentoId(g.id)}
                      className="col-span-2 order-1 sm:order-3 px-4 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-semibold text-white bg-ink-900 hover:bg-ink-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="ph ph-calendar-plus text-brand-300 text-base"></i>
                      Preencher Datas ({sessoes.length}/{previstas})
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuiaParaAssinar(g)}
                      className="order-2 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="ph ph-signature text-base"></i>
                      Assinar
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuiaParaImprimir(g)}
                      className="order-3 sm:order-1 sm:mr-auto px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-ink-700 bg-ink-50 hover:bg-ink-100 border border-ink-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="ph ph-printer text-brand-600 text-base"></i>
                      <span className="sm:hidden">Guia PDF</span>
                      <span className="hidden sm:inline">Guia ANS / PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEnviarFaturamento(g.id)}
                      className="col-span-2 order-4 px-4 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <i className="ph ph-paper-plane-right text-base"></i>
                      Enviar p/ Faturamento
                    </button>
                  </div>
                ) : (
                  <div className="pt-3.5 sm:pt-4 border-t border-ink-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => setGuiaParaImprimir(g)}
                      className="px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-ink-700 bg-ink-50 hover:bg-ink-100 border border-ink-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="ph ph-printer text-brand-600 text-base"></i>
                      Guia ANS / PDF
                    </button>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center justify-center sm:justify-end gap-1 text-center sm:text-right">
                      <i className="ph-fill ph-check-circle text-base shrink-0"></i>
                      Enviada à Clínica Elman para Faturamento TISS
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <ModalPreencherGuiaTerapeuta
        guia={guiaEmEdicao}
        onClose={() => setGuiaPreenchimentoId(null)}
        onSalvarDatas={handleSalvarDatas}
        onAbrirAssinatura={g => setGuiaParaAssinar(g)}
        onEnviarFaturamento={handleEnviarFaturamento}
        onImprimirGuia={g => setGuiaParaImprimir(g)}
      />

      <ModalAssinatura
        isOpen={Boolean(guiaParaAssinar)}
        nomePadraoAssinante={guiaParaAssinar?.paciente?.nome || ''}
        onClose={() => setGuiaParaAssinar(null)}
        onAssinar={handleConfirmarAssinatura}
      />

      <ModalGuiaSpSadtPrint
        guia={guiaParaImprimir}
        onClose={() => setGuiaParaImprimir(null)}
      />
    </div>
  );
}

