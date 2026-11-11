import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GuiaTissRecord } from '@/features/admin/types';
import {
  formatarDataBr,
  obterChaveSemana,
  validarNovaDataSessaoGuia,
} from '@/features/admin/utils/pacienteValidators';

interface ModalPreencherGuiaTerapeutaProps {
  guia: GuiaTissRecord | null;
  onClose: () => void;
  onSalvarDatas: (guiaId: string, datas: string[]) => Promise<boolean>;
  onAbrirAssinatura: (guia: GuiaTissRecord) => void;
  onEnviarFaturamento: (guiaId: string, datasAtuais: string[]) => Promise<boolean>;
  onImprimirGuia: (guia: GuiaTissRecord) => void;
}

export function ModalPreencherGuiaTerapeuta({
  guia,
  onClose,
  onSalvarDatas,
  onAbrirAssinatura,
  onEnviarFaturamento,
  onImprimirGuia,
}: ModalPreencherGuiaTerapeutaProps) {
  const [datas, setDatas] = useState<string[]>([]);
  const [novaData, setNovaData] = useState('');
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [avisoSemanal, setAvisoSemanal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!guia) return;
    const atuais = (guia.sessoes || []).map(s => s.data_realizacao.split('T')[0]).sort();
    setDatas(atuais);
    setNovaData(guia.data_autorizacao_campo4.split('T')[0]);
    setErroValidacao(null);
    setAvisoSemanal(null);
  }, [guia]);

  if (!guia) return null;

  const campo4 = guia.data_autorizacao_campo4.split('T')[0];
  const validade = guia.data_validade_senha.split('T')[0];
  const limiteGuia = Math.min(10, guia.qtd_sessoes_previstas || 10);
  const limiteSemanal = guia.autorizacao?.quantidade_sessoes_semanais;
  const jaEnviada = guia.status_guia === 'enviada_faturamento';

  const handleAdicionarData = () => {
    setErroValidacao(null);
    setAvisoSemanal(null);

    const check = validarNovaDataSessaoGuia({
      novaData,
      datasExistentes: datas,
      dataAutorizacaoCampo4: campo4,
      dataValidadeSenha: validade,
      limiteSessoesGuia: limiteGuia,
      limiteSemanal,
    });

    if (!check.valido) {
      setErroValidacao(check.erro || 'Data inválida.');
      return;
    }

    if (check.avisoSemanal) {
      setAvisoSemanal(check.avisoSemanal);
    }

    const atualizadas = [...datas, novaData].sort();
    setDatas(atualizadas);
  };

  const handleRemoverData = (dtRemover: string) => {
    setDatas(prev => prev.filter(d => d !== dtRemover));
    setErroValidacao(null);
  };

  const handleSalvarRascunho = async () => {
    setSalvando(true);
    const ok = await onSalvarDatas(guia.id, datas);
    setSalvando(false);
    if (ok) {
      setErroValidacao(null);
    }
  };

  const handleConcluirEEnviar = async () => {
    setErroValidacao(null);
    if (datas.length === 0) {
      setErroValidacao('Insira ao menos 1 data de realização de sessão antes de enviar para faturamento.');
      return;
    }
    if (!guia.assinatura_paciente_base64) {
      setErroValidacao(
        'Colete a assinatura do paciente ou responsável legal (botão "Assinar Guia") antes de enviar para a Clínica Elman faturar.'
      );
      return;
    }

    setEnviando(true);
    const ok = await onEnviarFaturamento(guia.id, datas);
    setEnviando(false);
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Bottom sheet no celular, modal centralizado a partir de sm */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-preencher-guia-titulo"
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-ink-100 w-full max-w-3xl overflow-hidden z-10 flex flex-col max-h-[94dvh] sm:max-h-[92dvh] fade-in"
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-7 sm:py-5 border-b border-ink-100 flex items-start sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-brand-50 text-brand-600 items-center justify-center shrink-0">
              <i className="ph ph-calendar-check text-xl"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="modal-preencher-guia-titulo"
                  className="text-base sm:text-lg font-bold font-heading text-ink-900 leading-snug"
                >
                  <span className="hidden sm:inline">Preenchimento de Sessões — </span>Guia #{guia.numero_guia_prestador}
                </h3>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  TISS {guia.versao_tiss}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5 break-words">
                Paciente: <strong>{guia.paciente?.nome}</strong>
                <span className="hidden sm:inline"> • </span>
                <br className="sm:hidden" />
                Termo: <strong>{guia.codigo_tuss} ({guia.descricao_termo})</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-ink-400 hover:text-ink-700 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors shrink-0"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-7 overflow-y-auto overscroll-contain space-y-4 sm:space-y-5 flex-1">
          {/* Alerta Regulatório Obrigatório do Campo 4 */}
          <div className="bg-brand-50/80 border-2 border-brand-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                4
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-brand-900">
                  Campo 4 – Data da Autorização
                  <span className="hidden sm:inline"> (Data Início Obrigatória)</span>: {formatarDataBr(campo4)}
                </h4>
                <p className="text-[11px] sm:text-xs text-brand-800 mt-0.5">
                  O sistema bloqueia automaticamente datas anteriores a <strong>{formatarDataBr(campo4)}</strong> ou posteriores à validade (<strong>{formatarDataBr(validade)}</strong>).
                </p>
              </div>
            </div>

            <div className="sm:text-right text-xs bg-white px-3.5 py-2 rounded-lg border border-brand-200">
              <span className="text-ink-400 block text-[10px] uppercase font-semibold">
                Periodicidade Autorizada
              </span>
              <strong className="text-ink-900">
                {limiteSemanal ? `Até ${limiteSemanal}x por semana` : 'Conforme guia'} • Máx. {limiteGuia} sessões
              </strong>
            </div>
          </div>

          {erroValidacao && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning-circle text-lg shrink-0"></i>
              <span>{erroValidacao}</span>
            </div>
          )}

          {avisoSemanal && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning text-lg shrink-0"></i>
              <span>{avisoSemanal}</span>
            </div>
          )}

          {/* Inserção de Data */}
          {!jaEnviada && (
            <div className="bg-ink-50/60 border border-ink-100 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2.5 sm:gap-3">
              <div className="flex-1 sm:min-w-[220px]">
                <label
                  htmlFor="nova-data-sessao"
                  className="block text-xs font-semibold text-ink-700 mb-1.5"
                >
                  Inserir Data de Realização da Sessão ({datas.length}/{limiteGuia})
                </label>
                <input
                  id="nova-data-sessao"
                  type="date"
                  value={novaData}
                  min={campo4}
                  max={validade}
                  onChange={e => setNovaData(e.target.value)}
                  className="w-full bg-white border border-ink-200 rounded-xl p-2.5 text-base sm:text-sm font-medium text-ink-900 outline-none focus:border-brand-500 min-h-[44px]"
                />
              </div>

              <button
                type="button"
                onClick={handleAdicionarData}
                disabled={datas.length >= limiteGuia}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px] sm:h-[42px] sm:min-h-0"
              >
                <i className="ph ph-plus-circle text-brand-300 text-lg"></i>
                Adicionar Data
              </button>
            </div>
          )}

          {/* Lista das Datas Preenchidas (1 a 10) — Celular: lista em cards */}
          <div className="sm:hidden">
            {datas.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 text-center text-ink-400 text-xs">
                Nenhuma data de sessão lançada ainda. Respeite a data inicial do Campo 4 ({formatarDataBr(campo4)}).
              </div>
            ) : (
              <ul className="space-y-2" aria-label="Datas de realização lançadas">
                {datas.map((dt, idx) => (
                  <li
                    key={dt}
                    className="flex items-center gap-3 p-2.5 pr-2 rounded-xl border border-ink-100 bg-white shadow-xs"
                  >
                    <span className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-semibold text-sm text-ink-900">
                        {formatarDataBr(dt)}
                      </p>
                      <p className="text-[11px] text-ink-500 truncate">
                        Semana {obterChaveSemana(dt)} • Qtd 1
                      </p>
                    </div>
                    {!jaEnviada && (
                      <button
                        type="button"
                        onClick={() => handleRemoverData(dt)}
                        aria-label={`Remover data ${formatarDataBr(dt)}`}
                        className="w-10 h-10 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                      >
                        <i className="ph ph-trash text-lg"></i>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Lista das Datas Preenchidas (1 a 10) — sm+: tabela */}
          <div className="hidden sm:block border border-ink-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-ink-600">
              <thead className="bg-ink-50 text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Sessão</th>
                  <th className="py-3 px-4">Data de Realização</th>
                  <th className="py-3 px-4">Semana Ref.</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {datas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-400 text-xs">
                      Nenhuma data de sessão lançada ainda. Respeite a data inicial do Campo 4 ({formatarDataBr(campo4)}).
                    </td>
                  </tr>
                ) : (
                  datas.map((dt, idx) => (
                    <tr key={dt} className="hover:bg-ink-50/50">
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-brand-700">
                        #{String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-ink-900">
                        {formatarDataBr(dt)}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-ink-500">
                        {obterChaveSemana(dt)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold text-ink-800">
                        1
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {!jaEnviada && (
                          <button
                            type="button"
                            onClick={() => handleRemoverData(dt)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remover data"
                          >
                            <i className="ph ph-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bloco de Assinatura do Paciente / Responsável Legal */}
          <div className="bg-ink-50/70 border border-ink-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  guia.assinatura_paciente_base64
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}
              >
                <i className="ph ph-signature text-xl"></i>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-ink-900">
                  Assinatura do Paciente<span className="hidden sm:inline"> ou Responsável Legal</span>
                </h4>
                {guia.assinatura_paciente_base64 ? (
                  <p className="text-xs text-emerald-700 font-medium break-words">
                    Assinado por <strong>{guia.nome_assinante || guia.paciente?.nome}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-ink-500">
                    Pendente de coleta de assinatura para liberação ao faturamento.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {guia.assinatura_paciente_base64 && (
                <img
                  src={guia.assinatura_paciente_base64}
                  alt="Assinatura coletada"
                  className="h-10 bg-white border border-ink-200 rounded-lg px-2 object-contain max-w-[45%] sm:max-w-none"
                />
              )}
              {!jaEnviada && (
                <button
                  type="button"
                  onClick={async () => {
                    await onSalvarDatas(guia.id, datas);
                    onAbrirAssinatura(guia);
                  }}
                  className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <i className="ph ph-signature text-base"></i>
                  {guia.assinatura_paciente_base64 ? 'Refazer Assinatura' : 'Coletar Assinatura'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer (empilhado no celular, ação principal no topo) */}
        <div className="px-4 py-3 sm:px-7 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 bg-ink-50 border-t border-ink-100 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onImprimirGuia(guia)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-full text-xs font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 transition-colors flex items-center gap-1.5"
          >
            <i className="ph ph-printer text-base text-brand-600"></i>
            <span className="sm:hidden">Visualizar Guia SP/SADT</span>
            <span className="hidden sm:inline">Visualizar / Imprimir Guia SP/SADT</span>
          </button>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3">
            {!jaEnviada && (
              <>
                <button
                  type="button"
                  onClick={handleSalvarRascunho}
                  disabled={salvando}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-medium text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 transition-colors"
                >
                  {salvando ? 'Salvando...' : 'Salvar Datas'}
                </button>

                <button
                  type="button"
                  onClick={handleConcluirEEnviar}
                  disabled={enviando}
                  className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-full text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 transition-all flex items-center gap-2 shadow-soft"
                >
                  <i className="ph ph-paper-plane-right text-lg"></i>
                  {enviando ? 'Enviando...' : 'Enviar para Faturamento'}
                </button>
              </>
            )}
            {jaEnviada && (
              <span className="justify-center px-4 py-2 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <i className="ph-fill ph-check-circle"></i> Guia já enviada para o Faturamento
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
