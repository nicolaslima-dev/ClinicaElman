import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  CorrigirFalhaAuditoriaDTO,
  GuiaTissRecord,
  TerapeutaRecord,
} from '@/features/admin/types';
import { formatarDataBr } from '../../utils/pacienteValidators';

interface AuditoriaDrawerProps {
  isOpen: boolean;
  guia: GuiaTissRecord | null;
  valorTabelaOperadora: number | null;
  terapeutas: TerapeutaRecord[];
  salvando?: boolean;
  onClose: () => void;
  onAplicarCorrecao: (dto: CorrigirFalhaAuditoriaDTO) => Promise<void>;
}

export function AuditoriaDrawer({
  isOpen,
  guia,
  valorTabelaOperadora,
  terapeutas,
  salvando = false,
  onClose,
  onAplicarCorrecao,
}: AuditoriaDrawerProps) {
  const [terapeutaExecId, setTerapeutaExecId] = useState<string>('');
  const [valorUnitario, setValorUnitario] = useState<string>('');
  const [sessoesEditaveis, setSessoesEditaveis] = useState<
    Array<{ data_realizacao: string; quantidade: number }>
  >([]);

  useEffect(() => {
    if (!guia) return;
    setTerapeutaExecId(
      guia.terapeuta_executante_id || guia.terapeuta_designado_id
    );
    const vlr = Number(
      guia.valor_unitario_sessao ??
        guia.sessoes?.[0]?.valor_unitario ??
        guia.autorizacao?.valor_unitario_sessao ??
        135
    );
    setValorUnitario(vlr.toFixed(2));
    setSessoesEditaveis(
      (guia.sessoes || []).map((s) => ({
        data_realizacao: s.data_realizacao.split('T')[0],
        quantidade: Number(s.quantidade) || 1,
      }))
    );
  }, [guia]);

  if (!guia) return null;

  const criticas = guia.criticas_auditoria || [];
  const temCriticaDataRepetida = criticas.some(
    (c) => c.codigo_critica === 'CRIT_DATA_REPETIDA'
  );
  const temCriticaQtd = criticas.some(
    (c) => c.codigo_critica === 'CRIT_QTD_DIFERENTE_1'
  );
  const temCriticaTerapeuta = criticas.some(
    (c) => c.codigo_critica === 'CRIT_TERAPEUTA_DIVERGENTE'
  );
  const temCriticaValor = criticas.some(
    (c) => c.codigo_critica === 'CRIT_VALOR_TABELA_PLANO'
  );

  // Mapa para destacar visualmente quais datas estão duplicadas no editor
  const contagemDatas = new Map<string, number>();
  sessoesEditaveis.forEach((s) => {
    contagemDatas.set(
      s.data_realizacao,
      (contagemDatas.get(s.data_realizacao) || 0) + 1
    );
  });

  const handleDeduplicarLocal = () => {
    const vistas = new Set<string>();
    const unicas: Array<{ data_realizacao: string; quantidade: number }> = [];
    for (const s of sessoesEditaveis) {
      if (!vistas.has(s.data_realizacao)) {
        vistas.add(s.data_realizacao);
        unicas.push(s);
      }
    }
    setSessoesEditaveis(unicas);
  };

  const handleNormalizarQtd1Local = () => {
    setSessoesEditaveis((prev) =>
      prev.map((s) => ({ ...s, quantidade: 1 }))
    );
  };

  const handleAlinharTerapeutaLocal = () => {
    setTerapeutaExecId(guia.terapeuta_designado_id);
  };

  const handleAplicarValorTabelaLocal = () => {
    if (valorTabelaOperadora && valorTabelaOperadora > 0) {
      setValorUnitario(valorTabelaOperadora.toFixed(2));
    }
  };

  const handleSalvarAjustesManuais = async () => {
    const vlrNum = Number(valorUnitario.replace(',', '.')) || 0;
    await onAplicarCorrecao({
      guia_id: guia.id,
      novo_terapeuta_executante_id: terapeutaExecId,
      novo_valor_unitario: vlrNum,
      novas_sessoes: sessoesEditaveis,
    });
  };

  const handleCorrigirTudoAutomaticamente = async () => {
    await onAplicarCorrecao({
      guia_id: guia.id,
      deduplicar_datas: true,
      normalizar_quantidade_1: true,
      alinhar_terapeuta_designado: true,
      aplicar_valor_tabela: true,
    });
  };

  return createPortal(
    <>
      <div
        id="drawerOverlay"
        onClick={onClose}
        className={`fixed inset-0 bg-ink-950/50 backdrop-blur-sm transition-opacity duration-300 z-50 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      ></div>

      <div
        id="drawerPanel"
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl transform transition-transform duration-300 ease-out z-[60] flex flex-col border-l border-ink-100 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-ink-100 flex justify-between items-center bg-ink-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-ink-900 text-brand-300 font-mono text-xs font-bold">
                Guia #{guia.numero_guia_prestador}
              </span>
              {guia.numero_lote && (
                <span className="px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                  Lote #{guia.numero_lote}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold font-heading text-ink-900 mt-1">
              Conferência e Resolução de Críticas Pré-XML
            </h2>
            <p className="text-xs text-ink-500">
              Paciente: <strong>{guia.paciente?.nome}</strong> •{' '}
              {guia.plano?.operadora?.nome} (TISS {guia.versao_tiss})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 p-2 rounded-full hover:bg-ink-100 transition-colors cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6" id="drawerContent">
          {/* Diagnóstico das 4 Críticas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Diagnóstico do Validador de Lote (4 Regras Críticas)
              </span>
              {criticas.length > 0 && (
                <button
                  type="button"
                  disabled={salvando}
                  onClick={handleCorrigirTudoAutomaticamente}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <i className="ph ph-magic-wand text-sm"></i>
                  Sanar Todas as Falhas (1 Clique)
                </button>
              )}
            </div>

            {criticas.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
                <i className="ph ph-check-circle-fill text-2xl text-emerald-600"></i>
                <div>
                  <p className="text-xs font-bold">
                    Guia 100% Conforme nas 4 Críticas TISS!
                  </p>
                  <p className="text-[11px] opacity-90">
                    Nenhuma data repetida, todas as quantidades iguais a 1, terapeuta validado e valor de acordo com a tabela do plano.
                  </p>
                </div>
              </div>
            ) : (
              criticas.map((crit) => (
                <div
                  key={crit.id}
                  className="bg-red-50/90 border-l-4 border-red-600 p-4 rounded-r-xl space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      <i className="ph ph-warning-octagon-fill text-red-600 text-base"></i>
                      {crit.titulo}
                    </h4>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    {crit.mensagem_detalhe}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-lg border border-red-200">
                      <span className="text-ink-400 block uppercase font-semibold text-[10px]">
                        Encontrado na Guia:
                      </span>
                      <strong className="text-red-700 font-mono">
                        {crit.valor_encontrado}
                      </strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                      <span className="text-ink-400 block uppercase font-semibold text-[10px]">
                        Esperado pela Regra:
                      </span>
                      <strong className="text-emerald-700 font-mono">
                        {crit.valor_esperado}
                      </strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Seção 1 e 2: Conferência de Datas e Quantidades das Sessões */}
          <div className="bg-ink-50/60 p-4 rounded-2xl border border-ink-200 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs font-bold text-ink-800 uppercase tracking-wide">
                1 & 2. Datas das Sessões e Quantidades ({sessoesEditaveis.length}/10)
              </span>
              <div className="flex gap-2">
                {temCriticaDataRepetida && (
                  <button
                    type="button"
                    onClick={handleDeduplicarLocal}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold cursor-pointer"
                  >
                    Remover Datas Repetidas
                  </button>
                )}
                {temCriticaQtd && (
                  <button
                    type="button"
                    onClick={handleNormalizarQtd1Local}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold cursor-pointer"
                  >
                    Forçar Quantidades = 1
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {sessoesEditaveis.map((sessao, idx) => {
                const isRepetida =
                  (contagemDatas.get(sessao.data_realizacao) || 0) > 1;
                const isQtdInvalida = Number(sessao.quantidade) !== 1;

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border text-xs ${
                      isRepetida || isQtdInvalida
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-ink-200'
                    }`}
                  >
                    <div className="col-span-1 font-mono font-bold text-ink-400">
                      #{idx + 1}
                    </div>
                    <div className="col-span-6">
                      <input
                        type="date"
                        value={sessao.data_realizacao}
                        min={guia.data_autorizacao_campo4?.split('T')[0]}
                        max={guia.data_validade_senha?.split('T')[0]}
                        onChange={(e) => {
                          const nova = e.target.value;
                          setSessoesEditaveis((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, data_realizacao: nova } : item
                            )
                          );
                        }}
                        className="w-full bg-ink-50 border border-ink-200 rounded-lg px-2.5 py-1.5 font-mono text-xs"
                      />
                      {isRepetida && (
                        <span className="text-[10px] text-red-600 font-bold block mt-0.5">
                          Data repetida ({formatarDataBr(sessao.data_realizacao)})
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5">
                      <span className="text-[11px] text-ink-400">Qtd:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={sessao.quantidade}
                        onChange={(e) => {
                          const q = Number(e.target.value) || 1;
                          setSessoesEditaveis((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, quantidade: q } : item
                            )
                          );
                        }}
                        className={`w-16 border rounded-lg px-2 py-1.5 font-mono font-bold text-xs text-center ${
                          isQtdInvalida
                            ? 'bg-red-100 border-red-400 text-red-800'
                            : 'bg-ink-50 border-ink-200 text-ink-900'
                        }`}
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      {sessoesEditaveis.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSessoesEditaveis((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-red-500 hover:text-red-700 font-semibold text-[11px] cursor-pointer"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 3: Conferência do Terapeuta (Designado vs. Executante) */}
          <div className="bg-ink-50/60 p-4 rounded-2xl border border-ink-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-ink-800 uppercase tracking-wide">
                3. Conferência do Profissional Terapeuta
              </span>
              {temCriticaTerapeuta && (
                <button
                  type="button"
                  onClick={handleAlinharTerapeutaLocal}
                  className="px-2.5 py-1 rounded-lg bg-brand-100 hover:bg-brand-200 text-brand-800 text-[11px] font-bold cursor-pointer"
                >
                  Alinhar ao Terapeuta Designado
                </button>
              )}
            </div>

            <div className="text-xs text-ink-600 bg-white p-3 rounded-xl border border-ink-100">
              Terapeuta inicialmente designado na Guia/Autorização:{' '}
              <strong className="text-ink-900">
                {guia.terapeuta_designado?.nome} ({guia.terapeuta_designado?.conselho}{' '}
                {guia.terapeuta_designado?.numero_conselho})
              </strong>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-500 mb-1 uppercase">
                Terapeuta Executante no Faturamento
              </label>
              <select
                value={terapeutaExecId}
                onChange={(e) => setTerapeutaExecId(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-xl py-2.5 px-3 text-xs font-medium text-ink-900"
              >
                {terapeutas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} — {t.conselho} {t.numero_conselho}
                    {t.id === guia.terapeuta_designado_id
                      ? ' (★ Designado na Guia)'
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção 4: Conferência do Valor da Sessão conforme Tabela do Plano */}
          <div className="bg-ink-50/60 p-4 rounded-2xl border border-ink-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-ink-800 uppercase tracking-wide">
                4. Conferência de Valor (Tabela do Plano de Saúde)
              </span>
              { (temCriticaValor ||
                (valorTabelaOperadora &&
                  Math.abs(Number(valorUnitario) - valorTabelaOperadora) > 0.009)) && (
                <button
                  type="button"
                  onClick={handleAplicarValorTabelaLocal}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold cursor-pointer"
                >
                  Aplicar Valor da Tabela (R${' '}
                  {valorTabelaOperadora?.toFixed(2).replace('.', ',')})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-ink-100">
                <span className="text-[10px] font-semibold uppercase text-ink-400 block">
                  Valor Tabelado ({guia.plano?.operadora?.nome})
                </span>
                <strong className="text-sm font-mono font-bold text-emerald-700">
                  {valorTabelaOperadora
                    ? `R$ ${valorTabelaOperadora.toFixed(2).replace('.', ',')}`
                    : 'Não tabelado'}
                </strong>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-1">
                  Valor Unitário na Guia (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  className="w-full bg-white border border-ink-200 rounded-xl py-2 px-3 font-mono font-bold text-sm text-ink-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-100 bg-ink-50 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-ink-200 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={salvando}
            onClick={handleSalvarAjustesManuais}
            className="px-6 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded-full text-xs font-semibold shadow-soft flex items-center gap-2 transition-all cursor-pointer"
          >
            <i className="ph ph-shield-check text-base text-brand-300"></i>
            {salvando ? 'Revalidando Guia...' : 'Salvar Correções e Revalidar Guia'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
