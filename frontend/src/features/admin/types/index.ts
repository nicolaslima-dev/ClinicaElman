/**
 * Versões oficiais do Padrão TISS da ANS utilizadas pelas operadoras de saúde brasileiras
 * (Famílias 4.x e 3.x vigentes/aceitas nos portais de convênios e conectores como Orizon, Funcional, Tasy, etc.)
 * Também suporta entrada customizada caso algum convênio específico utilize subversão própria.
 */
export type VersaoTiss =
  | '4.03.00'
  | '4.02.00'
  | '4.01.00'
  | '4.00.01'
  | '4.00.00'
  | '3.05.00'
  | '3.04.01'
  | '3.04.00'
  | '3.03.03'
  | '3.03.02'
  | '3.03.01'
  | '3.02.02'
  | '3.02.01'
  | '3.02.00'
  | '3.01.00'
  | '3.00.01'
  | '3.00.00'
  | (string & {});

export const VERSOES_TISS_DISPONIVEIS: {
  versao: VersaoTiss;
  label: string;
  familia: '4.x' | '3.x';
}[] = [
  { versao: '4.03.00', label: 'TISS 4.03.00 (ANS Atual / Orizon)', familia: '4.x' },
  { versao: '4.02.00', label: 'TISS 4.02.00 (ANS)', familia: '4.x' },
  { versao: '4.01.00', label: 'TISS 4.01.00 (ANS)', familia: '4.x' },
  { versao: '4.00.01', label: 'TISS 4.00.01 (ANS)', familia: '4.x' },
  { versao: '4.00.00', label: 'TISS 4.00.00 (ANS)', familia: '4.x' },
  { versao: '3.05.00', label: 'TISS 3.05.00 (Legado 3.x - Amplo uso)', familia: '3.x' },
  { versao: '3.04.01', label: 'TISS 3.04.01 (Legado 3.x)', familia: '3.x' },
  { versao: '3.04.00', label: 'TISS 3.04.00 (Legado 3.x)', familia: '3.x' },
  { versao: '3.03.03', label: 'TISS 3.03.03 (Legado 3.x)', familia: '3.x' },
  { versao: '3.03.02', label: 'TISS 3.03.02 (Legado 3.x)', familia: '3.x' },
  { versao: '3.03.01', label: 'TISS 3.03.01 (Legado 3.x)', familia: '3.x' },
  { versao: '3.02.02', label: 'TISS 3.02.02 (Legado 3.x)', familia: '3.x' },
  { versao: '3.02.01', label: 'TISS 3.02.01 (Legado 3.x)', familia: '3.x' },
  { versao: '3.02.00', label: 'TISS 3.02.00 (Legado 3.x)', familia: '3.x' },
  { versao: '3.01.00', label: 'TISS 3.01.00 (Legado 3.x)', familia: '3.x' },
  { versao: '3.00.01', label: 'TISS 3.00.01 (Legado 3.x)', familia: '3.x' },
  { versao: '3.00.00', label: 'TISS 3.00.00 (Legado 3.x)', familia: '3.x' },
];

// ============================================================================
// MODELAGEM NORMALIZADA (3FN) - FASE 1 SUPABASE
// public.operadoras -> public.planos_saude -> public.pacientes
// ============================================================================

/**
 * Tabela public.operadoras: Cadastro prévio da Operadora/Convênio com Versão TISS pré-definida
 */
export interface OperadoraRecord {
  id: string;
  nome: string;
  registro_ans: string | null;
  versao_tiss: VersaoTiss;
  tamanho_matricula: number | null;
  dias_validade_autorizacao: number;
  codigo_prestador: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  planos?: PlanoSaudeRecord[];
}

/**
 * Tabela public.planos_saude: Plano comercial vinculado à Operadora (operadora_id)
 */
export interface PlanoSaudeRecord {
  id: string;
  operadora_id: string;
  nome_plano: string;
  acomodacao: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  operadora?: OperadoraRecord;
}

