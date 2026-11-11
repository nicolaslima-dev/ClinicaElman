import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  OperadoraRecord,
  PlanoProcedimentoPrecoRecord,
  ProcedimentoTussRecord,
} from '../../types';
import {
  cadastrarOuImportarCodigosTuss,
  importarContratoOperadoraEmLote,
  listarTabelaPrecosOperadoras,
  salvarPrecoContratualOperadora,
} from '../../api/faturamento.service';
import { parseLinhasContratoOperadora } from '../../utils/faturamentoValidators';

interface ModalTabelaPrecosOperadoraProps {
  isOpen: boolean;
  onClose: () => void;
  operadoras: OperadoraRecord[];
  procedimentosTuss: ProcedimentoTussRecord[];
  onUpdated: () => void;
}

export function ModalTabelaPrecosOperadora({
  isOpen,
  onClose,
  operadoras,
  procedimentosTuss,
  onUpdated,
}: ModalTabelaPrecosOperadoraProps) {
  const [abaAtiva, setAbaAtiva] = useState<'precos_operadora' | 'importar_lote' | 'novo_tuss'>(
    'precos_operadora'
  );
  const [operadoraId, setOperadoraId] = useState<string>('');
  const [planoSaudeId, setPlanoSaudeId] = useState<string>('');
  const [codigoTuss, setCodigoTuss] = useState<string>('');
  const [valorSessao, setValorSessao] = useState<string>('');
  const [numeroContrato, setNumeroContrato] = useState<string>('');
  const [vigenciaInicio, setVigenciaInicio] = useState<string>('2026-01-01');

  // Estado para Aba 2: Importação em Lote (CSV / Excel)
  const [textoImportacao, setTextoImportacao] = useState<string>('');

  // Estado para Aba 3: Cadastro de Novo Código TUSS na base da Clínica
  const [novoCodigoTuss, setNovoCodigoTuss] = useState<string>('');
  const [novaDescricaoTuss, setNovaDescricaoTuss] = useState<string>('');
  const [novoConselhoTuss, setNovoConselhoTuss] = useState<string>('CRP');
  const [novoCboTuss, setNovoCboTuss] = useState<string>('251510');

  const [precosOperadora, setPrecosOperadora] = useState<PlanoProcedimentoPrecoRecord[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const operadoraSelecionada = operadoras.find((op) => op.id === operadoraId);

  const carregarPrecos = async (opId: string) => {
    if (!opId) return;
    const { data } = await listarTabelaPrecosOperadoras(opId);
    setPrecosOperadora(data);
  };

  useEffect(() => {
    if (!isOpen) return;
    setErroForm(null);
    setMensagemSucesso(null);
    const opInicial = operadoras[0]?.id || '';
    setOperadoraId(opInicial);
    setPlanoSaudeId('');
    setCodigoTuss(procedimentosTuss[0]?.codigo_tuss || '50000470');
    setValorSessao('150.00');
    setNumeroContrato(
      operadoras[0] ? `CONTRATO-${operadoras[0].nome}-2026` : 'CONTRATO-2026'
    );
    if (opInicial) {
      carregarPrecos(opInicial);
    }
  }, [isOpen, operadoras, procedimentosTuss]);

  if (!isOpen) return null;

  const handleTrocarOperadora = (novoOpId: string) => {
    setOperadoraId(novoOpId);
    setPlanoSaudeId('');
    const op = operadoras.find((o) => o.id === novoOpId);
    if (op) {
      setNumeroContrato(`CONTRATO-${op.nome}-2026`);
    }
    carregarPrecos(novoOpId);
  };

  const handleSalvarPrecoIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);
    setMensagemSucesso(null);

    const valorNum = Number(valorSessao.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroForm('Informe um valor de sessão válido maior que zero.');
      return;
    }

    setSalvando(true);
    const { error } = await salvarPrecoContratualOperadora({
      operadora_id: operadoraId,
      plano_saude_id: planoSaudeId || null,
      codigo_tuss: codigoTuss,
      valor_sessao: valorNum,
      numero_contrato: numeroContrato,
      vigencia_inicio: vigenciaInicio,
    });
    setSalvando(false);

    if (error) {
      setErroForm(error);
      return;
    }

    setMensagemSucesso('Valor contratual salvo com sucesso para a operadora!');
    await carregarPrecos(operadoraId);
    onUpdated();
  };

  const handleImportarEmLote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);
    setMensagemSucesso(null);

    const { itens, erros } = parseLinhasContratoOperadora(textoImportacao);
    if (erros.length > 0) {
      setErroForm(erros[0]);
      return;
    }
    if (itens.length === 0) {
      setErroForm('Cole ao menos uma linha no formato CODIGO_TUSS;DESCRICAO;VALOR.');
      return;
    }

    setSalvando(true);
    const { totalImportados, error } = await importarContratoOperadoraEmLote({
      operadora_id: operadoraId,
      plano_saude_id: planoSaudeId || null,
      numero_contrato: numeroContrato,
      vigencia_inicio: vigenciaInicio,
      itens,
    });
    setSalvando(false);

    if (error) {
      setErroForm(error);
      return;
    }

    setTextoImportacao('');
    setMensagemSucesso(
      `${totalImportados} código(s) TUSS e preço(s) contratuais importados com sucesso!`
    );
    await carregarPrecos(operadoraId);
    onUpdated();
    setAbaAtiva('precos_operadora');
  };

  const handleSalvarNovoTuss = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);
    setMensagemSucesso(null);

    if (!novoCodigoTuss.trim() || !novaDescricaoTuss.trim()) {
      setErroForm('Informe o Código TUSS e a Descrição Oficial do Termo.');
      return;
    }

    setSalvando(true);
    const { error } = await cadastrarOuImportarCodigosTuss([
      {
        codigo_tuss: novoCodigoTuss.trim(),
        descricao: novaDescricaoTuss.trim(),
        tabela_dominio: '22',
        conselho_obrigatorio: novoConselhoTuss,
        cbo_prefixo: novoCboTuss,
        exige_senha: true,
      },
    ]);
    setSalvando(false);

    if (error) {
      setErroForm(error);
      return;
    }

    setCodigoTuss(novoCodigoTuss.trim());
    setNovoCodigoTuss('');
    setNovaDescricaoTuss('');
    setMensagemSucesso(
      'Código TUSS cadastrado no catálogo da clínica! Agora você pode definir o valor contratual por operadora.'
    );
    onUpdated();
    setAbaAtiva('precos_operadora');
  };

  const formLabelClass =
    'block text-xs font-semibold text-ink-500 mb-1.5 uppercase tracking-wide';
  const formInputClass =
    'w-full bg-ink-50 border border-ink-200 rounded-xl py-2.5 px-3.5 text-sm text-ink-800 transition-all outline-none focus:bg-white focus:border-brand-400 focus:ring-[3px] focus:ring-brand-500/10';

  return createPortal(
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden overscroll-contain animate-in fade-in-0 duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-ink-100 my-0 sm:my-8 max-h-[95dvh] sm:max-h-[90dvh] flex flex-col overscroll-contain">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-ink-100 flex justify-between items-center bg-ink-50/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <i className="ph ph-currency-circle-dollar text-xl"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-heading text-ink-900 truncate">
                Catálogo TUSS & Contratos por Operadora
              </h3>
              <p className="text-xs text-ink-500 line-clamp-1">
                Fluxo: 1. Contrato da operadora → 2. Importa códigos TUSS → 3. Digita/importa preços acordados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-ink-100 transition-colors cursor-pointer shrink-0"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Navegação das 3 Etapas */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 border-b border-ink-100 flex overflow-x-auto gap-2 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('precos_operadora');
              setErroForm(null);
            }}
            className={`px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              abaAtiva === 'precos_operadora'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <i className="ph ph-table text-sm"></i>
            Tabela de Preços Acordados
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('importar_lote');
              setErroForm(null);
            }}
            className={`px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              abaAtiva === 'importar_lote'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <i className="ph ph-upload-simple text-sm"></i>
            Importar Contrato (CSV)
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('novo_tuss');
              setErroForm(null);
            }}
            className={`px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              abaAtiva === 'novo_tuss'
                ? 'border-brand-600 text-brand-700 bg-brand-50/50'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <i className="ph ph-plus-circle text-sm"></i>
            Cadastrar TUSS ({procedimentosTuss.length})
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[78dvh] sm:max-h-[75vh] overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {erroForm && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning-circle text-base shrink-0"></i>
              <span>{erroForm}</span>
            </div>
          )}

          {mensagemSucesso && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-check-circle text-base shrink-0"></i>
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {/* Seletor da Operadora e Plano (Comum para Abas 1 e 2) */}
          {abaAtiva !== 'novo_tuss' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-ink-50/70 p-4 rounded-xl border border-ink-100">
              <div>
                <label className={formLabelClass}>1. Operadora / Convênio</label>
                <select
                  value={operadoraId}
                  onChange={(e) => handleTrocarOperadora(e.target.value)}
                  className={formInputClass}
                >
                  {operadoras.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nome} (TISS {op.versao_tiss})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={formLabelClass}>Plano Específico (Opcional)</label>
                <select
                  value={planoSaudeId}
                  onChange={(e) => setPlanoSaudeId(e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Todos os Planos da Operadora (Padrão)</option>
                  {(operadoraSelecionada?.planos || []).map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.nome_plano}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={formLabelClass}>Nº Contrato / Referência</label>
                <input
                  type="text"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                  placeholder="Ex: CONTRATO-2026"
                  className={formInputClass}
                />
              </div>
            </div>
          )}

          {/* ABA 1: Digitação Individual e Listagem da Tabela da Operadora */}
          {abaAtiva === 'precos_operadora' && (
            <div className="space-y-5">
              <form
                onSubmit={handleSalvarPrecoIndividual}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-brand-50/40 p-4 rounded-xl border border-brand-100"
              >
                <div className="md:col-span-6">
                  <label className={formLabelClass}>
                    Código e Termo Padrão TUSS
                  </label>
                  <select
                    value={codigoTuss}
                    onChange={(e) => setCodigoTuss(e.target.value)}
                    className={formInputClass}
                  >
                    {procedimentosTuss.map((proc) => (
                      <option key={proc.codigo_tuss} value={proc.codigo_tuss}>
                        {proc.codigo_tuss} — {proc.descricao} ({proc.conselho_obrigatorio})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={formLabelClass}>Valor Acordado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valorSessao}
                    onChange={(e) => setValorSessao(e.target.value)}
                    placeholder="150.00"
                    className={`${formInputClass} font-mono font-bold text-ink-900`}
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="w-full bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <i className="ph ph-floppy-disk text-base text-brand-300"></i>
                    Salvar Valor no Contrato
                  </button>
                </div>
              </form>

              <div className="border border-ink-100 rounded-xl overflow-x-auto">
                <div className="bg-ink-50 px-4 py-3 border-b border-ink-100 flex justify-between items-center min-w-[600px]">
                  <span className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                    Valores Contratuais Ativos — {operadoraSelecionada?.nome}
                  </span>
                  <span className="text-xs text-ink-500">
                    {precosOperadora.length} procedimento(s) precificado(s)
                  </span>
                </div>
                <table className="w-full text-left text-xs text-ink-700 min-w-[600px]">
                  <thead>
                    <tr className="bg-ink-50/40 border-b border-ink-100 text-[11px] font-semibold text-ink-400 uppercase">
                      <th className="p-3">Código TUSS</th>
                      <th className="p-3">Descrição do Procedimento</th>
                      <th className="p-3">Abrangência</th>
                      <th className="p-3">Contrato</th>
                      <th className="p-3 text-right">Valor da Sessão</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {precosOperadora.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-ink-400">
                          Nenhum preço cadastrado para esta operadora. Utilize o formulário acima ou importe via CSV.
                        </td>
                      </tr>
                    ) : (
                      precosOperadora.map((item) => (
                        <tr key={item.id} className="hover:bg-ink-50/50">
                          <td className="p-3 font-mono font-bold text-brand-700">
                            {item.codigo_tuss}
                          </td>
                          <td className="p-3 font-medium text-ink-900">
                            {item.procedimento?.descricao || 'Procedimento TUSS'}
                          </td>
                          <td className="p-3">
                            {item.plano?.nome_plano ? (
                              <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-semibold">
                                Plano: {item.plano.nome_plano}
                              </span>
                            ) : (
                              <span className="text-ink-500">Geral da Operadora</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-ink-500">
                            {item.numero_contrato || '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                            R$ {Number(item.valor_sessao).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setCodigoTuss(item.codigo_tuss);
                                setValorSessao(String(item.valor_sessao));
                                setPlanoSaudeId(item.plano_saude_id || '');
                              }}
                              className="text-brand-600 hover:text-brand-800 font-semibold underline cursor-pointer"
                            >
                              Editar Valor
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 2: Importação em Lote (CSV / Planilha da Operadora) */}
          {abaAtiva === 'importar_lote' && (
            <form onSubmit={handleImportarEmLote} className="space-y-4">
              <div className="p-4 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-600 space-y-1.5">
                <p className="font-bold text-ink-900">
                  Importação Rápida da Tabela Recebida da Operadora (CSV ou Excel):
                </p>
                <p>
                  Cole abaixo as linhas da planilha de contrato da operadora no formato{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-ink-200 font-mono text-brand-700">
                    CODIGO_TUSS;DESCRICAO_TERMO;VALOR_SESSAO
                  </code>{' '}
                  ou{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-ink-200 font-mono text-brand-700">
                    CODIGO_TUSS;VALOR_SESSAO
                  </code>
                  . O sistema cadastrará automaticamente os códigos TUSS novos e atualizará a tabela de preços da operadora selecionada.
                </p>
              </div>

              <div>
                <label className={formLabelClass}>
                  Linhas do Contrato (1 procedimento por linha)
                </label>
                <textarea
                  rows={6}
                  value={textoImportacao}
                  onChange={(e) => setTextoImportacao(e.target.value)}
                  placeholder={`50000470;Sessão de Psicoterapia / Terapia ABA Individual;165,00\n50000615;Sessão de Fonoaudiologia Individual;150,00\n50000054;Sessão de Terapia Ocupacional Individual;155,00`}
                  className={`${formInputClass} font-mono text-xs`}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <i className="ph ph-cloud-arrow-up text-base text-brand-300"></i>
                  Importar Códigos TUSS e Preços da Operadora
                </button>
              </div>
            </form>
          )}

          {/* ABA 3: Cadastrar Novo Código Padrão TUSS */}
          {abaAtiva === 'novo_tuss' && (
            <form onSubmit={handleSalvarNovoTuss} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={formLabelClass}>Código TUSS (8 dígitos ANS)</label>
                  <input
                    type="text"
                    value={novoCodigoTuss}
                    onChange={(e) => setNovoCodigoTuss(e.target.value)}
                    placeholder="Ex: 50000470"
                    className={`${formInputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={formLabelClass}>Descrição / Termo Oficial TUSS</label>
                  <input
                    type="text"
                    value={novaDescricaoTuss}
                    onChange={(e) => setNovaDescricaoTuss(e.target.value)}
                    placeholder="Ex: Sessão de Psicoterapia Individual"
                    className={formInputClass}
                  />
                </div>
                <div>
                  <label className={formLabelClass}>Conselho Profissional Exigido</label>
                  <select
                    value={novoConselhoTuss}
                    onChange={(e) => setNovoConselhoTuss(e.target.value)}
                    className={formInputClass}
                  >
                    <option value="CRP">CRP (Psicologia)</option>
                    <option value="CRFa">CRFa (Fonoaudiologia)</option>
                    <option value="CREFITO">CREFITO (Fisioterapia / TO)</option>
                    <option value="CRM">CRM (Medicina)</option>
                  </select>
                </div>
                <div>
                  <label className={formLabelClass}>CBO Padrão (6 dígitos)</label>
                  <input
                    type="text"
                    value={novoCboTuss}
                    onChange={(e) => setNovoCboTuss(e.target.value)}
                    placeholder="Ex: 251510"
                    className={`${formInputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <i className="ph ph-plus-circle text-base text-brand-300"></i>
                  Adicionar ao Catálogo TUSS da Clínica
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-ink-50 border-t border-ink-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-ink-600 bg-white border border-ink-200 hover:bg-ink-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

