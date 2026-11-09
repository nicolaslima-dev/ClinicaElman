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

      {/* Header do Portal do Terapeuta */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
              Portal do Terapeuta — Guias TISS
            </h1>
            {terapeutaAtual && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                {terapeutaAtual.nome} ({terapeutaAtual.conselho} {terapeutaAtual.numero_conselho})
              </span>
            )}
          </div>
          <p className="text-sm text-ink-400 mt-1">
            Preencha as datas realizadas obedecendo o <strong>Campo 4 – Data de Autorização</strong>, colete a assinatura do paciente/responsável e envie para faturamento.
          </p>
        </div>

        {/* Seletor de Terapeuta (Visível para Admin supervisionar/testar ou para seleção de fila) */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-ink-200 shadow-card">
          <i className="ph ph-stethoscope text-brand-600 text-lg"></i>
          <div className="text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 block">
              {isAdmin ? 'Supervisão / Fila do Profissional' : 'Profissional Designado'}
            </span>
            <select
              value={terapeutaAtivoId}
              onChange={e => setTerapeutaAtivoId(e.target.value)}
              className="font-semibold text-ink-900 bg-transparent outline-none pr-4 cursor-pointer"
            >
              {isAdmin && <option value="">Todos os Terapeutas ({guias.length} guias)</option>}
              {terapeutas.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nome} — {t.especialidade}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs do Terapeuta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
        <div className="bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Minhas Guias Pendentes
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {guiasPendentes.length}{' '}
              <span className="text-sm font-medium font-sans text-amber-600">
                aguardando envio
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
            <i className="ph ph-Notebook text-xl"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Sessões Realizadas
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {totalSessoesLancadas}{' '}
              <span className="text-sm font-medium font-sans text-ink-400">datas preenchidas</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-50 text-brand-600">
            <i className="ph ph-calendar-check text-xl"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
              Enviadas p/ Faturamento
            </p>
            <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
              {guiasEnviadas.length}{' '}
              <span className="text-sm font-medium font-sans text-emerald-600">concluídas</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600">
            <i className="ph ph-paper-plane-right text-xl"></i>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-white border border-ink-100 rounded-xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setAbaStatus('pendentes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            abaStatus === 'pendentes'
              ? 'bg-ink-900 text-white shadow-xs'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <i className="ph ph-calendar-plus"></i>
          Guias para Preenchimento e Assinatura
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              abaStatus === 'pendentes' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {guiasPendentes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaStatus('enviadas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            abaStatus === 'enviadas'
              ? 'bg-ink-900 text-white shadow-xs'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <i className="ph ph-check-circle"></i>
          Enviadas para a Clínica Faturar
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              abaStatus === 'enviadas' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {guiasEnviadas.length}
          </span>
        </button>
      </div>

      {/* Cards de Guias do Terapeuta */}
      {loading ? (
        <div className="bg-white rounded-[20px] p-12 text-center text-ink-400 shadow-card">
          <i className="ph ph-spinner animate-spin text-2xl mb-2 inline-block"></i>
          <p>Carregando suas guias TISS...</p>
        </div>
      ) : listaExibida.length === 0 ? (
        <div className="bg-white rounded-[20px] p-12 text-center text-ink-400 shadow-card border border-ink-100">
          <i className="ph ph-files text-4xl text-ink-300 mb-2 inline-block"></i>
          <p className="font-semibold text-ink-700 text-base">
            Nenhuma guia encontrada nesta fila
          </p>
          <p className="text-xs mt-1">
            Assim que novas guias TISS forem geradas a partir das autorizações, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {listaExibida.map(g => {
            const sessoes = g.sessoes || [];
            const operadora = g.paciente?.plano?.operadora;
            const jaEnviada = g.status_guia === 'enviada_faturamento';

            return (
              <div
                key={g.id}
                className="bg-white rounded-[20px] p-6 shadow-card border border-ink-100 flex flex-col justify-between hover:border-brand-200 transition-all"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-ink-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-ink-500">
                          Guia #{g.numero_guia_prestador}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-100">
                          {operadora?.nome || 'CONVÊNIO'} • TISS {g.versao_tiss}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-heading text-ink-900 mt-1">
                        {g.paciente?.nome}
                      </h3>
                      <p className="text-xs text-ink-500">
                        Carteirinha: <strong className="font-mono">{g.paciente?.carteira_plano}</strong> • Terapeuta:{' '}
                        <strong>{g.terapeuta_designado?.nome}</strong>
                      </p>
                    </div>

                    <div className="bg-brand-50 border-2 border-brand-200 rounded-xl px-3.5 py-2 text-right">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-800 block">
                        4 – Data da Autorização
                      </span>
                      <span className="text-sm font-mono font-extrabold text-brand-900">
                        {formatarDataBr(g.data_autorizacao_campo4)}
                      </span>
                      <span className="text-[10px] text-brand-700 block">
                        Validade: {formatarDataBr(g.data_validade_senha)}
                      </span>
                    </div>
                  </div>

                  {/* Termo e Senha */}
                  <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-b border-ink-100">
                    <div className="sm:col-span-2">
                      <span className="text-ink-400 block text-[11px]">Termo Autorizado (TUSS):</span>
                      <strong className="text-ink-900">
                        {g.codigo_tuss} — {g.descricao_termo}
                      </strong>
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[11px]">5 – Senha Autorizada:</span>
                      <strong className="font-mono text-brand-800">{g.numero_senha}</strong>
                    </div>
                  </div>

                  {/* Datas Preenchidas & Status da Assinatura */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-700">
                        Datas de Realização Preenchidas ({sessoes.length} de {g.qtd_sessoes_previstas}):
                      </span>
                      {g.assinatura_paciente_base64 ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <i className="ph-fill ph-signature"></i> Assinada ({g.nome_assinante})
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <i className="ph ph-warning-circle"></i> Falta Assinatura do Paciente
                        </span>
                      )}
                    </div>

                    {sessoes.length === 0 ? (
                      <div className="p-3 rounded-xl bg-ink-50/70 border border-dashed border-ink-200 text-xs text-ink-400 text-center">
                        Nenhuma sessão datada ainda. Clique em &ldquo;Preencher Datas&rdquo; abaixo.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {sessoes.map((s, idx) => (
                          <span
                            key={s.id}
                            className="px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-200 text-xs font-mono font-semibold text-ink-800"
                          >
                            {idx + 1}ª: {formatarDataBr(s.data_realizacao)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Terapeuta */}
                <div className="pt-4 border-t border-ink-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setGuiaParaImprimir(g)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-700 bg-ink-50 hover:bg-ink-100 border border-ink-200 transition-colors flex items-center gap-1.5"
                  >
                    <i className="ph ph-printer text-brand-600 text-base"></i>
                    Guia ANS / PDF
                  </button>

                  {!jaEnviada ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuiaParaAssinar(g)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1.5"
                      >
                        <i className="ph ph-signature text-base"></i>
                        Assinar
                      </button>

                      <button
                        type="button"
                        onClick={() => setGuiaPreenchimentoId(g.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-ink-900 hover:bg-ink-800 transition-colors flex items-center gap-1.5"
                      >
                        <i className="ph ph-calendar-plus text-brand-300 text-base"></i>
                        Preencher Datas ({sessoes.length}/{g.qtd_sessoes_previstas})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEnviarFaturamento(g.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <i className="ph ph-paper-plane-right text-base"></i>
                        Enviar p/ Faturamento
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <i className="ph-fill ph-check-circle text-base"></i>
                      Enviada à Clínica Elman para Faturamento TISS
                    </span>
                  )}
                </div>
              </div>
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

