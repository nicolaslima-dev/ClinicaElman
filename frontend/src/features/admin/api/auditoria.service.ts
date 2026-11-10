import { supabase } from '@/services/supabase';
import type {
  AuditoriaCriticaRecord,
  CorrigirFalhaAuditoriaDTO,
  GuiaTissRecord,
  GuiaTissSessaoRecord,
  LoteFaturamentoRecord,
  ResumoAuditoriaLote,
  StatusGuiaTiss,
} from '../types';
import { listarGuiasTiss, listarTerapeutas } from './autorizacoes.service';
import {
  listarLotesFaturamento,
  listarTabelaPrecosOperadoras,
  obterValorSessaoContratual,
} from './faturamento.service';
import { formatarDataBr } from '../utils/pacienteValidators';

const LS_GUIAS_TISS_KEY = 'clinica_elman_guias_tiss_v1';
const LS_GUIAS_SESSOES_KEY = 'clinica_elman_guias_sessoes_v1';
const LS_LOTES_FATURAMENTO_KEY = 'clinica_elman_lotes_faturamento_v1';
const LS_AUDITORIAS_GUIAS_KEY = 'clinica_elman_auditorias_guias_v1';
const LS_DEMO_AUDITORIA_SEEDED_KEY = 'clinica_elman_demo_auditoria_v1';

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder') && !url.includes('YOUR_SUPABASE_URL'));
}