/**
 * Tabela public.pacientes: Dados cadastrais exclusivos do Paciente + FK plano_saude_id
 */
export interface PacienteRecord {
  id: string;
  nome: string;
  data_nascimento: string; // YYYY-MM-DD
  cpf: string; // 000.000.000-00
  cep: string; // 00000-000
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  plano_saude_id: string;
  carteira_plano: string;
  validade_carteira: string | null; // YYYY-MM-DD
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // Dados resolvidos automaticamente via JOIN (pacientes -> planos_saude -> operadoras)
  plano?: PlanoSaudeRecord & {
    operadora?: OperadoraRecord;
  };
}

export interface CreateOperadoraDTO {
  nome: string;
  registro_ans?: string | null;
  versao_tiss: VersaoTiss;
  tamanho_matricula?: number | null;
  dias_validade_autorizacao?: number;
  codigo_prestador?: string | null;
  ativo?: boolean;
  plano_inicial_nome?: string;
  plano_inicial_acomodacao?: string;
}

export interface CreatePlanoSaudeDTO {
  operadora_id: string;
  nome_plano: string;
  acomodacao?: string;
  ativo?: boolean;
}

export interface CreatePacienteDTO {
  nome: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  plano_saude_id: string;
  carteira_plano: string;
  validade_carteira?: string | null;
  ativo?: boolean;
}

// ============================================================================
// MODELAGEM NORMALIZADA (3FN) - FASE 2 SUPABASE
// public.terapeutas, public.procedimentos_tuss, public.autorizacoes,
// public.guias_tiss, public.guias_tiss_sessoes
// ============================================================================

export interface TerapeutaRecord {
  id: string;
  profile_id?: string | null;
  nome: string;
  email?: string | null;
  conselho: string; // Ex: CRP, CREFITO, CRFa, CRM
  numero_conselho: string;
  uf_conselho: string;
  cbo: string;
  especialidade: string;
  ativo: boolean;
  created_at?: string;
}

export interface CreateTerapeutaDTO {
  nome: string;
  email?: string | null;
  conselho: string;
  numero_conselho: string;
  uf_conselho: string;
  cbo: string;
  especialidade: string;
}

export interface ProcedimentoTussRecord {
  codigo_tuss: string;
  descricao: string;
  tabela_dominio: string;
  conselho_obrigatorio: string;
  cbo_prefixo: string;
  exige_senha: boolean;
}

export type StatusGuiaTiss =
  | 'enviada_terapeuta'
  | 'em_preenchimento'
  | 'enviada_faturamento'
  | 'em_lote'
  | 'retida_auditoria'
  | 'validada_lote'
  | 'faturada_xml';

export interface GuiaTissSessaoRecord {
  id: string;
  guia_id: string;
  ordem_sessao: number; // 1 a 10
  data_realizacao: string; // YYYY-MM-DD (deve respeitar Campo 4 = data_inicio até data_fim)
  quantidade: number; // Padrão 1
  valor_unitario?: number;
  valor_total?: number;
  assinatura_confirmada: boolean;
  observacao_sessao?: string | null;
  created_at?: string;
}

export interface GuiaTissRecord {
  id: string;
  numero_guia_prestador: string;
  numero_guia_operadora?: string | null;
  autorizacao_id: string;
  paciente_id: string;
  plano_saude_id: string;
  terapeuta_designado_id: string;
  terapeuta_executante_id?: string | null;
  versao_tiss: VersaoTiss;
  data_autorizacao_campo4: string; // Campo 4 – Data da Autorização (= data_inicio da senha)
  data_validade_senha: string; // Data fim da senha
  numero_senha: string;
  codigo_tuss: string;
  descricao_termo: string;
  qtd_sessoes_previstas: number; // 1 a 10
  valor_unitario_sessao?: number;
  valor_total_guia?: number;
  assinatura_paciente_base64?: string | null;
  nome_assinante?: string | null;
  assinado_em?: string | null;
  status_guia: StatusGuiaTiss;
  status_auditoria?: 'pendente' | 'reprovado' | 'aprovado';
  total_glosas_detectadas?: number;
  auditado_em?: string | null;
  enviada_faturamento_em?: string | null;
  digitado_faturamento_em?: string | null;
  lote_id?: string | null;
  numero_lote?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relacionamentos hidratados via JOIN
  paciente?: PacienteRecord;
  plano?: PlanoSaudeRecord & { operadora?: OperadoraRecord };
  terapeuta_designado?: TerapeutaRecord;
  terapeuta_executante?: TerapeutaRecord;
  autorizacao?: AutorizacaoRecord;
  sessoes?: GuiaTissSessaoRecord[];
  criticas_auditoria?: AuditoriaCriticaRecord[];
}

