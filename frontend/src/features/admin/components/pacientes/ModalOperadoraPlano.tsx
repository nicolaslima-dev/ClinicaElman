import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  VERSOES_TISS_DISPONIVEIS,
  type CreateOperadoraDTO,
  type CreatePlanoSaudeDTO,
  type OperadoraRecord,
  type VersaoTiss,
} from '@/features/admin/types';

export type ModoModalConvenio =
  | { tipo: 'nova_operadora' }
  | { tipo: 'editar_operadora'; operadora: OperadoraRecord }
  | { tipo: 'novo_plano'; operadora: OperadoraRecord };

interface ModalOperadoraPlanoProps {
  modo: ModoModalConvenio | null;
  onClose: () => void;
  onSalvarOperadora: (dados: CreateOperadoraDTO, idEdicao?: string) => Promise<boolean>;
  onSalvarPlano: (dados: CreatePlanoSaudeDTO) => Promise<boolean>;
}

export function ModalOperadoraPlano({
  modo,
  onClose,
  onSalvarOperadora,
  onSalvarPlano,
}: ModalOperadoraPlanoProps) {
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Campos Operadora
  const [nomeOperadora, setNomeOperadora] = useState('');
  const [registroAns, setRegistroAns] = useState('');
  const [versaoTiss, setVersaoTiss] = useState<VersaoTiss>('4.03.00');
  const [usarVersaoCustomizada, setUsarVersaoCustomizada] = useState(false);
  const [versaoCustomizada, setVersaoCustomizada] = useState('');
  const [tamanhoMatricula, setTamanhoMatricula] = useState<string>('');
  const [diasValidadeAutorizacao, setDiasValidadeAutorizacao] = useState<string>('60');
  const [codigoPrestador, setCodigoPrestador] = useState('');
  const [planoInicialNome, setPlanoInicialNome] = useState('Plano Padrão / Nacional');
  const [planoInicialAcomodacao, setPlanoInicialAcomodacao] = useState('Apartamento');

  // Campos Novo Plano
  const [nomePlano, setNomePlano] = useState('');
  const [acomodacaoPlano, setAcomodacaoPlano] = useState('Apartamento');

  useEffect(() => {
    setErroForm(null);
    if (!modo) return;

    if (modo.tipo === 'nova_operadora') {
      setNomeOperadora('');
      setRegistroAns('');
      setVersaoTiss('4.03.00');
      setUsarVersaoCustomizada(false);
      setVersaoCustomizada('');
      setTamanhoMatricula('');
      setDiasValidadeAutorizacao('60');
      setCodigoPrestador('');
      setPlanoInicialNome('Plano Padrão / Nacional');
      setPlanoInicialAcomodacao('Apartamento');
    } else if (modo.tipo === 'editar_operadora') {
      const op = modo.operadora;
      setNomeOperadora(op.nome);
      setRegistroAns(op.registro_ans || '');
      const existeNaLista = VERSOES_TISS_DISPONIVEIS.some(v => v.versao === op.versao_tiss);
      if (existeNaLista) {
        setVersaoTiss(op.versao_tiss);
        setUsarVersaoCustomizada(false);
        setVersaoCustomizada('');
      } else {
        setUsarVersaoCustomizada(true);
        setVersaoCustomizada(op.versao_tiss);
      }
      setTamanhoMatricula(op.tamanho_matricula ? String(op.tamanho_matricula) : '');
      setDiasValidadeAutorizacao(String(op.dias_validade_autorizacao || 60));
      setCodigoPrestador(op.codigo_prestador || '');
    } else if (modo.tipo === 'novo_plano') {
      setNomePlano('');
      setAcomodacaoPlano('Apartamento');
    }
  }, [modo]);

  if (!modo) return null;

  const versoes4x = VERSOES_TISS_DISPONIVEIS.filter(v => v.familia === '4.x');
  const versoes3x = VERSOES_TISS_DISPONIVEIS.filter(v => v.familia === '3.x');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (modo.tipo === 'novo_plano') {
      if (!nomePlano.trim()) {
        setErroForm('Informe o nome do Plano de Saúde.');
        return;
      }
      setSalvando(true);
      const ok = await onSalvarPlano({
        operadora_id: modo.operadora.id,
        nome_plano: nomePlano.trim(),
        acomodacao: acomodacaoPlano,
      });
      setSalvando(false);
      if (ok) onClose();
      return;
    }

    if (!nomeOperadora.trim()) {
      setErroForm('Informe o nome da Operadora / Convênio.');
      return;
    }

    const versaoFinal = usarVersaoCustomizada ? versaoCustomizada.trim() : versaoTiss;
    if (!versaoFinal) {
      setErroForm('Informe ou selecione a Versão TISS pré-definida da operadora.');
      return;
    }

    setSalvando(true);
    const ok = await onSalvarOperadora(
      {
        nome: nomeOperadora.trim(),
        registro_ans: registroAns.trim() || null,
        versao_tiss: versaoFinal,
        tamanho_matricula: tamanhoMatricula ? Number(tamanhoMatricula) : null,
        dias_validade_autorizacao: diasValidadeAutorizacao ? Number(diasValidadeAutorizacao) : 60,
        codigo_prestador: codigoPrestador.trim() || null,
        plano_inicial_nome: modo.tipo === 'nova_operadora' ? planoInicialNome : undefined,
        plano_inicial_acomodacao: modo.tipo === 'nova_operadora' ? planoInicialAcomodacao : undefined,
      },
      modo.tipo === 'editar_operadora' ? modo.operadora.id : undefined
    );
    setSalvando(false);
    if (ok) onClose();
  };

  const tituloModal =
    modo.tipo === 'nova_operadora'
      ? 'Pré-Cadastro de Operadora & Versão TISS'
      : modo.tipo === 'editar_operadora'
      ? `Editar Operadora: ${modo.operadora.nome}`
      : `Novo Plano — ${modo.operadora.nome}`;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-xl overflow-hidden z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto fade-in"
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-ink-100 flex items-center justify-between gap-2.5 sm:gap-3 bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <i className={`ph ${modo.tipo === 'novo_plano' ? 'ph-cards' : 'ph-buildings'} text-base sm:text-xl`}></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold font-heading text-ink-900 leading-snug break-words">
                {modo.tipo === 'nova_operadora' ? (
                  <>
                    Nova Operadora <span className="hidden sm:inline">& Versão TISS</span>
                  </>
                ) : modo.tipo === 'editar_operadora' ? (
                  `Editar Operadora: ${modo.operadora.nome}`
                ) : (
                  `Novo Plano — ${modo.operadora.nome}`
                )}
              </h3>
              <p className="text-[11px] sm:text-xs text-ink-500 leading-tight mt-0.5">
                {modo.tipo === 'novo_plano'
                  ? `Padrão TISS herdado da operadora (${modo.operadora.versao_tiss}).`
                  : 'Defina a versão TISS e regras de matrícula para os planos.'}
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

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {erroForm && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning-circle text-base shrink-0"></i>
              <span>{erroForm}</span>
            </div>
          )}

          {modo.tipo === 'novo_plano' ? (
            <>
              <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 block">
                    Operadora Vinculada
                  </span>
                  <span className="text-sm font-bold text-ink-900">{modo.operadora.nome}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-brand-700 border border-brand-200">
                  Padrão TISS {modo.operadora.versao_tiss}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Nome do Plano Comercial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nomePlano}
                  onChange={e => setNomePlano(e.target.value)}
                  placeholder="Ex: Top Nacional, Efetivo Prata, Unimed Flex..."
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Padrão de Acomodação / Rede</label>
                <select
                  value={acomodacaoPlano}
                  onChange={e => setAcomodacaoPlano(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                >
                  <option value="Ambulatorial">Ambulatorial / Clínico</option>
                  <option value="Enfermaria">Enfermaria</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Domiciliar">Atendimento Domiciliar / Home Care</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">
                    Nome da Operadora / Convênio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nomeOperadora}
                    onChange={e => setNomeOperadora(e.target.value)}
                    placeholder="Ex: BRADESCO SAÚDE, SULAMÉRICA, CASSI..."
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">Registro ANS (6 díg.)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={registroAns}
                    onChange={e => setRegistroAns(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Ex: 005711"
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  />
                </div>
              </div>

              {/* Versão TISS Pré-definida */}
              <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-brand-800 uppercase tracking-wide flex items-center gap-1.5">
                    <i className="ph ph-file-code text-base text-brand-600"></i>
                    Versão TISS Pré-definida da Operadora <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usarVersaoCustomizada}
                      onChange={e => setUsarVersaoCustomizada(e.target.checked)}
                      className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                    Outra subversão
                  </label>
                </div>

                {!usarVersaoCustomizada ? (
                  <select
                    value={versaoTiss}
                    onChange={e => setVersaoTiss(e.target.value)}
                    className="w-full bg-white border border-brand-200 rounded-xl p-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500"
                  >
                    <optgroup label="Padrão TISS 4.x (Vigente ANS)">
                      {versoes4x.map(item => (
                        <option key={item.versao} value={item.versao}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Padrão TISS 3.x (Convênios Legados / Autogestões)">
                      {versoes3x.map(item => (
                        <option key={item.versao} value={item.versao}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={versaoCustomizada}
                    onChange={e => setVersaoCustomizada(e.target.value)}
                    placeholder="Digite a versão TISS específica (ex: 3.05.01 ou 4.04.00)"
                    className="w-full bg-white border border-brand-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:border-brand-500"
                  />
                )}
                <p className="text-[11px] text-ink-500">
                  Ao vincular um paciente a qualquer plano desta operadora, as Guias TISS e o XML usarão esta versão automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">Dígitos da Carteira</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={tamanhoMatricula}
                    onChange={e => setTamanhoMatricula(e.target.value)}
                    placeholder="Opcional (ex: 15)"
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">Validade Senha (dias)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={diasValidadeAutorizacao}
                    onChange={e => setDiasValidadeAutorizacao(e.target.value)}
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">Cód. Prestador</label>
                  <input
                    type="text"
                    value={codigoPrestador}
                    onChange={e => setCodigoPrestador(e.target.value)}
                    placeholder="Cód. Clínica na Op."
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  />
                </div>
              </div>

              {modo.tipo === 'nova_operadora' && (
                <div className="pt-4 border-t border-ink-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">
                      Primeiro Plano Comercial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={planoInicialNome}
                      onChange={e => setPlanoInicialNome(e.target.value)}
                      placeholder="Ex: Plano Padrão / Nacional"
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">Acomodação</label>
                    <select
                      value={planoInicialAcomodacao}
                      onChange={e => setPlanoInicialAcomodacao(e.target.value)}
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                    >
                      <option value="Apartamento">Apartamento</option>
                      <option value="Enfermaria">Enfermaria</option>
                      <option value="Ambulatorial">Ambulatorial / Clínico</option>
                      <option value="Domiciliar">Domiciliar</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
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
            disabled={salvando}
            className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium text-white bg-ink-900 hover:bg-ink-800 disabled:opacity-60 transition-all flex items-center gap-2 shadow-soft"
          >
            <i className="ph ph-check-circle text-brand-300 text-lg"></i>
            {salvando ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

