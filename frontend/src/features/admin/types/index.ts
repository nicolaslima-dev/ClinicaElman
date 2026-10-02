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