export interface AutorizacaoRecord {
  id: string;
  paciente_id: string;
  terapeuta_id: string;
  numero_autorizacao: string;
  codigo_tuss: string;
  descricao_termo: string;
  data_inicio: string; // YYYY-MM-DD -> Campo "4 - Data da Autorização" na Guia TISS
  data_fim: string; // YYYY-MM-DD
  quantidade_total_sessoes: number;
  quantidade_sessoes_semanais: number;
  valor_unitario_sessao?: number;
  status: 'ativa' | 'concluida' | 'expirada' | 'cancelada';
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relacionamentos e saldos calculados
  paciente?: PacienteRecord;
  terapeuta?: TerapeutaRecord;
  guias?: GuiaTissRecord[];
  sessoes_emitidas?: number;
  sessoes_realizadas?: number;
  saldo_disponivel?: number;
}

export interface CreateAutorizacaoDTO {
  paciente_id: string;
  terapeuta_id: string;
  numero_autorizacao: string;
  codigo_tuss: string;
  descricao_termo: string;
  data_inicio: string;
  data_fim: string;
  quantidade_total_sessoes: number;
  quantidade_sessoes_semanais: number;
  valor_unitario_sessao?: number;
  observacoes?: string | null;
  emitir_primeira_guia?: boolean;
  qtd_sessoes_primeira_guia?: number;
}

export interface EmitirGuiaSpSadtDTO {
  autorizacao_id: string;
  qtd_sessoes_previstas: number; // 1 a 10
  numero_guia_operadora?: string | null;
}

// ============================================================================
// MODELAGEM NORMALIZADA (3FN) - FASE 3 SUPABASE
// public.planos_procedimentos_precos, public.lotes_faturamento
// ============================================================================

export interface CreateProcedimentoTussDTO {
  codigo_tuss: string;
  descricao: string;
  tabela_dominio?: string;
  conselho_obrigatorio: string;
  cbo_prefixo: string;
  exige_senha?: boolean;
}

export interface PlanoProcedimentoPrecoRecord {
  id: string;
  operadora_id: string;
  plano_saude_id?: string | null;
  codigo_tuss: string;
  valor_sessao: number;
  numero_contrato?: string | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // Hidratados
  operadora?: OperadoraRecord;
  plano?: PlanoSaudeRecord;
  procedimento?: ProcedimentoTussRecord;
}

export interface UpsertPlanoProcedimentoPrecoDTO {
  operadora_id: string;
  plano_saude_id?: string | null;
  codigo_tuss: string;
  valor_sessao: number;
  numero_contrato?: string | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
}

export type StatusLoteFaturamento = 'aberto' | 'em_conferencia' | 'fechado' | 'xml_gerado';

export interface LoteFaturamentoRecord {
  id: string;
  numero_lote: string;
  operadora_id: string;
  versao_tiss: VersaoTiss;
  status_lote: StatusLoteFaturamento;
  quantidade_guias: number;
  valor_total_lote: number;
  criado_por?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Hidratados
  operadora?: OperadoraRecord;
  guias?: GuiaTissRecord[];
}

export interface CreateLoteFaturamentoDTO {
  numero_lote: string;
  operadora_id: string;
  versao_tiss?: VersaoTiss;
  observacoes?: string | null;
}

