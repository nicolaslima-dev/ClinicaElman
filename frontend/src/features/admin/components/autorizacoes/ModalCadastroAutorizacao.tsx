import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  CreateAutorizacaoDTO,
  PacienteRecord,
  ProcedimentoTussRecord,
  TerapeutaRecord,
} from '@/features/admin/types';
import {
  formatarCPF,
  formatarDataBr,
  somarDiasDataIso,
} from '@/features/admin/utils/pacienteValidators';

interface ModalCadastroAutorizacaoProps {
  isOpen: boolean;
  pacientes: PacienteRecord[];
  terapeutas: TerapeutaRecord[];
  procedimentosTuss: ProcedimentoTussRecord[];
  onClose: () => void;
  onSalvar: (dados: CreateAutorizacaoDTO) => Promise<boolean>;
  onAbrirCadastroTerapeuta: () => void;
}

export function ModalCadastroAutorizacao({
  isOpen,
  pacientes,
  terapeutas,
  procedimentosTuss,
  onClose,
  onSalvar,
  onAbrirCadastroTerapeuta,
}: ModalCadastroAutorizacaoProps) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [pacienteId, setPacienteId] = useState('');
  const [numeroAutorizacao, setNumeroAutorizacao] = useState('');
  const [codigoTuss, setCodigoTuss] = useState('');
  const [descricaoTermo, setDescricaoTermo] = useState('');
  const [usarTermoCustomizado, setUsarTermoCustomizado] = useState(false);

  const hojeIso = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hojeIso);
  const [dataFim, setDataFim] = useState(() => somarDiasDataIso(hojeIso, 60));

  const [quantidadeTotalSessoes, setQuantidadeTotalSessoes] = useState<string>('20');
  const [quantidadeSessoesSemanais, setQuantidadeSessoesSemanais] = useState<string>('2');
  const [terapeutaId, setTerapeutaId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Emissão imediata da 1ª Guia SP/SADT
  const [emitirPrimeiraGuia, setEmitirPrimeiraGuia] = useState(true);
  const [qtdSessoesPrimeiraGuia, setQtdSessoesPrimeiraGuia] = useState<string>('10');

  useEffect(() => {
    if (!isOpen) return;
    setErro(null);

    const pacInicial = pacientes[0];
    setPacienteId(pacInicial?.id || '');
    setNumeroAutorizacao('');

    const procInicial = procedimentosTuss[0];
    setCodigoTuss(procInicial?.codigo_tuss || '50000470');
    setDescricaoTermo(
      procInicial?.descricao || 'Sessão de Psicoterapia / Terapia ABA Individual'
    );
    setUsarTermoCustomizado(false);

    const diasPadrao =
      pacInicial?.plano?.operadora?.dias_validade_autorizacao || 60;
    setDataInicio(hojeIso);
    setDataFim(somarDiasDataIso(hojeIso, diasPadrao));

    setQuantidadeTotalSessoes('20');
    setQuantidadeSessoesSemanais('2');
    setTerapeutaId(terapeutas[0]?.id || '');
    setObservacoes('');
    setEmitirPrimeiraGuia(true);
    setQtdSessoesPrimeiraGuia('10');
  }, [isOpen]);

  const pacienteSelecionado = useMemo(
    () => pacientes.find(p => p.id === pacienteId),
    [pacientes, pacienteId]
  );

  const operadora = pacienteSelecionado?.plano?.operadora;

  const handleTrocarPaciente = (novoPacId: string) => {
    setPacienteId(novoPacId);
    const pac = pacientes.find(p => p.id === novoPacId);
    const dias = pac?.plano?.operadora?.dias_validade_autorizacao || 60;
    if (dataInicio) {
      setDataFim(somarDiasDataIso(dataInicio, dias));
    }
  };

  const handleTrocarDataInicio = (novaDataInicio: string) => {
    setDataInicio(novaDataInicio);
    const dias = operadora?.dias_validade_autorizacao || 60;
    if (novaDataInicio) {
      setDataFim(somarDiasDataIso(novaDataInicio, dias));
    }
  };

  const handleTrocarProcedimento = (novoCodigo: string) => {
    setCodigoTuss(novoCodigo);
    const proc = procedimentosTuss.find(p => p.codigo_tuss === novoCodigo);
    if (proc) {
      setDescricaoTermo(proc.descricao);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!pacienteId) {
      setErro('Selecione o paciente titular da autorização.');
      return;
    }
    if (!numeroAutorizacao.trim()) {
      setErro('Informe o Número da Autorização (Senha concedida pelo plano).');
      return;
    }
    if (!codigoTuss.trim() || !descricaoTermo.trim()) {
      setErro('Informe o Termo Autorizado (Código TUSS e Descrição).');
      return;
    }
    if (!dataInicio || !dataFim) {
      setErro('Informe a Data Início (Campo 4) e a Data Fim da autorização.');
      return;
    }
    if (dataFim < dataInicio) {
      setErro('A Data Fim não pode ser anterior à Data Início.');
      return;
    }
    const qtdTotal = Number(quantidadeTotalSessoes);
    const qtdSemanal = Number(quantidadeSessoesSemanais);
    if (qtdTotal <= 0 || qtdSemanal <= 0) {
      setErro('As quantidades total e semanal de sessões devem ser maiores que zero.');
      return;
    }
    if (qtdSemanal > qtdTotal) {
      setErro('A quantidade semanal não pode ser maior que a quantidade total autorizada.');
      return;
    }
    if (!terapeutaId) {
      setErro('Selecione o Terapeuta designado para o atendimento.');
      return;
    }

    setSalvando(true);
    const ok = await onSalvar({
      paciente_id: pacienteId,
      terapeuta_id: terapeutaId,
      numero_autorizacao: numeroAutorizacao.trim(),
      codigo_tuss: codigoTuss.trim(),
      descricao_termo: descricaoTermo.trim(),
      data_inicio: dataInicio,
      data_fim: dataFim,
      quantidade_total_sessoes: qtdTotal,
      quantidade_sessoes_semanais: qtdSemanal,
      observacoes: observacoes.trim() || null,
      emitir_primeira_guia: emitirPrimeiraGuia,
      qtd_sessoes_primeira_guia: Math.min(10, Math.min(qtdTotal, Number(qtdSessoesPrimeiraGuia) || 10)),
    });
    setSalvando(false);
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-3xl overflow-hidden z-10 flex flex-col max-h-[92vh] fade-in"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-ink-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <i className="ph ph-key text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-ink-900">
                Cadastro de Autorização Concedida pelo Plano
              </h3>
              <p className="text-xs text-ink-500">
                Registre a senha autorizada, vigência (Campo 4), quantidades e o Terapeuta designado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto space-y-6 flex-1">
          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning-circle text-lg shrink-0"></i>
              <span>{erro}</span>
            </div>
          )}

          {/* 1. SELEÇÃO DO PACIENTE + HERANÇA TISS */}
          <div>
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <i className="ph ph-user text-brand-600 text-sm"></i>
              1. Paciente e Plano Vinculado
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Paciente Cadastrado <span className="text-red-500">*</span>
                </label>
                <select
                  value={pacienteId}
                  onChange={e => handleTrocarPaciente(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-medium text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                >
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} • CPF: {formatarCPF(p.cpf)} • {p.plano?.operadora?.nome || 'Convênio'} (TISS {p.plano?.operadora?.versao_tiss || '4.03.00'})
                    </option>
                  ))}
                </select>
              </div>

              {pacienteSelecionado && (
                <div className="md:col-span-12 bg-brand-50/60 border border-brand-100 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Operadora / Plano
                    </span>
                    <span className="text-xs font-bold text-ink-900 mt-0.5 block truncate">
                      {operadora?.nome} • {pacienteSelecionado.plano?.nome_plano}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Versão TISS da Guia
                    </span>
                    <span className="text-xs font-bold font-mono text-brand-800 mt-0.5 block">
                      Padrão {operadora?.versao_tiss || '4.03.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Carteira do Plano
                    </span>
                    <span className="text-xs font-mono font-semibold text-ink-800 mt-0.5 block">
                      {pacienteSelecionado.carteira_plano}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Registro ANS
                    </span>
                    <span className="text-xs font-mono font-semibold text-ink-800 mt-0.5 block">
                      {operadora?.registro_ans || '005711'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. DADOS DA AUTORIZAÇÃO E TERMO AUTORIZADO */}
          <div className="pt-5 border-t border-ink-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ph ph-file-lock text-brand-600 text-sm"></i>
                2. Senha, Termo Autorizado e Vigência (Campo 4)
              </h4>
              <label className="flex items-center gap-1.5 text-xs text-ink-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarTermoCustomizado}
                  onChange={e => setUsarTermoCustomizado(e.target.checked)}
                  className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Digitar outro código TUSS manualmente
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Número da Autorização (Senha) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={numeroAutorizacao}
                  onChange={e => setNumeroAutorizacao(e.target.value)}
                  placeholder="Ex: AUTH-2026-994810"
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono font-semibold text-brand-800 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              {!usarTermoCustomizado ? (
                <div className="md:col-span-8">
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">
                    Termo Autorizado (Tabela TUSS) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={codigoTuss}
                    onChange={e => handleTrocarProcedimento(e.target.value)}
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  >
                    {procedimentosTuss.map(proc => (
                      <option key={proc.codigo_tuss} value={proc.codigo_tuss}>
                        {proc.codigo_tuss} — {proc.descricao} ({proc.conselho_obrigatorio})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">
                      Código TUSS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={codigoTuss}
                      onChange={e => setCodigoTuss(e.target.value)}
                      placeholder="Ex: 50000470"
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                      required
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">
                      Descrição do Termo Autorizado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={descricaoTermo}
                      onChange={e => setDescricaoTermo(e.target.value)}
                      placeholder="Descrição do procedimento..."
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                      required
                    />
                  </div>
                </>
              )}

              {/* Datas e Quantidades */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-brand-800 mb-1.5">
                  Data Início (Campo 4 TISS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => handleTrocarDataInicio(e.target.value)}
                  className="w-full bg-brand-50/40 border border-brand-300 rounded-xl p-2.5 text-sm font-medium text-ink-900 outline-none focus:bg-white focus:border-brand-500"
                  required
                />
                <span className="text-[10px] text-brand-700 mt-1 block">
                  Visível em &ldquo;4 – Data da Autorização&rdquo;
                </span>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Data Fim (Validade) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Qtd. Total de Sessões <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={quantidadeTotalSessoes}
                  onChange={e => {
                    setQuantidadeTotalSessoes(e.target.value);
                    const val = Number(e.target.value);
                    if (val > 0 && val < 10) setQtdSessoesPrimeiraGuia(String(val));
                  }}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-semibold text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Qtd. Sessões Semanais <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={quantidadeSessoesSemanais}
                  onChange={e => setQuantidadeSessoesSemanais(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-semibold text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. TERAPEUTA DESIGNADO E EMISSÃO DA GUIA */}
          <div className="pt-5 border-t border-ink-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ph ph-stethoscope text-brand-600 text-sm"></i>
                3. Terapeuta Designado & Emissão da Guia TISS
              </h4>
              <button
                type="button"
                onClick={onAbrirCadastroTerapeuta}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <i className="ph ph-plus-circle"></i> Cadastrar Novo Terapeuta
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Terapeuta Designado para o Atendimento <span className="text-red-500">*</span>
                </label>
                <select
                  value={terapeutaId}
                  onChange={e => setTerapeutaId(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-medium text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                >
                  {terapeutas.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.conselho} {t.numero_conselho}/{t.uf_conselho} • {t.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Observações da Regulação
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                />
              </div>

              {/* Box Emissão Automática da 1ª Guia TISS */}
              <div className="md:col-span-12 bg-ink-50/80 border border-ink-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-start gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={emitirPrimeiraGuia}
                    onChange={e => setEmitirPrimeiraGuia(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-ink-900 block">
                      Já gerar e enviar a 1ª Guia TISS SP/SADT para o Terapeuta designado
                    </span>
                    <span className="text-xs text-ink-500">
                      A guia será gerada na versão TISS <strong>{operadora?.versao_tiss || '4.03.00'}</strong> com o Campo 4 preenchido em <strong>{formatarDataBr(dataInicio)}</strong>.
                    </span>
                  </div>
                </label>

                {emitirPrimeiraGuia && (
                  <div className="w-40">
                    <label className="block text-[11px] font-semibold text-ink-600 mb-1">
                      Sessões na 1ª Guia (máx 10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={Math.min(10, Number(quantidadeTotalSessoes) || 10)}
                      value={qtdSessoesPrimeiraGuia}
                      onChange={e => setQtdSessoesPrimeiraGuia(e.target.value)}
                      className="w-full bg-white border border-ink-200 rounded-lg p-2 text-sm font-bold text-center text-brand-700 outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 bg-ink-50 border-t border-ink-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-600 bg-white border border-ink-200 hover:bg-ink-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-ink-900 hover:bg-ink-800 disabled:opacity-60 transition-all flex items-center gap-2 shadow-soft"
          >
            <i className="ph ph-check-circle text-brand-300 text-lg"></i>
            {salvando
              ? 'Processando...'
              : emitirPrimeiraGuia
              ? 'Salvar Autorização e Emitir Guia TISS'
              : 'Salvar Autorização'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

