import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  CreatePacienteDTO,
  OperadoraRecord,
  PacienteRecord,
} from '@/features/admin/types';
import {
  UFS_BRASIL,
  buscarEnderecoViaCep,
  calcularIdade,
  formatarCEP,
  formatarCPF,
  limparDigitos,
  validarCPF,
  validarCarteiraPorOperadora,
} from '@/features/admin/utils/pacienteValidators';

interface ModalCadastroPacienteProps {
  isOpen: boolean;
  pacienteEdicao: PacienteRecord | null;
  operadoras: OperadoraRecord[];
  onClose: () => void;
  onSalvar: (dados: CreatePacienteDTO, idEdicao?: string) => Promise<boolean>;
  onAbrirCadastroOperadora: () => void;
}

export function ModalCadastroPaciente({
  isOpen,
  pacienteEdicao,
  operadoras,
  onClose,
  onSalvar,
  onAbrirCadastroOperadora,
}: ModalCadastroPacienteProps) {
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Campos do Paciente
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');

  // Endereço Completo
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('RJ');

  // Vínculo Relacional (Operadora -> Plano de Saúde)
  const [operadoraSelecionadaId, setOperadoraSelecionadaId] = useState('');
  const [planoSaudeId, setPlanoSaudeId] = useState('');
  const [carteiraPlano, setCarteiraPlano] = useState('');
  const [validadeCarteira, setValidadeCarteira] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErroForm(null);

    if (pacienteEdicao) {
      setNome(pacienteEdicao.nome);
      setDataNascimento(pacienteEdicao.data_nascimento?.split('T')[0] || '');
      setCpf(formatarCPF(pacienteEdicao.cpf));
      setCep(formatarCEP(pacienteEdicao.cep));
      setLogradouro(pacienteEdicao.logradouro);
      setNumero(pacienteEdicao.numero);
      setComplemento(pacienteEdicao.complemento || '');
      setBairro(pacienteEdicao.bairro);
      setCidade(pacienteEdicao.cidade);
      setUf(pacienteEdicao.uf || 'RJ');

      const opId =
        pacienteEdicao.plano?.operadora_id ||
        operadoras.find(op => op.planos?.some(pl => pl.id === pacienteEdicao.plano_saude_id))?.id ||
        '';
      setOperadoraSelecionadaId(opId);
      setPlanoSaudeId(pacienteEdicao.plano_saude_id);
      setCarteiraPlano(pacienteEdicao.carteira_plano);
      setValidadeCarteira(pacienteEdicao.validade_carteira?.split('T')[0] || '');
    } else {
      setNome('');
      setDataNascimento('');
      setCpf('');
      setCep('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setCidade('');
      setUf('RJ');

      const primeiraOp = operadoras[0];
      const primeiroPlano = primeiraOp?.planos?.[0];
      setOperadoraSelecionadaId(primeiraOp?.id || '');
      setPlanoSaudeId(primeiroPlano?.id || '');
      setCarteiraPlano('');
      setValidadeCarteira('');
    }
  }, [isOpen, pacienteEdicao]);

  // Se uma nova operadora foi adicionada enquanto o modal estava aberto e não havia seleção
  useEffect(() => {
    if (!isOpen) return;
    if (!operadoraSelecionadaId && operadoras.length > 0) {
      setOperadoraSelecionadaId(operadoras[0].id);
      setPlanoSaudeId(operadoras[0].planos?.[0]?.id || '');
    }
  }, [operadoras, isOpen, operadoraSelecionadaId]);

  const operadoraAtual = useMemo(
    () => operadoras.find(op => op.id === operadoraSelecionadaId),
    [operadoras, operadoraSelecionadaId]
  );

  const planosDisponiveis = useMemo(
    () => operadoraAtual?.planos || [],
    [operadoraAtual]
  );

  const handleTrocarOperadora = (novaOpId: string) => {
    setOperadoraSelecionadaId(novaOpId);
    const op = operadoras.find(o => o.id === novaOpId);
    setPlanoSaudeId(op?.planos?.[0]?.id || '');
  };

  const handleCepChange = async (valor: string) => {
    const formatado = formatarCEP(valor);
    setCep(formatado);

    const limpo = limparDigitos(formatado);
    if (limpo.length === 8) {
      setBuscandoCep(true);
      const resultado = await buscarEnderecoViaCep(limpo);
      setBuscandoCep(false);
      if (resultado) {
        if (resultado.logradouro) setLogradouro(resultado.logradouro);
        if (resultado.bairro) setBairro(resultado.bairro);
        if (resultado.cidade) setCidade(resultado.cidade);
        if (resultado.uf) setUf(resultado.uf);
      }
    }
  };

  if (!isOpen) return null;

  const cpfDigitos = limparDigitos(cpf);
  const cpfValido = cpfDigitos.length === 11 && validarCPF(cpf);
  const idadeCalculada = calcularIdade(dataNascimento);
  const statusCarteira = validarCarteiraPorOperadora(
    carteiraPlano,
    operadoraAtual?.tamanho_matricula
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!nome.trim() || nome.trim().split(' ').length < 2) {
      setErroForm('Informe o nome completo do paciente (nome e sobrenome).');
      return;
    }
    if (!dataNascimento) {
      setErroForm('Informe a data de nascimento do paciente.');
      return;
    }
    if (!cpfValido) {
      setErroForm('O CPF informado é inválido. Confira os 11 dígitos verificadores.');
      return;
    }
    if (limparDigitos(cep).length !== 8 || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !uf.trim()) {
      setErroForm('Preencha o endereço completo (CEP de 8 dígitos, Logradouro, Número, Bairro, Cidade e UF).');
      return;
    }
    if (!planoSaudeId) {
      setErroForm('Selecione o Plano de Saúde vinculado a uma Operadora cadastrada.');
      return;
    }
    if (!carteiraPlano.trim()) {
      setErroForm('Informe o número da Carteira do Plano (matrícula do beneficiário).');
      return;
    }

    setSalvando(true);
    const ok = await onSalvar(
      {
        nome: nome.trim(),
        data_nascimento: dataNascimento,
        cpf: formatarCPF(cpf),
        cep: formatarCEP(cep),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || null,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        plano_saude_id: planoSaudeId,
        carteira_plano: carteiraPlano.trim(),
        validade_carteira: validadeCarteira || null,
      },
      pacienteEdicao?.id
    );
    setSalvando(false);
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-3xl overflow-hidden z-10 flex flex-col max-h-[92vh] fade-in"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-ink-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <i className={`ph ${pacienteEdicao ? 'ph-pencil-simple' : 'ph-user-plus'} text-xl`}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-ink-900">
                {pacienteEdicao ? 'Editar Cadastro de Paciente' : 'Novo Cadastro de Paciente'}
              </h3>
              <p className="text-xs text-ink-500">
                Preencha os dados cadastrais completos e vincule ao Plano de Saúde para herdar a Versão TISS.
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
          {erroForm && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i className="ph ph-warning-circle text-lg shrink-0"></i>
              <span>{erroForm}</span>
            </div>
          )}

          {/* SEÇÃO 1: IDENTIFICAÇÃO PESSOAL */}
          <div>
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <i className="ph ph-identification-card text-brand-600 text-sm"></i>
              1. Identificação do Paciente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Mariana Costa e Silva"
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-ink-600">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  {idadeCalculada !== null && (
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                      {idadeCalculada} anos
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-ink-600">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  {cpfDigitos.length === 11 && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        cpfValido ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {cpfValido ? 'CPF Válido' : 'CPF Inválido'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={cpf}
                  onChange={e => setCpf(formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full bg-ink-50 border rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white ${
                    cpfDigitos.length === 11 && !cpfValido
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-ink-200 focus:border-brand-400'
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: ENDEREÇO COMPLETO */}
          <div className="pt-5 border-t border-ink-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ph ph-map-pin text-brand-600 text-sm"></i>
                2. Endereço Completo
              </h4>
              {buscandoCep && (
                <span className="text-xs text-brand-600 flex items-center gap-1 font-medium">
                  <i className="ph ph-spinner animate-spin"></i> Consultando CEP...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  CEP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cep}
                  onChange={e => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Logradouro (Rua, Av., etc.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={e => setLogradouro(e.target.value)}
                  placeholder="Ex: Av. das Américas"
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  placeholder="Ex: 3500"
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Complemento</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={e => setComplemento(e.target.value)}
                  placeholder="Apto, Bloco, Casa..."
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Bairro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                  placeholder="Ex: Barra da Tijuca"
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="Ex: Rio de Janeiro"
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  UF <span className="text-red-500">*</span>
                </label>
                <select
                  value={uf}
                  onChange={e => setUf(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                >
                  {UFS_BRASIL.map(sigla => (
                    <option key={sigla} value={sigla}>
                      {sigla}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: PLANO DE SAÚDE E CARTEIRINHA (HERANÇA AUTOMÁTICA TISS) */}
          <div className="pt-5 border-t border-ink-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ph ph-shield-plus text-brand-600 text-sm"></i>
                3. Plano de Saúde & Carteira do Beneficiário
              </h4>
              <button
                type="button"
                onClick={onAbrirCadastroOperadora}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <i className="ph ph-plus-circle"></i> Pré-cadastrar Nova Operadora
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Operadora / Convênio <span className="text-red-500">*</span>
                </label>
                <select
                  value={operadoraSelecionadaId}
                  onChange={e => handleTrocarOperadora(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-medium text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                >
                  <option value="" disabled>
                    Selecione a Operadora...
                  </option>
                  {operadoras.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.nome} (TISS {op.versao_tiss})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Plano de Saúde <span className="text-red-500">*</span>
                </label>
                <select
                  value={planoSaudeId}
                  onChange={e => setPlanoSaudeId(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-medium text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                >
                  <option value="" disabled>
                    Selecione o Plano...
                  </option>
                  {planosDisponiveis.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.nome_plano} {pl.acomodacao ? `• ${pl.acomodacao}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* CARD AUTOMÁTICO COM AS REGRAS PRÉ-DEFINIDAS DA OPERADORA */}
              {operadoraAtual && (
                <div className="md:col-span-12 bg-brand-50/60 border border-brand-100 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Versão TISS Herdada
                    </span>
                    <span className="text-sm font-bold font-mono text-ink-900 flex items-center gap-1 mt-0.5">
                      <i className="ph ph-file-code text-brand-600"></i>
                      {operadoraAtual.versao_tiss}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Registro ANS
                    </span>
                    <span className="text-sm font-semibold font-mono text-ink-800 mt-0.5 block">
                      {operadoraAtual.registro_ans || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Padrão da Carteira
                    </span>
                    <span className="text-sm font-semibold text-ink-800 mt-0.5 block">
                      {operadoraAtual.tamanho_matricula
                        ? `${operadoraAtual.tamanho_matricula} dígitos`
                        : 'Livre'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 block">
                      Validade Senha Padrão
                    </span>
                    <span className="text-sm font-semibold text-ink-800 mt-0.5 block">
                      {operadoraAtual.dias_validade_autorizacao} dias
                    </span>
                  </div>
                </div>
              )}

              <div className="md:col-span-8">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-ink-600">
                    Carteira do Plano (Matrícula) <span className="text-red-500">*</span>
                  </label>
                  {carteiraPlano.length > 0 && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        statusCarteira.conforme
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {statusCarteira.mensagem}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={carteiraPlano}
                  onChange={e => setCarteiraPlano(e.target.value)}
                  placeholder={
                    operadoraAtual?.tamanho_matricula
                      ? `Digite os ${operadoraAtual.tamanho_matricula} dígitos da carteirinha...`
                      : 'Número da carteira do plano de saúde'
                  }
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Validade da Carteira
                </label>
                <input
                  type="date"
                  value={validadeCarteira}
                  onChange={e => setValidadeCarteira(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                />
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
              ? 'Salvando no Banco...'
              : pacienteEdicao
              ? 'Salvar Alterações'
              : 'Concluir Cadastro do Paciente'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