function getLocalGuiasRaw(): GuiaTissRecord[] {
  try {
    const raw = localStorage.getItem(LS_GUIAS_TISS_KEY);
    return raw ? (JSON.parse(raw) as GuiaTissRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalGuias(items: GuiaTissRecord[]) {
  try {
    localStorage.setItem(LS_GUIAS_TISS_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

function getLocalSessoesRaw(): GuiaTissSessaoRecord[] {
  try {
    const raw = localStorage.getItem(LS_GUIAS_SESSOES_KEY);
    return raw ? (JSON.parse(raw) as GuiaTissSessaoRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSessoes(items: GuiaTissSessaoRecord[]) {
  try {
    localStorage.setItem(LS_GUIAS_SESSOES_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

function getLocalLotesRaw(): LoteFaturamentoRecord[] {
  try {
    const raw = localStorage.getItem(LS_LOTES_FATURAMENTO_KEY);
    return raw ? (JSON.parse(raw) as LoteFaturamentoRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalLotes(items: LoteFaturamentoRecord[]) {
  try {
    localStorage.setItem(LS_LOTES_FATURAMENTO_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

function saveLocalAuditoriasCriticas(items: AuditoriaCriticaRecord[]) {
  try {
    localStorage.setItem(LS_AUDITORIAS_GUIAS_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

/**
 * Avalia uma Guia TISS frente às 4 Falhas Críticas Obrigatórias antes da liberação do XML:
 * ❌ Crítica 1 (CRIT_DATA_REPETIDA): Mesma data lançada mais de 1x na mesma guia ou em outra guia do mesmo paciente/termo.
 * ❌ Crítica 2 (CRIT_QTD_DIFERENTE_1): Qualquer linha de sessão cuja quantidade cobrada seja diferente de 1.
 * ❌ Crítica 3 (CRIT_TERAPEUTA_DIVERGENTE): Profissional executante informado no faturamento diferente do Terapeuta originalmente designado na guia/autorização.
 * ❌ Crítica 4 (CRIT_VALOR_TABELA_PLANO): Valor unitário da sessão diferente do valor tabelado para aquele Termo TUSS no Plano de Saúde do paciente.
 */
export function avaliarGuiaNas4CriticasObrigatorias(params: {
  guia: GuiaTissRecord;
  todasGuias: GuiaTissRecord[];
  valorTabelaOperadora: number | null;
}): AuditoriaCriticaRecord[] {
  const { guia, todasGuias, valorTabelaOperadora } = params;
  const criticas: AuditoriaCriticaRecord[] = [];
  const sessoes = guia.sessoes || [];
  const agora = new Date().toISOString();

  // ==========================================================================
  // ❌ CRÍTICA 1: DATAS REPETIDAS (Na própria guia ou em outra guia do mesmo paciente/termo)
  // ==========================================================================
  const contagemInterna = new Map<string, number>();
  sessoes.forEach((s) => {
    const dt = (s.data_realizacao || '').split('T')[0];
    if (!dt) return;
    contagemInterna.set(dt, (contagemInterna.get(dt) || 0) + 1);
  });

  const duplicadasNaMesmaGuia = Array.from(contagemInterna.entries())
    .filter(([, count]) => count > 1)
    .map(([dt]) => formatarDataBr(dt));

  // Datas lançadas em outras guias do mesmo paciente e mesmo termo TUSS (ou mesma autorização)
  const datasOutrasGuias = new Map<string, string>(); // data -> numero_guia_prestador
  todasGuias
    .filter(
      (outra) =>
        outra.id !== guia.id &&
        (outra.autorizacao_id === guia.autorizacao_id ||
          (outra.paciente_id === guia.paciente_id &&
            outra.codigo_tuss === guia.codigo_tuss))
    )
    .forEach((outra) => {
      (outra.sessoes || []).forEach((s) => {
        const dt = (s.data_realizacao || '').split('T')[0];
        if (dt) {
          datasOutrasGuias.set(dt, outra.numero_guia_prestador);
        }
      });
    });

  const conflitosOutraGuia: string[] = [];
  Array.from(contagemInterna.keys()).forEach((dt) => {
    const numOutraGuia = datasOutrasGuias.get(dt);
    if (numOutraGuia) {
      conflitosOutraGuia.push(`${formatarDataBr(dt)} (já lançada na Guia #${numOutraGuia})`);
    }
  });

  if (duplicadasNaMesmaGuia.length > 0 || conflitosOutraGuia.length > 0) {
    const partesDetalhe: string[] = [];
    if (duplicadasNaMesmaGuia.length > 0) {
      partesDetalhe.push(
        `Data(s) repetida(s) dentro da própria guia: ${duplicadasNaMesmaGuia.join(', ')}.`
      );
    }
    if (conflitosOutraGuia.length > 0) {
      partesDetalhe.push(
        `Data(s) em duplicidade com outra guia do mesmo paciente/termo: ${conflitosOutraGuia.join(', ')}.`
      );
    }

    criticas.push({
      id: `crit-data-${guia.id}`,
      guia_id: guia.id,
      lote_id: guia.lote_id || null,
      codigo_critica: 'CRIT_DATA_REPETIDA',
      titulo: 'Crítica 1 — Datas de Atendimento Repetidas',
      mensagem_detalhe: partesDetalhe.join(' '),
      valor_encontrado: [...duplicadasNaMesmaGuia, ...conflitosOutraGuia].join(' | '),
      valor_esperado: '1 única ocorrência por data de realização',
      bloqueante: true,
      status: 'pendente',
      created_at: agora,
    });
  }

  // ==========================================================================
  // ❌ CRÍTICA 2: QUANTIDADE != 1 (Qualquer linha de sessão com quantidade != 1)
  // ==========================================================================
  const sessoesQtdInvalida = sessoes.filter((s) => Number(s.quantidade) !== 1);
  if (sessoesQtdInvalida.length > 0) {
    const resumoLinhas = sessoesQtdInvalida
      .map(
        (s) =>
          `Data ${formatarDataBr(s.data_realizacao)}: Qtd = ${s.quantidade}`
      )
      .join(', ');

    criticas.push({
      id: `crit-qtd-${guia.id}`,
      guia_id: guia.id,
      lote_id: guia.lote_id || null,
      codigo_critica: 'CRIT_QTD_DIFERENTE_1',
      titulo: 'Crítica 2 — Quantidade Cobrada Diferente de 1',
      mensagem_detalhe: `Foram encontradas ${sessoesQtdInvalida.length} linha(s) de sessão com quantidade diferente de 1 (${resumoLinhas}). Pelo padrão TISS de sessões seriadas, cada data realizada deve cobrar exatamente quantidade = 1.`,
      valor_encontrado: resumoLinhas,
      valor_esperado: 'Quantidade = 1 em todas as datas da guia',
      bloqueante: true,
      status: 'pendente',
      created_at: agora,
    });
  }

  // ==========================================================================
  // ❌ CRÍTICA 3: DIVERGÊNCIA DE TERAPEUTA (Executante != Designado na Guia/Autorização)
  // ==========================================================================
  const idDesignado = guia.terapeuta_designado_id || guia.autorizacao?.terapeuta_id;
  const idExecutante = guia.terapeuta_executante_id || idDesignado;

  const nomeDesignado =
    guia.terapeuta_designado?.nome || 'Terapeuta Designado Original';
  const nomeExecutante =
    guia.terapeuta_executante?.nome || nomeDesignado;

  if (idExecutante && idDesignado && idExecutante !== idDesignado) {
    criticas.push({
      id: `crit-terap-${guia.id}`,
      guia_id: guia.id,
      lote_id: guia.lote_id || null,
      codigo_critica: 'CRIT_TERAPEUTA_DIVERGENTE',
      titulo: 'Crítica 3 — Divergência de Terapeuta Executante',
      mensagem_detalhe: `O profissional executante informado na digitação do faturamento (${nomeExecutante}) está diferente do Terapeuta originalmente designado na guia/autorização (${nomeDesignado}).`,
      valor_encontrado: nomeExecutante,
      valor_esperado: nomeDesignado,
      bloqueante: true,
      status: 'pendente',
      created_at: agora,
    });
  }

  // ==========================================================================
  // ❌ CRÍTICA 4: DIVERGÊNCIA DE VALOR (Valor unitário != Tabela do Plano de Saúde)
  // ==========================================================================
  const valorUnitarioCobrado = Number(
    guia.valor_unitario_sessao ??
      sessoes[0]?.valor_unitario ??
      guia.autorizacao?.valor_unitario_sessao ??
      0
  );

  if (
    valorTabelaOperadora !== null &&
    valorTabelaOperadora !== undefined &&
    valorTabelaOperadora > 0 &&
    Math.abs(valorUnitarioCobrado - valorTabelaOperadora) > 0.009
  ) {
    const fmtCobrado = `R$ ${valorUnitarioCobrado.toFixed(2).replace('.', ',')}`;
    const fmtTabela = `R$ ${valorTabelaOperadora.toFixed(2).replace('.', ',')}`;
    const nomeConvenio = guia.plano?.operadora?.nome || 'Operadora';

    criticas.push({
      id: `crit-valor-${guia.id}`,
      guia_id: guia.id,
      lote_id: guia.lote_id || null,
      codigo_critica: 'CRIT_VALOR_TABELA_PLANO',
      titulo: 'Crítica 4 — Divergência de Valor da Tabela do Plano',
      mensagem_detalhe: `O valor unitário da sessão digitado na guia (${fmtCobrado}) diverge do valor acordado na Tabela Contratual do plano ${nomeConvenio} para o termo TUSS ${guia.codigo_tuss} (${fmtTabela}).`,
      valor_encontrado: fmtCobrado,
      valor_esperado: `${fmtTabela} (Tabela ${nomeConvenio})`,
      bloqueante: true,
      status: 'pendente',
      created_at: agora,
    });
  }

  return criticas;
}

/**
 * Semeia um Lote de Demonstração (#904026 - BRADESCO SAÚDE) contendo guias com as 4 falhas críticas
 * caso ainda não tenha sido semeado (ou quando solicitado pelo botão "Simular Lote com as 4 Críticas").
 */
export async function semearOuRestaurarLoteDemonstracaoAuditoria(
  forcarRestauracao = false
): Promise<void> {
  const jaSemeado = localStorage.getItem(LS_DEMO_AUDITORIA_SEEDED_KEY);
  const guiasLocais = getLocalGuiasRaw();
  const temGuiasEmLote = guiasLocais.some((g) => Boolean(g.numero_lote));

  if (jaSemeado && temGuiasEmLote && !forcarRestauracao) {
    return;
  }

  // Garante que as seeds base existam carregando os serviços
  await Promise.all([listarGuiasTiss(), listarTerapeutas(), listarTabelaPrecosOperadoras()]);

  const guiasAtuais = getLocalGuiasRaw().filter(
    (g) => !g.id.startsWith('guia-audit-demo-')
  );
  const sessoesAtuais = getLocalSessoesRaw().filter(
    (s) => !s.guia_id.startsWith('guia-audit-demo-')
  );
  const lotesAtuais = getLocalLotesRaw().filter(
    (l) => l.numero_lote !== '904026'
  );

  const agora = new Date().toISOString();
  const loteDemoId = 'lote-demo-904026';

  // Lote #904026 — BRADESCO SAÚDE (TISS 4.03.00)
  // Tabela Bradesco para TUSS 20103471 = R$ 135,00 | Terapeuta Designado aut-mariana-01 = ter-carlos-mendes (Dr. Carlos Mendes)
  const novasGuiasDemo: GuiaTissRecord[] = [
    {
      // Guia 1: Possui Crítica 1 (Datas Repetidas: 2026-09-08 lançada 2x) + Crítica 2 (Quantidade = 2 na sessão)
      id: 'guia-audit-demo-1',
      numero_guia_prestador: '2026904001',
      numero_guia_operadora: 'AUTH-2026-883921',
      autorizacao_id: 'aut-mariana-01',
      paciente_id: 'pac-mariana-costa',
      plano_saude_id: 'pl-bradesco-top',
      terapeuta_designado_id: 'ter-carlos-mendes',
      terapeuta_executante_id: 'ter-carlos-mendes',
      versao_tiss: '4.03.00',
      data_autorizacao_campo4: '2026-09-01',
      data_validade_senha: '2026-11-30',
      numero_senha: 'AUTH-2026-883921',
      codigo_tuss: '20103471',
      descricao_termo: 'Fisioterapia para Distúrbios Osteomioarticulares',
      qtd_sessoes_previstas: 3,
      valor_unitario_sessao: 135.0,
      valor_total_guia: 540.0,
      assinatura_paciente_base64: 'ASSINATURA_CONFIRMADA',
      nome_assinante: 'Mariana Costa e Silva',
      assinado_em: agora,
      status_guia: 'retida_auditoria',
      status_auditoria: 'reprovado',
      lote_id: loteDemoId,
      numero_lote: '904026',
      digitado_faturamento_em: agora,
      created_at: agora,
    },
    {
      // Guia 2: Possui Crítica 3 (Divergência de Terapeuta: Dra. Luciana Silva em vez de Dr. Carlos Mendes)
      id: 'guia-audit-demo-2',
      numero_guia_prestador: '2026904002',
      numero_guia_operadora: 'AUTH-2026-883921',
      autorizacao_id: 'aut-mariana-01',
      paciente_id: 'pac-mariana-costa',
      plano_saude_id: 'pl-bradesco-top',
      terapeuta_designado_id: 'ter-carlos-mendes',
      terapeuta_executante_id: 'ter-luciana-silva', // Divergente!
      versao_tiss: '4.03.00',
      data_autorizacao_campo4: '2026-09-01',
      data_validade_senha: '2026-11-30',
      numero_senha: 'AUTH-2026-883921',
      codigo_tuss: '20103471',
      descricao_termo: 'Fisioterapia para Distúrbios Osteomioarticulares',
      qtd_sessoes_previstas: 2,
      valor_unitario_sessao: 135.0,
      valor_total_guia: 270.0,
      assinatura_paciente_base64: 'ASSINATURA_CONFIRMADA',
      nome_assinante: 'Mariana Costa e Silva',
      assinado_em: agora,
      status_guia: 'retida_auditoria',
      status_auditoria: 'reprovado',
      lote_id: loteDemoId,
      numero_lote: '904026',
      digitado_faturamento_em: agora,
      created_at: agora,
    },
    {
      // Guia 3: Possui Crítica 4 (Divergência de Valor: R$ 190,00 cobrado vs. R$ 135,00 da Tabela Bradesco)
      id: 'guia-audit-demo-3',
      numero_guia_prestador: '2026904003',
      numero_guia_operadora: 'AUTH-2026-883921',
      autorizacao_id: 'aut-mariana-01',
      paciente_id: 'pac-mariana-costa',
      plano_saude_id: 'pl-bradesco-top',
      terapeuta_designado_id: 'ter-carlos-mendes',
      terapeuta_executante_id: 'ter-carlos-mendes',
      versao_tiss: '4.03.00',
      data_autorizacao_campo4: '2026-09-01',
      data_validade_senha: '2026-11-30',
      numero_senha: 'AUTH-2026-883921',
      codigo_tuss: '20103471',
      descricao_termo: 'Fisioterapia para Distúrbios Osteomioarticulares',
      qtd_sessoes_previstas: 2,
      valor_unitario_sessao: 190.0, // Divergente da tabela (R$ 135,00)!
      valor_total_guia: 380.0,
      assinatura_paciente_base64: 'ASSINATURA_CONFIRMADA',
      nome_assinante: 'Mariana Costa e Silva',
      assinado_em: agora,
      status_guia: 'retida_auditoria',
      status_auditoria: 'reprovado',
      lote_id: loteDemoId,
      numero_lote: '904026',
      digitado_faturamento_em: agora,
      created_at: agora,
    },
  ];

  const novasSessoesDemo: GuiaTissSessaoRecord[] = [
    // Sessões da Guia 1 (Datas repetidas 2026-09-08 e Quantidade = 2)
    {
      id: 'ses-audit-demo-1-1',
      guia_id: 'guia-audit-demo-1',
      ordem_sessao: 1,
      data_realizacao: '2026-09-08',
      quantidade: 1,
      valor_unitario: 135.0,
      valor_total: 135.0,
      assinatura_confirmada: true,
    },
    {
      id: 'ses-audit-demo-1-2',
      guia_id: 'guia-audit-demo-1',
      ordem_sessao: 2,
      data_realizacao: '2026-09-08', // Data repetida!
      quantidade: 1,
      valor_unitario: 135.0,
      valor_total: 135.0,
      assinatura_confirmada: true,
    },
    {
      id: 'ses-audit-demo-1-3',
      guia_id: 'guia-audit-demo-1',
      ordem_sessao: 3,
      data_realizacao: '2026-09-10',
      quantidade: 2, // Quantidade != 1!
      valor_unitario: 135.0,
      valor_total: 270.0,
      assinatura_confirmada: true,
    },
    // Sessões da Guia 2 (Terapeuta Divergente)
    {
      id: 'ses-audit-demo-2-1',
      guia_id: 'guia-audit-demo-2',
      ordem_sessao: 1,
      data_realizacao: '2026-09-15',
      quantidade: 1,
      valor_unitario: 135.0,
      valor_total: 135.0,
      assinatura_confirmada: true,
    },
    {
      id: 'ses-audit-demo-2-2',
      guia_id: 'guia-audit-demo-2',
      ordem_sessao: 2,
      data_realizacao: '2026-09-17',
      quantidade: 1,
      valor_unitario: 135.0,
      valor_total: 135.0,
      assinatura_confirmada: true,
    },
    // Sessões da Guia 3 (Valor Divergente)
    {
      id: 'ses-audit-demo-3-1',
      guia_id: 'guia-audit-demo-3',
      ordem_sessao: 1,
      data_realizacao: '2026-09-22',
      quantidade: 1,
      valor_unitario: 190.0,
      valor_total: 190.0,
      assinatura_confirmada: true,
    },
    {
      id: 'ses-audit-demo-3-2',
      guia_id: 'guia-audit-demo-3',
      ordem_sessao: 2,
      data_realizacao: '2026-09-24',
      quantidade: 1,
      valor_unitario: 190.0,
      valor_total: 190.0,
      assinatura_confirmada: true,
    },
  ];

  const novoLoteDemo: LoteFaturamentoRecord = {
    id: loteDemoId,
    numero_lote: '904026',
    operadora_id: 'op-bradesco',
    versao_tiss: '4.03.00',
    status_lote: 'em_conferencia',
    quantidade_guias: 3,
    valor_total_lote: 1190.0,
    observacoes: 'Lote em conferência pré-XML na Auditoria TISS.',
    created_at: agora,
  };

  saveLocalGuias([...novasGuiasDemo, ...guiasAtuais]);
  saveLocalSessoes([...novasSessoesDemo, ...sessoesAtuais]);
  saveLocalLotes([novoLoteDemo, ...lotesAtuais]);
  localStorage.setItem(LS_DEMO_AUDITORIA_SEEDED_KEY, 'true');
}

/**
 * Executa a rotina completa de Conferência e Crítica Pré-XML sobre os Lotes e Guias
 */
export async function executarConferenciaPreXml(params?: {
  numeroLoteFiltro?: string;
  convenioFiltro?: string;
}): Promise<{
  guiasAuditadas: GuiaTissRecord[];
  resumosLotes: ResumoAuditoriaLote[];
  todasCriticasPendentes: AuditoriaCriticaRecord[];
  valorTabelaPorGuia: Record<string, number | null>;
}> {
  await semearOuRestaurarLoteDemonstracaoAuditoria(false);

  const [{ data: todasGuias }, { data: todosLotes }] = await Promise.all([
    listarGuiasTiss(),
    listarLotesFaturamento(),
  ]);

  // Filtra as guias que já foram enviadas ao faturamento ou vinculadas a um lote
  const guiasFaturamento = todasGuias.filter(
    (g) =>
      Boolean(g.numero_lote) ||
      g.status_guia === 'em_lote' ||
      g.status_guia === 'retida_auditoria' ||
      g.status_guia === 'validada_lote' ||
      g.status_guia === 'faturada_xml' ||
      g.status_guia === 'enviada_faturamento'
  );

  const valorTabelaPorGuia: Record<string, number | null> = {};
  const todasCriticas: AuditoriaCriticaRecord[] = [];
  const agora = new Date().toISOString();

  const guiasAvaliadas: GuiaTissRecord[] = [];

  for (const guia of guiasFaturamento) {
    const vlrTabela = await obterValorSessaoContratual({
      operadoraId:
        guia.plano?.operadora_id || guia.plano?.operadora?.id,
      operadoraNome: guia.plano?.operadora?.nome,
      planoSaudeId: guia.plano_saude_id,
      codigoTuss: guia.codigo_tuss,
    });

    valorTabelaPorGuia[guia.id] = vlrTabela;

    const criticasGuia = avaliarGuiaNas4CriticasObrigatorias({
      guia,
      todasGuias: guiasFaturamento,
      valorTabelaOperadora: vlrTabela,
    });

    todasCriticas.push(...criticasGuia);

    const novoStatusGuia: StatusGuiaTiss =
      criticasGuia.length > 0
        ? 'retida_auditoria'
        : guia.status_guia === 'faturada_xml'
          ? 'faturada_xml'
          : 'validada_lote';

    const novoStatusAuditoria =
      criticasGuia.length > 0 ? 'reprovado' : 'aprovado';

    guiasAvaliadas.push({
      ...guia,
      status_guia: novoStatusGuia,
      status_auditoria: novoStatusAuditoria,
      total_glosas_detectadas: criticasGuia.length,
      auditado_em: agora,
      criticas_auditoria: criticasGuia,
    });
  }

  // Persistir status atualizado nas guias locais
  const mapAvaliadas = new Map(guiasAvaliadas.map((g) => [g.id, g]));
  const guiasLocaisAtualizadas = getLocalGuiasRaw().map((g) => {
    const av = mapAvaliadas.get(g.id);
    if (!av) return g;
    return {
      ...g,
      status_guia: av.status_guia,
      status_auditoria: av.status_auditoria,
      total_glosas_detectadas: av.total_glosas_detectadas,
      auditado_em: av.auditado_em,
    };
  });
  saveLocalGuias(guiasLocaisAtualizadas);
  saveLocalAuditoriasCriticas(todasCriticas);

  // Construir o Resumo de Auditoria por Lote
  const resumosLotes: ResumoAuditoriaLote[] = todosLotes.map((lote) => {
    const guiasDoLote = guiasAvaliadas.filter(
      (g) => g.numero_lote === lote.numero_lote || g.lote_id === lote.id
    );
    const guiasRetidas = guiasDoLote.filter(
      (g) => (g.criticas_auditoria?.length || 0) > 0
    );
    const guiasAprovadas = guiasDoLote.filter(
      (g) => (g.criticas_auditoria?.length || 0) === 0
    );
    const totalCriticasPendentes = guiasDoLote.reduce(
      (acc, g) => acc + (g.criticas_auditoria?.length || 0),
      0
    );
    const valorTotalLote = guiasDoLote.reduce(
      (acc, g) => acc + Number(g.valor_total_guia || 0),
      0
    );
    const valorRetidoEmGlosa = guiasRetidas.reduce(
      (acc, g) => acc + Number(g.valor_total_guia || 0),
      0
    );

    return {
      loteId: lote.id,
      numeroLote: lote.numero_lote,
      operadoraNome: lote.operadora?.nome || 'OPERADORA',
      versaoTiss: lote.versao_tiss || '4.03.00',
      totalGuias: guiasDoLote.length,
      guiasAprovadas: guiasAprovadas.length,
      guiasRetidas: guiasRetidas.length,
      totalCriticasPendentes,
      valorTotalLote: Number(valorTotalLote.toFixed(2)),
      valorRetidoEmGlosa: Number(valorRetidoEmGlosa.toFixed(2)),
      aptoParaGerarXml: guiasDoLote.length > 0 && guiasRetidas.length === 0,
    };
  });

  // Aplicar filtros solicitados na tela
  let guiasFiltradas = guiasAvaliadas;
  if (params?.numeroLoteFiltro) {
    guiasFiltradas = guiasFiltradas.filter(
      (g) => g.numero_lote === params.numeroLoteFiltro
    );
  }
  if (params?.convenioFiltro) {
    guiasFiltradas = guiasFiltradas.filter(
      (g) =>
        g.plano?.operadora?.nome?.toUpperCase() ===
        params.convenioFiltro?.toUpperCase()
    );
  }

  return {
    guiasAuditadas: guiasFiltradas,
    resumosLotes,
    todasCriticasPendentes: todasCriticas,
    valorTabelaPorGuia,
  };
}

/**
 * Corrige uma ou todas as 4 falhas críticas de uma Guia retida na Auditoria
 * e revalida imediatamente a guia para liberação do Lote Pré-XML.
 */
export async function corrigirFalhasAuditoriaGuia(
  dto: CorrigirFalhaAuditoriaDTO
): Promise<{
  guiaAtualizada: GuiaTissRecord | null;
  criticasRestantes: AuditoriaCriticaRecord[];
  error: string | null;
}> {
  const [{ data: todasGuias }, { data: terapeutas }] = await Promise.all([
    listarGuiasTiss(),
    listarTerapeutas(),
  ]);

  const guiaAlvo = todasGuias.find((g) => g.id === dto.guia_id);
  if (!guiaAlvo) {
    return {
      guiaAtualizada: null,
      criticasRestantes: [],
      error: 'Guia não encontrada para correção.',
    };
  }

  const valorTabela = await obterValorSessaoContratual({
    operadoraId:
      guiaAlvo.plano?.operadora_id || guiaAlvo.plano?.operadora?.id,
    operadoraNome: guiaAlvo.plano?.operadora?.nome,
    planoSaudeId: guiaAlvo.plano_saude_id,
    codigoTuss: guiaAlvo.codigo_tuss,
  });

  // 1. Determinar novo Valor Unitário
  let novoValorUnitario = Number(
    guiaAlvo.valor_unitario_sessao ??
      guiaAlvo.sessoes?.[0]?.valor_unitario ??
      135.0
  );
  if (dto.aplicar_valor_tabela && valorTabela && valorTabela > 0) {
    novoValorUnitario = valorTabela;
  } else if (
    dto.novo_valor_unitario !== undefined &&
    dto.novo_valor_unitario > 0
  ) {
    novoValorUnitario = Number(dto.novo_valor_unitario);
  }

  // 2. Determinar novo Terapeuta Executante
  let novoTerapeutaExecId =
    guiaAlvo.terapeuta_executante_id || guiaAlvo.terapeuta_designado_id;
  if (dto.alinhar_terapeuta_designado) {
    novoTerapeutaExecId = guiaAlvo.terapeuta_designado_id;
  } else if (dto.novo_terapeuta_executante_id) {
    novoTerapeutaExecId = dto.novo_terapeuta_executante_id;
  }

  // 3. Determinar novas Sessões (Deduplicação de Datas e/ou Normalização de Quantidade = 1)
  let sessoesBase: Array<{ data_realizacao: string; quantidade: number }> =
    dto.novas_sessoes
      ? dto.novas_sessoes.map((s) => ({
          data_realizacao: s.data_realizacao.split('T')[0],
          quantidade: Number(s.quantidade) || 1,
        }))
      : (guiaAlvo.sessoes || []).map((s) => ({
          data_realizacao: s.data_realizacao.split('T')[0],
          quantidade: Number(s.quantidade) || 1,
        }));

  if (dto.deduplicar_datas) {
    // Coleta datas usadas em outras guias da mesma autorização/paciente
    const datasOcupadasOutrasGuias = new Set<string>();
    todasGuias
      .filter(
        (outra) =>
          outra.id !== guiaAlvo.id &&
          (outra.autorizacao_id === guiaAlvo.autorizacao_id ||
            (outra.paciente_id === guiaAlvo.paciente_id &&
              outra.codigo_tuss === guiaAlvo.codigo_tuss))
      )
      .forEach((outra) => {
        (outra.sessoes || []).forEach((s) => {
          datasOcupadasOutrasGuias.add(s.data_realizacao.split('T')[0]);
        });
      });

    const datasUnicas = new Set<string>();
    const deduplicadas: Array<{ data_realizacao: string; quantidade: number }> = [];

    for (const item of sessoesBase) {
      if (
        !datasUnicas.has(item.data_realizacao) &&
        !datasOcupadasOutrasGuias.has(item.data_realizacao)
      ) {
        datasUnicas.add(item.data_realizacao);
        deduplicadas.push(item);
      }
    }
    sessoesBase = deduplicadas;
  }

  if (dto.normalizar_quantidade_1) {
    sessoesBase = sessoesBase.map((s) => ({
      ...s,
      quantidade: 1,
    }));
  }

  sessoesBase.sort((a, b) => a.data_realizacao.localeCompare(b.data_realizacao));

  const qtdTotalSessoes = sessoesBase.reduce((acc, s) => acc + s.quantidade, 0);
  const novoValorTotalGuia = Number((qtdTotalSessoes * novoValorUnitario).toFixed(2));
  const agora = new Date().toISOString();

  // Persistir no Supabase (se configurado)
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('guias_tiss')
        .update({
          terapeuta_executante_id: novoTerapeutaExecId,
          valor_unitario_sessao: novoValorUnitario,
          valor_total_guia: novoValorTotalGuia,
          qtd_sessoes_previstas: sessoesBase.length,
          updated_at: agora,
        })
        .eq('id', guiaAlvo.id);

      await supabase
        .from('guias_tiss_sessoes')
        .delete()
        .eq('guia_id', guiaAlvo.id);

      const payloadSessoes = sessoesBase.map((s, idx) => ({
        guia_id: guiaAlvo.id,
        ordem_sessao: idx + 1,
        data_realizacao: s.data_realizacao,
        quantidade: s.quantidade,
        valor_unitario: novoValorUnitario,
        valor_total: Number((s.quantidade * novoValorUnitario).toFixed(2)),
        assinatura_confirmada: true,
      }));

      if (payloadSessoes.length > 0) {
        await supabase.from('guias_tiss_sessoes').insert(payloadSessoes);
      }
    } catch {
      // Fallback local
    }
  }

  // Persistir no LocalStorage
  const novasSessoesLocais: GuiaTissSessaoRecord[] = sessoesBase.map((s, idx) => ({
    id: `ses-corr-${guiaAlvo.id}-${idx + 1}`,
    guia_id: guiaAlvo.id,
    ordem_sessao: idx + 1,
    data_realizacao: s.data_realizacao,
    quantidade: s.quantidade,
    valor_unitario: novoValorUnitario,
    valor_total: Number((s.quantidade * novoValorUnitario).toFixed(2)),
    assinatura_confirmada: true,
    created_at: agora,
  }));

  const sessoesOutrasGuias = getLocalSessoesRaw().filter(
    (s) => s.guia_id !== guiaAlvo.id
  );
  saveLocalSessoes([...sessoesOutrasGuias, ...novasSessoesLocais]);

  const terExecObj = terapeutas.find((t) => t.id === novoTerapeutaExecId);
  const guiasLocais = getLocalGuiasRaw().map((g) =>
    g.id === guiaAlvo.id
      ? {
          ...g,
          terapeuta_executante_id: novoTerapeutaExecId,
          terapeuta_executante: terExecObj,
          valor_unitario_sessao: novoValorUnitario,
          valor_total_guia: novoValorTotalGuia,
          qtd_sessoes_previstas: sessoesBase.length,
          updated_at: agora,
        }
      : g
  );
  saveLocalGuias(guiasLocais);

  // Re-executar a conferência para atualizar o status da guia e do lote
  const { guiasAuditadas } = await executarConferenciaPreXml();
  const guiaReavaliada =
    guiasAuditadas.find((g) => g.id === guiaAlvo.id) || null;

  return {
    guiaAtualizada: guiaReavaliada,
    criticasRestantes: guiaReavaliada?.criticas_auditoria || [],
    error: null,
  };
}