export interface DigitarGuiaFaturamentoDTO {
  guia_id?: string | null; // Se preenchido, atualiza uma guia vinda do Portal do Terapeuta; se vazio, cria nova guia no faturamento
  paciente_id: string;
  autorizacao_id: string;
  terapeuta_executante_id: string;
  numero_lote: string;
  lote_id?: string | null;
  valor_unitario_sessao: number;
  datas_sessoes: Array<{
    data_realizacao: string;
    quantidade: number;
  }>;
  nome_assinante?: string | null;
}

export interface ResumoSemanaIso {
  chaveSemana: string; // Ex: 2026-Sem.45
  intervaloLabel: string; // Ex: 02/11/2026 a 08/11/2026
  datasGuiaAtual: string[];
  datasOutrasGuias: string[];
  totalNaSemana: number;
  limiteSemanal: number;
  excedeuLimite: boolean;
}

export interface ResultadoValidacaoFaturamentoGuia {
  conforme: boolean;
  errosBloqueantes: string[];
  avisos: string[];
  semanasIso: ResumoSemanaIso[];
  saldoAutorizacao: {
    totalAutorizado: number;
    jaRealizadoOutrasGuias: number;
    sessoesGuiaAtual: number;
    totalAcumulado: number;
    saldoRestanteAposGuia: number;
    estourouSaldoTotal: boolean;
  };
  divergenciaTerapeuta: boolean;
  divergenciaValorTabela: boolean;
  valorTabeladoOperadora?: number | null;
}

// ============================================================================
// MODELAGEM NORMALIZADA (3FN) - FASE 4 SUPABASE
// Motor de Conferência e Crítica Pré-XML (Auditoria)
// ============================================================================

export type CodigoCriticaAuditoria =
  | 'CRIT_DATA_REPETIDA'
  | 'CRIT_QTD_DIFERENTE_1'
  | 'CRIT_TERAPEUTA_DIVERGENTE'
  | 'CRIT_VALOR_TABELA_PLANO';

export interface AuditoriaCriticaRecord {
  id: string;
  guia_id: string;
  lote_id?: string | null;
  codigo_critica: CodigoCriticaAuditoria;
  titulo: string;
  mensagem_detalhe: string;
  valor_esperado?: string | null;
  valor_encontrado?: string | null;
  bloqueante: boolean;
  status: 'pendente' | 'corrigido';
  created_at?: string;
  corrigido_em?: string | null;
}

export interface ResumoAuditoriaLote {
  loteId: string;
  numeroLote: string;
  operadoraNome: string;
  versaoTiss: VersaoTiss;
  totalGuias: number;
  guiasAprovadas: number;
  guiasRetidas: number;
  totalCriticasPendentes: number;
  valorTotalLote: number;
  valorRetidoEmGlosa: number;
  aptoParaGerarXml: boolean;
}

export interface CorrigirFalhaAuditoriaDTO {
  guia_id: string;
  deduplicar_datas?: boolean;
  normalizar_quantidade_1?: boolean;
  alinhar_terapeuta_designado?: boolean;
  aplicar_valor_tabela?: boolean;
  novo_valor_unitario?: number;
  novo_terapeuta_executante_id?: string;
  novas_sessoes?: Array<{ data_realizacao: string; quantidade: number }>;
}

// ============================================================================
// ENTIDADES DE DOMÍNIO TISS / AUTORIZAÇÕES / FATURAMENTO / AUDITORIA
// ============================================================================

export interface ItemTabelaPrecoPlano {
  codigoTuss: string;
  descricao: string;
  valor: number;
}

export interface OperadoraPlano {
  id: string;
  nomeOperadora: string;
  registroAns: string;
  nomePlano: string;
  versaoTiss: VersaoTiss;
  tabelaPrecos: Record<string, ItemTabelaPrecoPlano>;
}

