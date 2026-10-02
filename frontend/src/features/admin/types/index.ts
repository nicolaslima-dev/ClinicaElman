/**
 * Entidade de Domínio (Domain Entity): Representa um conceito central do negócio (neste caso, uma guia de faturamento).
 * Fica nesta pasta global de tipos do módulo de admin porque, futuramente, será compartilhada 
 * e utilizada por serviços de integração de API (ex: requisições HTTP para o backend),
 * outros componentes e páginas fora do contexto exclusivo de "faturamento".
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
