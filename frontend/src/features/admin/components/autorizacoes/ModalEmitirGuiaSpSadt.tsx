import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AutorizacaoRecord, EmitirGuiaSpSadtDTO } from '@/features/admin/types';
import { formatarDataBr } from '@/features/admin/utils/pacienteValidators';

interface ModalEmitirGuiaSpSadtProps {
  autorizacao: AutorizacaoRecord | null;
  onClose: () => void;
  onEmitir: (dados: EmitirGuiaSpSadtDTO) => Promise<boolean>;
}

export function ModalEmitirGuiaSpSadt({
  autorizacao,
  onClose,
  onEmitir,
}: ModalEmitirGuiaSpSadtProps) {
  const [emitindo, setEmitindo] = useState(false);
  const [qtdSessoes, setQtdSessoes] = useState<string>('10');
  const [numeroGuiaOperadora, setNumeroGuiaOperadora] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!autorizacao) return;
    setErro(null);
    const saldo = autorizacao.saldo_disponivel ?? autorizacao.quantidade_total_sessoes;
    setQtdSessoes(String(Math.min(10, Math.max(1, saldo))));
    setNumeroGuiaOperadora(autorizacao.numero_autorizacao);
  }, [autorizacao]);

  if (!autorizacao) return null;

  const saldo = autorizacao.saldo_disponivel ?? autorizacao.quantidade_total_sessoes;
  const maxGuia = Math.min(10, saldo);
  const operadora = autorizacao.paciente?.plano?.operadora;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const qtd = Number(qtdSessoes);
    if (qtd < 1 || qtd > 10) {
      setErro('Cada Guia TISS SP/SADT comporta entre 1 e no máximo 10 sessões.');
      return;
    }
    if (qtd > saldo) {
      setErro(`O saldo restante da autorização é de ${saldo} sessão(ões).`);
      return;
    }

    setEmitindo(true);
    const ok = await onEmitir({
      autorizacao_id: autorizacao.id,
      qtd_sessoes_previstas: qtd,
      numero_guia_operadora: numeroGuiaOperadora.trim() || autorizacao.numero_autorizacao,
    });
    setEmitindo(false);
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto fade-in"
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-ink-100 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <i className="ph ph-file-plus text-base sm:text-xl"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold font-heading text-ink-900 leading-snug break-words">
                Gerar Guia TISS SP/SADT
              </h3>
              <p className="text-[11px] sm:text-xs text-ink-500 leading-tight mt-0.5">
                Emissão automática e envio ao terapeuta designado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors shrink-0 cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {erro}
            </div>
          )}

          {/* Resumo Automático da Guia */}
          <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-brand-100 pb-2">
              <span className="font-semibold text-brand-800 uppercase tracking-wider">
                Padrão TISS da Operadora
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white border border-brand-200 font-mono font-bold text-brand-700">
                {operadora?.nome || 'CONVÊNIO'} • TISS {operadora?.versao_tiss || '4.03.00'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-ink-400 block">Paciente:</span>
                <strong className="text-ink-900">{autorizacao.paciente?.nome}</strong>
              </div>
              <div>
                <span className="text-ink-400 block">Terapeuta Designado:</span>
                <strong className="text-ink-900">{autorizacao.terapeuta?.nome}</strong>
              </div>
              <div>
                <span className="text-ink-400 block">4 – Data da Autorização:</span>
                <strong className="text-brand-700 font-mono">
                  {formatarDataBr(autorizacao.data_inicio)}
                </strong>
              </div>
              <div>
                <span className="text-ink-400 block">5 – Senha / Validade:</span>
                <strong className="text-ink-900 font-mono">
                  {autorizacao.numero_autorizacao} ({formatarDataBr(autorizacao.data_fim)})
                </strong>
              </div>
              <div className="col-span-2">
                <span className="text-ink-400 block">Termo Autorizado (TUSS):</span>
                <strong className="text-ink-900">
                  {autorizacao.codigo_tuss} — {autorizacao.descricao_termo}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Qtd. de Sessões nesta Guia (máx 10) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={maxGuia}
                value={qtdSessoes}
                onChange={e => setQtdSessoes(e.target.value)}
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-bold text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                required
              />
              <span className="text-[11px] text-ink-400 mt-1 block">
                Saldo disponível na senha: <strong>{saldo} sessões</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Nº Guia na Operadora (Campo 3)
              </label>
              <input
                type="text"
                value={numeroGuiaOperadora}
                onChange={e => setNumeroGuiaOperadora(e.target.value)}
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-ink-50 border-t border-ink-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-ink-600 bg-white border border-ink-200 hover:bg-ink-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={emitindo || saldo <= 0}
            className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium text-white bg-ink-900 hover:bg-ink-800 disabled:opacity-60 transition-all flex items-center gap-2 shadow-soft"
          >
            <i className="ph ph-paper-plane-tilt text-brand-300 text-lg"></i>
            {emitindo ? 'Gerando Guia...' : 'Gerar Guia e Enviar ao Terapeuta'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