export interface Autorizacao {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  planoSaudeId: string;
  operadoraNome: string;
  versaoTiss: VersaoTiss;
  numeroAutorizacao: string;
  termoAutorizado: string;
  termoDescricao: string;
  dataInicio: string; // Campo "4 - Data de Autorização" na Guia TISS
  dataFim: string;
  quantidadeTotalSessoes: number;
  quantidadeSessoesSemanais: number;
  terapeutaDesignado: string;
  conselhoTerapeuta?: string;
  cboTerapeuta?: string;
  criadoEm: string;
}

export interface SessaoGuia {
  id: string;
  dataSessao: string;
  quantidade: number;
  valorUnitario: number;
  assinaturaPaciente: boolean;
}

export type TipoCriticaFaturamento =
  | 'CRIT_DATA_REPETIDA'
  | 'CRIT_QTD_DIFERENTE_1'
  | 'CRIT_TERAPEUTA_DIVERGENTE'
  | 'CRIT_VALOR_TABELA_PLANO'
  | 'CRIT_DATA_FORA_VIGENCIA_CAMPO4'
  | 'CRIT_LIMITE_10_DATAS'
  | 'CRIT_PERIODICIDADE_SEMANAL'
  | 'CRIT_SALDO_TOTAL_EXCEDIDO';

export interface CriticaFaturamento {
  codigo: TipoCriticaFaturamento;
  titulo: string;
  detalhe: string;
  valorEncontrado?: string;
  valorEsperado?: string;
  bloqueante: boolean;
}

export interface GuiaAtendimentoTiss {
  id: string;
  numeroGuiaPrestador: string;
  pacienteId: string;
  pacienteNome: string;
  cpfPaciente: string;
  carteiraPlano: string;
  planoSaudeId: string;
  convenio: string;
  planoNome: string;
  versaoTiss: VersaoTiss;
  autorizacaoId: string;
  numeroAutorizacao: string;
  dataAutorizacaoCampo4: string;
  dataValidadeSenha: string;
  termoAutorizado: string;
  termoDescricao: string;
  terapeutaDesignadoOriginal: string;
  terapeutaExecutanteFaturamento: string;
  datasSessoes: SessaoGuia[];
  quantidadeTotalSessoesGuia: number;
  valorSessao: number;
  valorTotalGuia: number;
  numeroLote: string;
  assinaturaResponsavelColetada: boolean;
  statusFluxo:
    | 'enviada_terapeuta'
    | 'preenchida_terapeuta'
    | 'digitada_faturamento'
    | 'retida_auditoria'
    | 'validada_lote'
    | 'faturada_xml';
  criticasAuditoria: CriticaFaturamento[];
  criadoEm: string;
}

/**
 * Entidade de Domínio (Domain Entity): Representa um conceito central do negócio (neste caso, uma guia de faturamento).
 */
export interface GuiaFaturamento {
  id: string;
  data: string;
  paciente: string;
  convenio: string;
  matricula: string;
  statusAuditoria: 'validado' | 'pendente';
  valorTotal: number;
}

/**
 * Entidade de Domínio para Auditoria: Representa uma guia no contexto de validação de regras,
 * como as glosas prévias antes do envio para a Orizon.
 */
export interface AuditoriaGuia {
  id: string;
  data: string;
  paciente: string;
  convenio: string;
  status: 'pendente' | 'corrigido';
  erro: string;
}

/**
 * Entidade de Domínio para Atendimento: Representa uma ficha ou agendamento de paciente.
 */
export interface Atendimento {
  id: number;
  paciente: string;
  guia: string;
  horario: string;
  data: string;
  profissional: string;
  local: string;
  convenio: string;
  cobertura: string;
  status: string;
  statusFinanceiro: string;
}

/**
 * Entidade de Domínio para Procedimento: Representa um procedimento TUSS realizado.
 */
export interface Procedimento {
  codigoTabela: string;
  codigoProcedimento: string;
  descricao: string;
  datahora: string;
  viaTecnica: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}
