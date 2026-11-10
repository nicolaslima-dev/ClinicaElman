import React, { useEffect, useMemo, useState } from 'react';
import type {
  AutorizacaoRecord,
  GuiaTissRecord,
  LoteFaturamentoRecord,
  PacienteRecord,
  TerapeutaRecord,
} from '../../types';
import {
  gerarNumeroLoteControlado,
  obterDatasOutrasGuiasMesmaAutorizacao,
  obterValorSessaoContratual,
  registrarDigitacaoGuiaNoLote,
} from '../../api/faturamento.service';
import { validarDigitacaoGuiaFaturamento } from '../../utils/faturamentoValidators';
import { formatarCPF, formatarDataBr } from '../../utils/pacienteValidators';

interface ModalDigitacaoGuiaFaturamentoProps {
  isOpen: boolean;
  onClose: () => void;
  guiaRecebida?: GuiaTissRecord | null;
  pacientes: PacienteRecord[];
  autorizacoes: AutorizacaoRecord[];
  terapeutas: TerapeutaRecord[];
  lotesExistentes: LoteFaturamentoRecord[];
  onSaved: (guia: GuiaTissRecord, lote: LoteFaturamentoRecord) => void;
}

export function ModalDigitacaoGuiaFaturamento({
  isOpen,
  onClose,
  guiaRecebida,
  pacientes,
  autorizacoes,
  terapeutas,
  lotesExistentes,
  onSaved,
}: ModalDigitacaoGuiaFaturamentoProps) {
  const [buscaPaciente, setBuscaPaciente] = useState<string>('');
  const [pacienteId, setPacienteId] = useState<string>('');
  const [autorizacaoId, setAutorizacaoId] = useState<string>('');
  const [terapeutaExecutanteId, setTerapeutaExecutanteId] = useState<string>('');
  const [numeroLote, setNumeroLote] = useState<string>('');
  const [valorUnitarioSessao, setValorUnitarioSessao] = useState<string>('150.00');
  const [valorTabeladoRef, setValorTabeladoRef] = useState<number | null>(null);

  const [datasSessoes, setDatasSessoes] = useState<
    Array<{ data_realizacao: string; quantidade: number }>
  >([]);
  const [novaDataInput, setNovaDataInput] = useState<string>('');
  const [novaQtdInput, setNovaQtdInput] = useState<string>('1');
  const [datasOutrasGuias, setDatasOutrasGuias] = useState<string[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const pacientesFiltrados = useMemo(() => {
    const termo = buscaPaciente.trim().toLowerCase();
    if (!termo) return pacientes;
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.cpf.includes(termo) ||
        p.carteira_plano.toLowerCase().includes(termo)
    );
  }, [pacientes, buscaPaciente]);

  const pacienteSelecionado = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) || null,
    [pacientes, pacienteId]
  );

  const autorizacoesDoPaciente = useMemo(
    () => autorizacoes.filter((a) => a.paciente_id === pacienteId),
    [autorizacoes, pacienteId]
  );

  const autorizacaoSelecionada = useMemo(
    () =>
      autorizacoesDoPaciente.find((a) => a.id === autorizacaoId) ||
      autorizacoes.find((a) => a.id === autorizacaoId) ||
      null,
    [autorizacoesDoPaciente, autorizacoes, autorizacaoId]
  );

  const operadoraAtualId =
    pacienteSelecionado?.plano?.operadora_id ||
    pacienteSelecionado?.plano?.operadora?.id ||
    '';

  const lotesDaMesmaOperadora = useMemo(
    () =>
      lotesExistentes.filter(
        (l) => !operadoraAtualId || l.operadora_id === operadoraAtualId
      ),
    [lotesExistentes, operadoraAtualId]
  );

  // Inicialização ao abrir o modal (seja recebendo uma guia do Terapeuta, seja nova digitação)
  useEffect(() => {
    if (!isOpen) return;
    setErroForm(null);
    setBuscaPaciente('');

    const init = async () => {
      if (guiaRecebida) {
        setPacienteId(guiaRecebida.paciente_id);
        setAutorizacaoId(guiaRecebida.autorizacao_id);
        setTerapeutaExecutanteId(
          guiaRecebida.terapeuta_executante_id ||
            guiaRecebida.terapeuta_designado_id
        );

        const sessoesIniciais = (guiaRecebida.sessoes || []).map((s) => ({
          data_realizacao: s.data_realizacao.split('T')[0],
          quantidade: s.quantidade || 1,
        }));
        setDatasSessoes(sessoesIniciais);

        if (guiaRecebida.numero_lote) {
          setNumeroLote(guiaRecebida.numero_lote);
        } else {
          const gerado = await gerarNumeroLoteControlado();
          setNumeroLote(gerado);
        }
      } else {
        const pacInicial = pacientes[0];
        const pacId = pacInicial?.id || '';
        setPacienteId(pacId);

        const autsPac = autorizacoes.filter((a) => a.paciente_id === pacId);
        const autInicial = autsPac[0] || autorizacoes[0] || null;
        setAutorizacaoId(autInicial?.id || '');
        setTerapeutaExecutanteId(
          autInicial?.terapeuta_id || terapeutas[0]?.id || ''
        );
        setDatasSessoes([]);
        setNovaDataInput(autInicial?.data_inicio?.split('T')[0] || '');
        setNovaQtdInput('1');

        const gerado = await gerarNumeroLoteControlado();
        setNumeroLote(gerado);
      }
    };

    init();
  }, [isOpen, guiaRecebida, pacientes, autorizacoes, terapeutas]);

  // Sempre que mudar Paciente ou Autorização, busca as datas de outras guias da mesma senha e o valor contratual da operadora
  useEffect(() => {
    if (!isOpen || !autorizacaoSelecionada) {
      setDatasOutrasGuias([]);
      setValorTabeladoRef(null);
      return;
    }

    let ativo = true;
    const syncContextoAutorizacao = async () => {
      const [outrasDatas, valorTabela] = await Promise.all([
        obterDatasOutrasGuiasMesmaAutorizacao(
          autorizacaoSelecionada.id,
          guiaRecebida?.id
        ),
        obterValorSessaoContratual({
          operadoraId:
            pacienteSelecionado?.plano?.operadora_id ||
            pacienteSelecionado?.plano?.operadora?.id,
          operadoraNome: pacienteSelecionado?.plano?.operadora?.nome,
          planoSaudeId: pacienteSelecionado?.plano_saude_id,
          codigoTuss: autorizacaoSelecionada.codigo_tuss,
        }),
      ]);

      if (!ativo) return;
      setDatasOutrasGuias(outrasDatas);
      setValorTabeladoRef(valorTabela);

      if (guiaRecebida?.valor_unitario_sessao && guiaRecebida.valor_unitario_sessao > 0) {
        setValorUnitarioSessao(guiaRecebida.valor_unitario_sessao.toFixed(2));
      } else if (valorTabela && valorTabela > 0) {
        setValorUnitarioSessao(valorTabela.toFixed(2));
      } else if (
        autorizacaoSelecionada.valor_unitario_sessao &&
        autorizacaoSelecionada.valor_unitario_sessao > 0
      ) {
        setValorUnitarioSessao(
          autorizacaoSelecionada.valor_unitario_sessao.toFixed(2)
        );
      }

      if (!guiaRecebida) {
        setTerapeutaExecutanteId(autorizacaoSelecionada.terapeuta_id);
        setNovaDataInput(autorizacaoSelecionada.data_inicio.split('T')[0]);
      }
    };

    syncContextoAutorizacao();
    return () => {
      ativo = false;
    };
  }, [isOpen, autorizacaoSelecionada, pacienteSelecionado, guiaRecebida]);

  // Motor de Validação em Tempo Real (Periodicidade Semanal ISO + Saldo Total + Vigência Campo 4 + Limite de 10 datas)
  const resultadoValidacao = useMemo(() => {
    const vlrNum = Number(valorUnitarioSessao.replace(',', '.')) || 0;
    return validarDigitacaoGuiaFaturamento({
      autorizacao: autorizacaoSelecionada,
      datasSessoes,
      datasOutrasGuiasMesmaSenha: datasOutrasGuias,
      terapeutaExecutanteId,
      valorUnitarioInformado: vlrNum,
      valorTabeladoOperadora: valorTabeladoRef,
    });
  }, [
    autorizacaoSelecionada,
    datasSessoes,
    datasOutrasGuias,
    terapeutaExecutanteId,
    valorUnitarioSessao,
    valorTabeladoRef,
  ]);

  if (!isOpen) return null;

  const handleTrocarPaciente = (novoPacId: string) => {
    setPacienteId(novoPacId);
    const auts = autorizacoes.filter((a) => a.paciente_id === novoPacId);
    const primeiraAut = auts[0] || null;
    setAutorizacaoId(primeiraAut?.id || '');
    setDatasSessoes([]);
    setErroForm(null);
  };

  const handleGerarNovoLoteAleatorio = async () => {
    const novo = await gerarNumeroLoteControlado();
    setNumeroLote(novo);
  };

  const handleAdicionarDataSessao = () => {
    setErroForm(null);
    if (!autorizacaoSelecionada) {
      setErroForm('Selecione primeiro uma Autorização ativa.');
      return;
    }
    if (!novaDataInput) {
      setErroForm('Informe a data de realização da sessão.');
      return;
    }
    if (datasSessoes.length >= 10) {
      setErroForm('Trava TISS: Máximo de 10 datas por guia atingido.');
      return;
    }

    const qtdNum = Number(novaQtdInput) || 1;
    const novas = [
      ...datasSessoes,
      { data_realizacao: novaDataInput, quantidade: qtdNum },
    ].sort((a, b) => a.data_realizacao.localeCompare(b.data_realizacao));

    setDatasSessoes(novas);
  };

  const handleRemoverDataSessao = (index: number) => {
    setDatasSessoes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalizarDigitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!numeroLote.trim()) {
      setErroForm('Informe ou gere o Número do Lote para vincular a guia.');
      return;
    }

    if (!resultadoValidacao.conforme) {
      setErroForm(resultadoValidacao.errosBloqueantes[0]);
      return;
    }

    const vlrNum = Number(valorUnitarioSessao.replace(',', '.')) || 0;
    if (vlrNum <= 0) {
      setErroForm('O Valor da Sessão deve ser maior que zero.');
      return;
    }

    setSalvando(true);
    const { data, lote, error } = await registrarDigitacaoGuiaNoLote({
      guia_id: guiaRecebida?.id || null,
      paciente_id: pacienteId,
      autorizacao_id: autorizacaoId,
      terapeuta_executante_id: terapeutaExecutanteId,
      numero_lote: numeroLote.trim(),
      valor_unitario_sessao: vlrNum,
      datas_sessoes: datasSessoes,
    });
    setSalvando(false);

    if (error || !data || !lote) {
      setErroForm(error || 'Não foi possível finalizar a digitação da guia.');
      return;
    }

    onSaved(data, lote);
  };

  const valorUnitarioNum = Number(valorUnitarioSessao.replace(',', '.')) || 0;
  const qtdTotalSessoesGuia = datasSessoes.reduce(
    (acc, s) => acc + (Number(s.quantidade) || 1),
    0
  );
  const valorTotalGuia = qtdTotalSessoesGuia * valorUnitarioNum;

  const formLabelClass =
    'block text-xs font-semibold text-ink-500 mb-1.5 uppercase tracking-wide';
  const formInputClass =
    'w-full bg-ink-50 border border-ink-200 rounded-xl py-2.5 px-3.5 text-sm text-ink-800 transition-all outline-none focus:bg-white focus:border-brand-400 focus:ring-[3px] focus:ring-brand-500/10';

  return (
    <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-ink-100 my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-ink-100 flex justify-between items-center bg-ink-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-900 text-brand-300 flex items-center justify-center shadow-sm">
              <i className="ph ph-receipt text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-ink-900">
                {guiaRecebida
                  ? `Recebimento e Conferência de Guia #${guiaRecebida.numero_guia_prestador}`
                  : 'Digitação de Guia de Atendimento no Faturamento'}
              </h3>
              <p className="text-xs text-ink-500">
                Busca do paciente, conferência de Autorização/Termo/Periodicidade Semanal ISO, atribuição de Lote e até 10 datas por guia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-ink-100 transition-colors cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleFinalizarDigitacao} className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {erroForm && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
              <i className="ph ph-warning-octagon text-lg shrink-0"></i>
              <span>{erroForm}</span>
            </div>
          )}

          {/* BLOCO 1: Busca do Paciente e Carregamento Automático da Autorização */}
          <div className="bg-ink-50/60 p-5 rounded-2xl border border-ink-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                <i className="ph ph-user-focus text-base"></i>
                1. Identificação do Paciente e Autorização Concedida
              </span>
              {pacienteSelecionado?.plano?.operadora && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200">
                  Operadora: {pacienteSelecionado.plano.operadora.nome} • TISS{' '}
                  {pacienteSelecionado.plano.operadora.versao_tiss}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {!guiaRecebida && (
                <div className="md:col-span-4">
                  <label className={formLabelClass}>Filtrar Paciente (Nome/CPF)</label>
                  <input
                    type="text"
                    value={buscaPaciente}
                    onChange={(e) => setBuscaPaciente(e.target.value)}
                    placeholder="Digite nome ou CPF..."
                    className={formInputClass}
                  />
                </div>
              )}

              <div className={guiaRecebida ? 'md:col-span-6' : 'md:col-span-4'}>
                <label className={formLabelClass}>Nome do Paciente</label>
                <select
                  value={pacienteId}
                  disabled={Boolean(guiaRecebida)}
                  onChange={(e) => handleTrocarPaciente(e.target.value)}
                  className={formInputClass}
                >
                  {pacientesFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — CPF {formatarCPF(p.cpf)} ({p.plano?.operadora?.nome || 'Convênio'})
                    </option>
                  ))}
                </select>
              </div>

              <div className={guiaRecebida ? 'md:col-span-6' : 'md:col-span-4'}>
                <label className={formLabelClass}>Número da Autorização (Senha Ativa)</label>
                <select
                  value={autorizacaoId}
                  disabled={Boolean(guiaRecebida)}
                  onChange={(e) => setAutorizacaoId(e.target.value)}
                  className={formInputClass}
                >
                  {autorizacoesDoPaciente.length === 0 ? (
                    <option value="">Nenhuma autorização cadastrada para este paciente</option>
                  ) : (
                    autorizacoesDoPaciente.map((aut) => (
                      <option key={aut.id} value={aut.id}>
                        Senha #{aut.numero_autorizacao} — TUSS {aut.codigo_tuss} ({aut.quantidade_total_sessoes} sessões)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Resumo de Conformidade da Autorização Concedida */}
            {autorizacaoSelecionada ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-ink-100">
                  <span className="text-[11px] font-semibold text-ink-400 uppercase block">
                    Termo Autorizado (TUSS)
                  </span>
                  <p className="text-xs font-bold text-ink-900 mt-1">
                    <span className="font-mono text-brand-700">
                      {autorizacaoSelecionada.codigo_tuss}
                    </span>{' '}
                    — {autorizacaoSelecionada.descricao_termo}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-ink-100">
                  <span className="text-[11px] font-semibold text-ink-400 uppercase block">
                    Campo 4 (Início) até Validade
                  </span>
                  <p className="text-xs font-mono font-bold text-ink-900 mt-1">
                    {formatarDataBr(autorizacaoSelecionada.data_inicio)} até{' '}
                    {formatarDataBr(autorizacaoSelecionada.data_fim)}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-ink-100">
                  <span className="text-[11px] font-semibold text-ink-400 uppercase block">
                    Periodicidade Semanal Autorizada
                  </span>
                  <p className="text-xs font-bold text-brand-700 mt-1">
                    Máx. {autorizacaoSelecionada.quantidade_sessoes_semanais} sessão(ões) / semana ISO
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    resultadoValidacao.saldoAutorizacao.estourouSaldoTotal
                      ? 'bg-red-50 border-red-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-ink-500 uppercase block">
                    Saldo Total da Senha
                  </span>
                  <p
                    className={`text-xs font-bold mt-1 ${
                      resultadoValidacao.saldoAutorizacao.estourouSaldoTotal
                        ? 'text-red-700'
                        : 'text-emerald-800'
                    }`}
                  >
                    {resultadoValidacao.saldoAutorizacao.totalAcumulado} /{' '}
                    {resultadoValidacao.saldoAutorizacao.totalAutorizado} sessões (Restam:{' '}
                    {Math.max(
                      0,
                      resultadoValidacao.saldoAutorizacao.saldoRestanteAposGuia
                    )}
                    )
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Este paciente ainda não possui uma Autorização ativa. Cadastre a autorização em <strong>Autorizações & Guias</strong>.
              </div>
            )}
          </div>

          {/* BLOCO 2: Número do Lote (Aleatório / Controlado), Terapeuta e Valor da Sessão */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-2xl border border-ink-200">
            <div className="md:col-span-5">
              <label className={formLabelClass}>
                2. Número do Lote (Aleatório / Controlado)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={numeroLote}
                  onChange={(e) => setNumeroLote(e.target.value)}
                  placeholder="Ex: 849201"
                  className={`${formInputClass} font-mono font-bold text-ink-900`}
                />
                <button
                  type="button"
                  onClick={handleGerarNovoLoteAleatorio}
                  title="Gerar Número de Lote Aleatório Único"
                  className="px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="ph ph-shuffle text-sm"></i>
                  Gerar Lote
                </button>
              </div>
              {lotesDaMesmaOperadora.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-ink-400">Lotes abertos desta operadora:</span>
                  {lotesDaMesmaOperadora.slice(0, 4).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setNumeroLote(l.numero_lote)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                        numeroLote === l.numero_lote
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-ink-50 text-ink-600 border-ink-200 hover:bg-ink-100'
                      }`}
                    >
                      #{l.numero_lote} ({l.quantidade_guias}g)
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-4">
              <label className={formLabelClass}>Terapeuta na Guia (Conferência)</label>
              <select
                value={terapeutaExecutanteId}
                onChange={(e) => setTerapeutaExecutanteId(e.target.value)}
                className={formInputClass}
              >
                {terapeutas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.conselho} {t.numero_conselho})
                    {autorizacaoSelecionada?.terapeuta_id === t.id ? ' ★ Designado' : ''}
                  </option>
                ))}
              </select>
              {resultadoValidacao.divergenciaTerapeuta && (
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  ⚠ Diferente do terapeuta designado na autorização ({autorizacaoSelecionada?.terapeuta?.nome}).
                </p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className={formLabelClass}>Valor da Sessão (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valorUnitarioSessao}
                onChange={(e) => setValorUnitarioSessao(e.target.value)}
                className={`${formInputClass} font-mono font-bold text-emerald-700`}
              />
              {valorTabeladoRef !== null && (
                <p className="text-[11px] text-ink-500 mt-1">
                  Tabela do Plano:{' '}
                  <strong className="font-mono text-ink-800">
                    R$ {valorTabeladoRef.toFixed(2).replace('.', ',')}
                  </strong>
                </p>
              )}
            </div>
          </div>

          {/* BLOCO 3: Inserção das Datas dos Atendimentos (Máximo 10 Datas por Guia) */}
          <div className="bg-white p-5 rounded-2xl border border-ink-200 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <i className="ph ph-calendar-check text-brand-600 text-lg"></i>
                  3. Datas das Sessões Realizadas na Guia (Máximo 10 datas)
                </h4>
                <p className="text-xs text-ink-500">
                  Cada sessão deve obedecer o Campo 4 ({formatarDataBr(autorizacaoSelecionada?.data_inicio || '')}) e a periodicidade semanal de{' '}
                  {autorizacaoSelecionada?.quantidade_sessoes_semanais || 1}x/semana.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  datasSessoes.length >= 10
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
              >
                {datasSessoes.length} / 10 datas inseridas nesta guia
              </span>
            </div>

            {/* Barra de Adição de Data */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-ink-50 p-3.5 rounded-xl border border-ink-100">
              <div className="md:col-span-6">
                <label className={formLabelClass}>Data da Sessão</label>
                <input
                  type="date"
                  value={novaDataInput}
                  min={autorizacaoSelecionada?.data_inicio?.split('T')[0]}
                  max={autorizacaoSelecionada?.data_fim?.split('T')[0]}
                  onChange={(e) => setNovaDataInput(e.target.value)}
                  className={formInputClass}
                />
              </div>
              <div className="md:col-span-3">
                <label className={formLabelClass}>Qtd. na Data (Padrão = 1)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={novaQtdInput}
                  onChange={(e) => setNovaQtdInput(e.target.value)}
                  className={`${formInputClass} font-mono`}
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="button"
                  disabled={datasSessoes.length >= 10 || !autorizacaoSelecionada}
                  onClick={handleAdicionarDataSessao}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-ink-300 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <i className="ph ph-plus-bold"></i>
                  Inserir Data ({datasSessoes.length}/10)
                </button>
              </div>
            </div>

            {/* Tabela das Datas Inseridas na Guia */}
            <div className="border border-ink-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-ink-700">
                <thead>
                  <tr className="bg-ink-50 border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase">
                    <th className="p-3 w-16">#</th>
                    <th className="p-3">Data da Sessão</th>
                    <th className="p-3">Termo Autorizado</th>
                    <th className="p-3 text-center">Qtd.</th>
                    <th className="p-3 text-right">Valor Unit.</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {datasSessoes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-ink-400">
                        Nenhuma data inserida nesta guia. Adicione até 10 datas de atendimento acima.
                      </td>
                    </tr>
                  ) : (
                    datasSessoes.map((sessao, idx) => (
                      <tr key={`${sessao.data_realizacao}-${idx}`} className="hover:bg-ink-50/50">
                        <td className="p-3 font-mono font-bold text-ink-500">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="p-3 font-mono font-bold text-ink-900">
                          {formatarDataBr(sessao.data_realizacao)}
                        </td>
                        <td className="p-3 text-ink-600">
                          {autorizacaoSelecionada?.codigo_tuss} —{' '}
                          {autorizacaoSelecionada?.descricao_termo}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold ${
                              sessao.quantidade === 1
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {sessao.quantidade}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          R$ {valorUnitarioNum.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-ink-900">
                          R${' '}
                          {(sessao.quantidade * valorUnitarioNum)
                            .toFixed(2)
                            .replace('.', ',')}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoverDataSessao(idx)}
                            className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Painel de Conferência de Periodicidade Semanal (Semana ISO) */}
            {resultadoValidacao.semanasIso.length > 0 && (
              <div className="bg-ink-50/70 p-4 rounded-xl border border-ink-100 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
                  <i className="ph ph-ArrowsClockwise text-brand-600"></i>
                  Conferência Automática de Periodicidade Semanal (Semana ISO)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {resultadoValidacao.semanasIso.map((sem) => (
                    <div
                      key={sem.chaveSemana}
                      className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                        sem.excedeuLimite
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-white border-emerald-200 text-ink-800'
                      }`}
                    >
                      <div>
                        <p className="font-bold">
                          {sem.chaveSemana} ({sem.intervaloLabel})
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Datas nesta guia:{' '}
                          {sem.datasGuiaAtual.map((d) => formatarDataBr(d)).join(', ')}
                          {sem.datasOutrasGuias.length > 0 &&
                            ` (+${sem.datasOutrasGuias.length} em outra guia)`}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs shrink-0 ${
                          sem.excedeuLimite
                            ? 'bg-red-600 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sem.totalNaSemana} / {sem.limiteSemanal} sem.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Erros Bloqueantes ou Avisos de Conferência em Tempo Real */}
            {resultadoValidacao.errosBloqueantes.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1">
                <p className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                  <i className="ph ph-shield-warning text-base"></i>
                  Pendências que impedem a finalização da guia no lote:
                </p>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                  {resultadoValidacao.errosBloqueantes.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {resultadoValidacao.avisos.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                {resultadoValidacao.avisos.map((av, i) => (
                  <p key={i} className="text-xs text-amber-800 font-medium">
                    • {av}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé Contábil e Botão de Finalização */}
          <div className="bg-brand-50/70 p-4 rounded-2xl border border-brand-100 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] uppercase font-semibold text-ink-500 block">
                  Total de Sessões na Guia
                </span>
                <strong className="text-base font-bold text-ink-900">
                  {qtdTotalSessoesGuia} sessão(ões)
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold text-ink-500 block">
                  Valor Total da Guia
                </span>
                <strong className="text-xl font-heading font-bold text-brand-700">
                  R$ {valorTotalGuia.toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-ink-600 bg-white border border-ink-200 hover:bg-ink-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando || !resultadoValidacao.conforme}
                className="bg-ink-900 hover:bg-ink-800 disabled:bg-ink-300 text-white font-semibold py-2.5 px-6 rounded-full text-xs transition-all flex items-center gap-2 shadow-soft cursor-pointer"
              >
                <i className="ph ph-check-circle text-base text-brand-300"></i>
                {salvando
                  ? 'Gravando no Lote...'
                  : `Finalizar e Vincular ao Lote #${numeroLote || '...'}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

