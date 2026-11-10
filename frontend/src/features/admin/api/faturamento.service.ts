import { supabase } from '@/services/supabase';
import type {
  CreateLoteFaturamentoDTO,
  CreateProcedimentoTussDTO,
  DigitarGuiaFaturamentoDTO,
  GuiaTissRecord,
  GuiaTissSessaoRecord,
  LoteFaturamentoRecord,
  PlanoProcedimentoPrecoRecord,
  ProcedimentoTussRecord,
  UpsertPlanoProcedimentoPrecoDTO,
} from '../types';
import {
  listarAutorizacoes,
  listarGuiasTiss,
  listarProcedimentosTuss,
  listarTerapeutas,
} from './autorizacoes.service';
import { listarOperadorasComPlanos } from './convenios.service';
import { listarPacientes } from './pacientes.service';
import { validarDigitacaoGuiaFaturamento } from '../utils/faturamentoValidators';

const LS_PROCEDIMENTOS_KEY = 'clinica_elman_procedimentos_tuss_v1';
const LS_GUIAS_TISS_KEY = 'clinica_elman_guias_tiss_v1';
const LS_GUIAS_SESSOES_KEY = 'clinica_elman_guias_sessoes_v1';
const LS_PRECOS_CONTRATO_KEY = 'clinica_elman_precos_contrato_v1';
const LS_LOTES_FATURAMENTO_KEY = 'clinica_elman_lotes_faturamento_v1';

const SEED_PRECOS_CONTRATO: PlanoProcedimentoPrecoRecord[] = [
  {
    id: 'preco-bradesco-50000470',
    operadora_id: 'op-bradesco',
    plano_saude_id: null,
    codigo_tuss: '50000470',
    valor_sessao: 165.0,
    numero_contrato: 'CONTRATO-BRADESCO-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-bradesco-50000615',
    operadora_id: 'op-bradesco',
    plano_saude_id: null,
    codigo_tuss: '50000615',
    valor_sessao: 150.0,
    numero_contrato: 'CONTRATO-BRADESCO-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-bradesco-50000054',
    operadora_id: 'op-bradesco',
    plano_saude_id: null,
    codigo_tuss: '50000054',
    valor_sessao: 155.0,
    numero_contrato: 'CONTRATO-BRADESCO-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-bradesco-20103471',
    operadora_id: 'op-bradesco',
    plano_saude_id: null,
    codigo_tuss: '20103471',
    valor_sessao: 135.0,
    numero_contrato: 'CONTRATO-BRADESCO-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-sulamerica-50000470',
    operadora_id: 'op-sulamerica',
    plano_saude_id: null,
    codigo_tuss: '50000470',
    valor_sessao: 160.0,
    numero_contrato: 'CONTRATO-SULAMERICA-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-sulamerica-50000615',
    operadora_id: 'op-sulamerica',
    plano_saude_id: null,
    codigo_tuss: '50000615',
    valor_sessao: 145.0,
    numero_contrato: 'CONTRATO-SULAMERICA-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-unimed-50000470',
    operadora_id: 'op-unimed',
    plano_saude_id: null,
    codigo_tuss: '50000470',
    valor_sessao: 130.0,
    numero_contrato: 'CONTRATO-UNIMED-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-unimed-20103471',
    operadora_id: 'op-unimed',
    plano_saude_id: null,
    codigo_tuss: '20103471',
    valor_sessao: 115.0,
    numero_contrato: 'CONTRATO-UNIMED-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-cassi-20103471',
    operadora_id: 'op-cassi',
    plano_saude_id: null,
    codigo_tuss: '20103471',
    valor_sessao: 110.0,
    numero_contrato: 'CONTRATO-CASSI-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
  {
    id: 'preco-cassi-50000470',
    operadora_id: 'op-cassi',
    plano_saude_id: null,
    codigo_tuss: '50000470',
    valor_sessao: 125.0,
    numero_contrato: 'CONTRATO-CASSI-2026',
    vigencia_inicio: '2026-01-01',
    ativo: true,
  },
];

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder'));
}

function getLocalPrecosRaw(): PlanoProcedimentoPrecoRecord[] {
  try {
    const raw = localStorage.getItem(LS_PRECOS_CONTRATO_KEY);
    if (!raw) {
      localStorage.setItem(LS_PRECOS_CONTRATO_KEY, JSON.stringify(SEED_PRECOS_CONTRATO));
      return SEED_PRECOS_CONTRATO;
    }
    return JSON.parse(raw) as PlanoProcedimentoPrecoRecord[];
  } catch {
    return SEED_PRECOS_CONTRATO;
  }
}

function saveLocalPrecos(items: PlanoProcedimentoPrecoRecord[]) {
  try {
    localStorage.setItem(LS_PRECOS_CONTRATO_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage error
  }
}

function getLocalLotesRaw(): LoteFaturamentoRecord[] {
  try {
    const raw = localStorage.getItem(LS_LOTES_FATURAMENTO_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LoteFaturamentoRecord[];
  } catch {
    return [];
  }
}

function saveLocalLotes(items: LoteFaturamentoRecord[]) {
  try {
    localStorage.setItem(LS_LOTES_FATURAMENTO_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage error
  }
}

function getLocalGuiasRaw(): GuiaTissRecord[] {
  try {
    const raw = localStorage.getItem(LS_GUIAS_TISS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuiaTissRecord[];
  } catch {
    return [];
  }
}

function saveLocalGuias(items: GuiaTissRecord[]) {
  try {
    localStorage.setItem(LS_GUIAS_TISS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage error
  }
}

function getLocalSessoesRaw(): GuiaTissSessaoRecord[] {
  try {
    const raw = localStorage.getItem(LS_GUIAS_SESSOES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuiaTissSessaoRecord[];
  } catch {
    return [];
  }
}

function saveLocalSessoes(items: GuiaTissSessaoRecord[]) {
  try {
    localStorage.setItem(LS_GUIAS_SESSOES_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage error
  }
}

// ============================================================================
// 1. FLUXO PADRÃO DE TABELA TUSS E PREÇOS CONTRATUAIS POR OPERADORA (3 ETAPAS)
// ============================================================================

/**
 * Etapa 2 do fluxo padrão: A clínica cadastra ou importa códigos padrão TUSS no sistema
 */
export async function cadastrarOuImportarCodigosTuss(
  novosCodigos: CreateProcedimentoTussDTO[]
): Promise<{
  data: ProcedimentoTussRecord[];
  importados: number;
  error: string | null;
}> {
  if (novosCodigos.length === 0) {
    const { data } = await listarProcedimentosTuss();
    return { data, importados: 0, error: null };
  }

  const normalizados: ProcedimentoTussRecord[] = novosCodigos.map((item) => ({
    codigo_tuss: item.codigo_tuss.trim(),
    descricao: item.descricao.trim(),
    tabela_dominio: item.tabela_dominio || '22',
    conselho_obrigatorio: item.conselho_obrigatorio || 'CRP',
    cbo_prefixo: item.cbo_prefixo || '251510',
    exige_senha: item.exige_senha ?? true,
  }));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('procedimentos_tuss')
        .upsert(normalizados, { onConflict: 'codigo_tuss' });

      if (!error) {
        const { data } = await listarProcedimentosTuss();
        return { data, importados: normalizados.length, error: null };
      }
    } catch {
      // Fallback local
    }
  }

  const { data: atuais } = await listarProcedimentosTuss();
  const mapa = new Map<string, ProcedimentoTussRecord>();
  atuais.forEach((p) => mapa.set(p.codigo_tuss, p));
  normalizados.forEach((p) => mapa.set(p.codigo_tuss, p));

  const listaFinal = Array.from(mapa.values()).sort((a, b) =>
    a.codigo_tuss.localeCompare(b.codigo_tuss)
  );
  try {
    localStorage.setItem(LS_PROCEDIMENTOS_KEY, JSON.stringify(listaFinal));
  } catch {
    // Ignore
  }

  return { data: listaFinal, importados: normalizados.length, error: null };
}

/**
 * Etapa 3 do fluxo padrão: Lista a tabela de preços contratuais acordados com cada Operadora/Plano
 */
export async function listarTabelaPrecosOperadoras(
  operadoraIdFiltro?: string
): Promise<{
  data: PlanoProcedimentoPrecoRecord[];
  source: 'supabase' | 'local';
}> {
  const [{ data: operadoras }, { data: procedimentos }] = await Promise.all([
    listarOperadorasComPlanos(),
    listarProcedimentosTuss(),
  ]);

  const mapOperadora = new Map(operadoras.map((op) => [op.id, op]));
  const mapProcedimento = new Map(procedimentos.map((pr) => [pr.codigo_tuss, pr]));

  const hidratar = (lista: PlanoProcedimentoPrecoRecord[]) => {
    const hidratados = lista.map((item) => {
      const op =
        mapOperadora.get(item.operadora_id) ||
        operadoras.find(
          (o) =>
            o.nome.toUpperCase() ===
            item.operadora_id.replace('op-', '').toUpperCase()
        );
      const pl = op?.planos?.find((p) => p.id === item.plano_saude_id);
      const proc = mapProcedimento.get(item.codigo_tuss);
      return {
        ...item,
        valor_sessao: Number(item.valor_sessao),
        operadora: op,
        plano: pl,
        procedimento: proc,
      };
    });

    if (!operadoraIdFiltro) return hidratados;
    const opAlvo = mapOperadora.get(operadoraIdFiltro);
    return hidratados.filter(
      (i) =>
        i.operadora_id === operadoraIdFiltro ||
        (opAlvo && i.operadora?.nome.toUpperCase() === opAlvo.nome.toUpperCase())
    );
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('planos_procedimentos_precos')
        .select('*')
        .eq('ativo', true)
        .order('codigo_tuss', { ascending: true });

      if (!error && data && data.length > 0) {
        return {
          data: hidratar(data as PlanoProcedimentoPrecoRecord[]),
          source: 'supabase',
        };
      }
    } catch {
      // Fallback local
    }
  }

  return {
    data: hidratar(getLocalPrecosRaw()),
    source: 'local',
  };
}

/**
 * Busca o Valor da Sessão contratual acordado com a Operadora/Plano para um código TUSS
 */
export async function obterValorSessaoContratual(params: {
  operadoraId?: string;
  operadoraNome?: string;
  planoSaudeId?: string | null;
  codigoTuss: string;
}): Promise<number | null> {
  const { operadoraId, operadoraNome, planoSaudeId, codigoTuss } = params;
  const { data: precos } = await listarTabelaPrecosOperadoras();

  // 1. Procura preço específico do Plano + Código TUSS
  if (planoSaudeId) {
    const especificoPlano = precos.find(
      (p) => p.plano_saude_id === planoSaudeId && p.codigo_tuss === codigoTuss
    );
    if (especificoPlano) return Number(especificoPlano.valor_sessao);
  }

  // 2. Procura preço geral da Operadora + Código TUSS
  const porOperadora = precos.find((p) => {
    if (p.codigo_tuss !== codigoTuss) return false;
    if (operadoraId && p.operadora_id === operadoraId) return true;
    if (
      operadoraNome &&
      p.operadora?.nome.toUpperCase() === operadoraNome.toUpperCase()
    ) {
      return true;
    }
    if (
      operadoraNome &&
      p.operadora_id.toUpperCase().includes(operadoraNome.toUpperCase())
    ) {
      return true;
    }
    return false;
  });

  return porOperadora ? Number(porOperadora.valor_sessao) : null;
}

/**
 * Etapa 3 do fluxo padrão: A clínica digita ou atualiza o preço acordado com uma operadora para um código TUSS
 */
export async function salvarPrecoContratualOperadora(
  dto: UpsertPlanoProcedimentoPrecoDTO
): Promise<{
  data: PlanoProcedimentoPrecoRecord | null;
  error: string | null;
}> {
  if (!dto.operadora_id || !dto.codigo_tuss || dto.valor_sessao <= 0) {
    return {
      data: null,
      error: 'Informe a Operadora, o Código TUSS e um Valor de Sessão maior que zero.',
    };
  }

  if (isSupabaseConfigured()) {
    try {
      // Verifica se já existe registro para (operadora_id, plano_saude_id, codigo_tuss)
      let query = supabase
        .from('planos_procedimentos_precos')
        .select('id')
        .eq('operadora_id', dto.operadora_id)
        .eq('codigo_tuss', dto.codigo_tuss);

      if (dto.plano_saude_id) {
        query = query.eq('plano_saude_id', dto.plano_saude_id);
      } else {
        query = query.is('plano_saude_id', null);
      }

      const { data: existente } = await query.maybeSingle();

      if (existente?.id) {
        const { error: updateErr } = await supabase
          .from('planos_procedimentos_precos')
          .update({
            valor_sessao: dto.valor_sessao,
            numero_contrato: dto.numero_contrato || null,
            vigencia_inicio: dto.vigencia_inicio || null,
            vigencia_fim: dto.vigencia_fim || null,
            ativo: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existente.id);

        if (!updateErr) {
          const { data: todos } = await listarTabelaPrecosOperadoras(dto.operadora_id);
          return {
            data: todos.find((p) => p.id === existente.id) || null,
            error: null,
          };
        }
      } else {
        const { data: inserido, error: insertErr } = await supabase
          .from('planos_procedimentos_precos')
          .insert({
            operadora_id: dto.operadora_id,
            plano_saude_id: dto.plano_saude_id || null,
            codigo_tuss: dto.codigo_tuss,
            valor_sessao: dto.valor_sessao,
            numero_contrato: dto.numero_contrato || null,
            vigencia_inicio: dto.vigencia_inicio || null,
            vigencia_fim: dto.vigencia_fim || null,
            ativo: true,
          })
          .select('*')
          .single();

        if (!insertErr && inserido) {
          const { data: todos } = await listarTabelaPrecosOperadoras(dto.operadora_id);
          return {
            data: todos.find((p) => p.id === inserido.id) || null,
            error: null,
          };
        }
      }
    } catch {
      // Fallback local
    }
  }

  const locais = getLocalPrecosRaw();
  const idx = locais.findIndex(
    (p) =>
      p.operadora_id === dto.operadora_id &&
      (p.plano_saude_id || null) === (dto.plano_saude_id || null) &&
      p.codigo_tuss === dto.codigo_tuss
  );

  let salvo: PlanoProcedimentoPrecoRecord;
  if (idx >= 0) {
    salvo = {
      ...locais[idx],
      valor_sessao: Number(dto.valor_sessao),
      numero_contrato: dto.numero_contrato || locais[idx].numero_contrato,
      vigencia_inicio: dto.vigencia_inicio || locais[idx].vigencia_inicio,
      vigencia_fim: dto.vigencia_fim || locais[idx].vigencia_fim,
      ativo: true,
      updated_at: new Date().toISOString(),
    };
    locais[idx] = salvo;
  } else {
    salvo = {
      id: `preco-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      operadora_id: dto.operadora_id,
      plano_saude_id: dto.plano_saude_id || null,
      codigo_tuss: dto.codigo_tuss,
      valor_sessao: Number(dto.valor_sessao),
      numero_contrato: dto.numero_contrato || null,
      vigencia_inicio: dto.vigencia_inicio || new Date().toISOString().split('T')[0],
      vigencia_fim: dto.vigencia_fim || null,
      ativo: true,
      created_at: new Date().toISOString(),
    };
    locais.push(salvo);
  }

  saveLocalPrecos(locais);
  const { data: todos } = await listarTabelaPrecosOperadoras(dto.operadora_id);
  return {
    data: todos.find((p) => p.id === salvo.id) || salvo,
    error: null,
  };
}

/**
 * Executa as Etapas 2 e 3 em Lote:
 * 1) Importa novos códigos TUSS para a base da clínica (se informada descrição)
 * 2) Grava os preços contratuais para a Operadora selecionada
 */
export async function importarContratoOperadoraEmLote(params: {
  operadora_id: string;
  plano_saude_id?: string | null;
  numero_contrato?: string | null;
  vigencia_inicio?: string | null;
  itens: Array<{
    codigo_tuss: string;
    descricao?: string;
    valor_sessao: number;
    conselho_obrigatorio?: string;
    cbo_prefixo?: string;
  }>;
}): Promise<{
  totalImportados: number;
  error: string | null;
}> {
  const { operadora_id, plano_saude_id, numero_contrato, vigencia_inicio, itens } =
    params;

  // Etapa 2: Garantir que todos os códigos TUSS existam na tabela procedimentos_tuss
  const { data: tussExistentes } = await listarProcedimentosTuss();
  const mapTuss = new Map(tussExistentes.map((t) => [t.codigo_tuss, t]));

  const novosTuss: CreateProcedimentoTussDTO[] = [];
  itens.forEach((item) => {
    if (!mapTuss.has(item.codigo_tuss) || item.descricao) {
      const atual = mapTuss.get(item.codigo_tuss);
      novosTuss.push({
        codigo_tuss: item.codigo_tuss,
        descricao:
          item.descricao ||
          atual?.descricao ||
          `Procedimento Terapêutico TUSS ${item.codigo_tuss}`,
        tabela_dominio: '22',
        conselho_obrigatorio:
          item.conselho_obrigatorio || atual?.conselho_obrigatorio || 'CRP',
        cbo_prefixo: item.cbo_prefixo || atual?.cbo_prefixo || '251510',
        exige_senha: true,
      });
    }
  });

  if (novosTuss.length > 0) {
    await cadastrarOuImportarCodigosTuss(novosTuss);
  }

  // Etapa 3: Gravar os valores acordados para a operadora
  let count = 0;
  for (const item of itens) {
    const { error } = await salvarPrecoContratualOperadora({
      operadora_id,
      plano_saude_id: plano_saude_id || null,
      codigo_tuss: item.codigo_tuss,
      valor_sessao: item.valor_sessao,
      numero_contrato: numero_contrato || null,
      vigencia_inicio: vigencia_inicio || null,
    });
    if (!error) count++;
  }

  return { totalImportados: count, error: null };
}

// ============================================================================
// 2. GESTÃO DE LOTES DE FATURAMENTO (NUMERAÇÃO CONTROLADA / ALEATÓRIA)
// ============================================================================

/**
 * Gera um número de lote aleatório de 6 dígitos (padrão TISS <ans:numeroLote>)
 * verificando se já não está em uso.
 */
export async function gerarNumeroLoteControlado(): Promise<string> {
  const { data: lotes } = await listarLotesFaturamento();
  const existentes = new Set(lotes.map((l) => l.numero_lote));

  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const aleatorio = String(Math.floor(100000 + Math.random() * 900000));
    if (!existentes.has(aleatorio)) {
      return aleatorio;
    }
  }
  return String(Date.now()).slice(-6);
}

/**
 * Lista todos os Lotes de Faturamento hidratados com Operadora e Guias vinculadas
 */
export async function listarLotesFaturamento(
  operadoraIdFiltro?: string
): Promise<{
  data: LoteFaturamentoRecord[];
  source: 'supabase' | 'local';
}> {
  const [{ data: operadoras }, { data: todasGuias }] = await Promise.all([
    listarOperadorasComPlanos(),
    listarGuiasTiss(),
  ]);

  const mapOperadora = new Map(operadoras.map((op) => [op.id, op]));

  const hidratarLotes = (lotesBase: LoteFaturamentoRecord[]): LoteFaturamentoRecord[] => {
    // Além dos lotes salvos explicitamente, se houver guias com numero_lote que ainda não têm registro em lotesBase, consolida-os
    const mapaLotes = new Map<string, LoteFaturamentoRecord>();
    lotesBase.forEach((l) => mapaLotes.set(l.numero_lote, { ...l }));

    todasGuias.forEach((guia) => {
      if (!guia.numero_lote) return;
      const existente = mapaLotes.get(guia.numero_lote);
      if (!existente) {
        const opId =
          guia.plano?.operadora_id ||
          guia.plano?.operadora?.id ||
          operadoras[0]?.id ||
          'op-bradesco';
        mapaLotes.set(guia.numero_lote, {
          id: guia.lote_id || `lote-${guia.numero_lote}`,
          numero_lote: guia.numero_lote,
          operadora_id: opId,
          versao_tiss: guia.versao_tiss || '4.03.00',
          status_lote: guia.status_guia === 'faturada_xml' ? 'xml_gerado' : 'aberto',
          quantidade_guias: 0,
          valor_total_lote: 0,
          created_at: guia.digitado_faturamento_em || guia.updated_at || guia.created_at,
        });
      }
    });

    const resultado = Array.from(mapaLotes.values()).map((lote) => {
      const guiasDoLote = todasGuias.filter(
        (g) => g.lote_id === lote.id || g.numero_lote === lote.numero_lote
      );
      const somaValor = guiasDoLote.reduce((acc, g) => {
        if (g.valor_total_guia && g.valor_total_guia > 0) {
          return acc + Number(g.valor_total_guia);
        }
        const qtd = g.sessoes?.length || g.qtd_sessoes_previstas || 0;
        const unit = g.valor_unitario_sessao || g.autorizacao?.valor_unitario_sessao || 0;
        return acc + qtd * unit;
      }, 0);

      const op =
        mapOperadora.get(lote.operadora_id) ||
        guiasDoLote[0]?.plano?.operadora;

      return {
        ...lote,
        operadora: op,
        versao_tiss: op?.versao_tiss || lote.versao_tiss || '4.03.00',
        guias: guiasDoLote,
        quantidade_guias: guiasDoLote.length,
        valor_total_lote: Number(somaValor.toFixed(2)),
      };
    });

    const filtrados = operadoraIdFiltro
      ? resultado.filter((l) => l.operadora_id === operadoraIdFiltro)
      : resultado;

    return filtrados.sort((a, b) =>
      (b.created_at || '').localeCompare(a.created_at || '')
    );
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return {
          data: hidratarLotes(data as LoteFaturamentoRecord[]),
          source: 'supabase',
        };
      }
    } catch {
      // Fallback local
    }
  }

  return {
    data: hidratarLotes(getLocalLotesRaw()),
    source: 'local',
  };
}

/**
 * Cria um novo Lote de Faturamento ou retorna o existente se o numero_lote já estiver aberto para a mesma Operadora
 */
export async function criarOuObterLoteFaturamento(
  dto: CreateLoteFaturamentoDTO
): Promise<{
  data: LoteFaturamentoRecord | null;
  error: string | null;
}> {
  const numeroLimpo = dto.numero_lote.trim();
  if (!numeroLimpo) {
    return { data: null, error: 'Informe ou gere o Número do Lote.' };
  }

  const [{ data: lotesExistentes }, { data: operadoras }] = await Promise.all([
    listarLotesFaturamento(),
    listarOperadorasComPlanos(),
  ]);

  const jaExiste = lotesExistentes.find((l) => l.numero_lote === numeroLimpo);
  if (jaExiste) {
    if (jaExiste.operadora_id !== dto.operadora_id && jaExiste.quantidade_guias > 0) {
      return {
        data: null,
        error: `O Lote #${numeroLimpo} já pertence à operadora ${jaExiste.operadora?.nome || 'outra operadora'}. Gere outro número de lote para não misturar operadoras diferentes.`,
      };
    }
    return { data: jaExiste, error: null };
  }

  const operadora = operadoras.find((op) => op.id === dto.operadora_id);
  const versaoTiss = dto.versao_tiss || operadora?.versao_tiss || '4.03.00';

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('lotes_faturamento')
        .insert({
          numero_lote: numeroLimpo,
          operadora_id: dto.operadora_id,
          versao_tiss: versaoTiss,
          status_lote: 'aberto',
          quantidade_guias: 0,
          valor_total_lote: 0,
          observacoes: dto.observacoes || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        return {
          data: {
            ...(data as LoteFaturamentoRecord),
            operadora,
            guias: [],
          },
          error: null,
        };
      }
    } catch {
      // Fallback local
    }
  }

  const novoLote: LoteFaturamentoRecord = {
    id: `lote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    numero_lote: numeroLimpo,
    operadora_id: dto.operadora_id,
    versao_tiss: versaoTiss,
    status_lote: 'aberto',
    quantidade_guias: 0,
    valor_total_lote: 0,
    observacoes: dto.observacoes || null,
    created_at: new Date().toISOString(),
    operadora,
    guias: [],
  };

  const locais = getLocalLotesRaw();
  saveLocalLotes([novoLote, ...locais]);
  return { data: novoLote, error: null };
}

// ============================================================================
// 3. RECEBIMENTO E DIGITAÇÃO DE GUIA NO FATURAMENTO
// ============================================================================

/**
 * Retorna todas as datas de sessões já lançadas em OUTRAS guias da mesma Autorização (Senha),
 * permitindo validar a Periodicidade Semanal (Semana ISO) e o Saldo Total da Senha.
 */
export async function obterDatasOutrasGuiasMesmaAutorizacao(
  autorizacaoId: string,
  ignorarGuiaId?: string | null
): Promise<string[]> {
  if (!autorizacaoId) return [];
  const { data: todasGuias } = await listarGuiasTiss();

  const datas: string[] = [];
  todasGuias
    .filter((g) => g.autorizacao_id === autorizacaoId && g.id !== ignorarGuiaId)
    .forEach((g) => {
      (g.sessoes || []).forEach((s) => {
        if (s.data_realizacao) {
          datas.push(s.data_realizacao.split('T')[0]);
        }
      });
    });

  return datas;
}

/**
 * Registra a digitação/conferência da Guia de Atendimento no Faturamento,
 * validando Saldo Total, Periodicidade Semanal ISO, Vigência Campo 4 e Limite de 10 datas,
 * e vinculando ao Lote informado.
 */
export async function registrarDigitacaoGuiaNoLote(
  dto: DigitarGuiaFaturamentoDTO
): Promise<{
  data: GuiaTissRecord | null;
  lote: LoteFaturamentoRecord | null;
  error: string | null;
}> {
  const [
    { data: pacientes },
    { data: autorizacoes },
    { data: terapeutas },
    { data: todasGuias },
  ] = await Promise.all([
    listarPacientes(),
    listarAutorizacoes(),
    listarTerapeutas(),
    listarGuiasTiss(),
  ]);

  const paciente = pacientes.find((p) => p.id === dto.paciente_id);
  if (!paciente) {
    return { data: null, lote: null, error: 'Paciente não encontrado.' };
  }

  const autorizacao = autorizacoes.find((a) => a.id === dto.autorizacao_id);
  if (!autorizacao) {
    return {
      data: null,
      lote: null,
      error: 'Autorização (Senha) não encontrada para este paciente.',
    };
  }

  const datasOutrasGuias = await obterDatasOutrasGuiasMesmaAutorizacao(
    autorizacao.id,
    dto.guia_id
  );

  const operadoraId =
    paciente.plano?.operadora_id ||
    paciente.plano?.operadora?.id ||
    'op-bradesco';

  const valorTabelado = await obterValorSessaoContratual({
    operadoraId,
    operadoraNome: paciente.plano?.operadora?.nome,
    planoSaudeId: paciente.plano_saude_id,
    codigoTuss: autorizacao.codigo_tuss,
  });

  // Executar o Motor de Validação da Fase 3 antes de gravar
  const validacao = validarDigitacaoGuiaFaturamento({
    autorizacao,
    datasSessoes: dto.datas_sessoes,
    datasOutrasGuiasMesmaSenha: datasOutrasGuias,
    terapeutaExecutanteId: dto.terapeuta_executante_id || autorizacao.terapeuta_id,
    valorUnitarioInformado: dto.valor_unitario_sessao,
    valorTabeladoOperadora: valorTabelado,
  });

  if (!validacao.conforme) {
    return {
      data: null,
      lote: null,
      error: validacao.errosBloqueantes[0],
    };
  }

  // Criar ou obter o Lote da Operadora
  const { data: lote, error: erroLote } = await criarOuObterLoteFaturamento({
    numero_lote: dto.numero_lote,
    operadora_id: operadoraId,
    versao_tiss: paciente.plano?.operadora?.versao_tiss || '4.03.00',
  });

  if (erroLote || !lote) {
    return {
      data: null,
      lote: null,
      error: erroLote || 'Falha ao vincular o Lote de Faturamento.',
    };
  }

  const datasOrdenadas = [...dto.datas_sessoes].sort((a, b) =>
    a.data_realizacao.localeCompare(b.data_realizacao)
  );
  const valorUnitario = Number(dto.valor_unitario_sessao);
  const valorTotalGuia = Number((datasOrdenadas.length * valorUnitario).toFixed(2));
  const agora = new Date().toISOString();
  const terapeutaExecId = dto.terapeuta_executante_id || autorizacao.terapeuta_id;

  let guiaAlvoId = dto.guia_id || '';

  // Caso 1: Atualizando uma guia já existente (ex: recebida do Portal do Terapeuta)
  const guiaExistente = dto.guia_id
    ? todasGuias.find((g) => g.id === dto.guia_id)
    : null;

  if (isSupabaseConfigured()) {
    try {
      if (guiaExistente) {
        guiaAlvoId = guiaExistente.id;
        await supabase
          .from('guias_tiss')
          .update({
            lote_id: lote.id,
            numero_lote: lote.numero_lote,
            terapeuta_executante_id: terapeutaExecId,
            valor_unitario_sessao: valorUnitario,
            valor_total_guia: valorTotalGuia,
            qtd_sessoes_previstas: datasOrdenadas.length,
            status_guia: 'em_lote',
            digitado_faturamento_em: agora,
            updated_at: agora,
          })
          .eq('id', guiaAlvoId);

        await supabase
          .from('guias_tiss_sessoes')
          .delete()
          .eq('guia_id', guiaAlvoId);
      } else {
        const numeroGuiaPrestador = `${new Date().getFullYear()}${String(
          Math.floor(100000 + Math.random() * 900000)
        )}`;

        const { data: novaGuiaDb, error: errInsertGuia } = await supabase
          .from('guias_tiss')
          .insert({
            numero_guia_prestador: numeroGuiaPrestador,
            autorizacao_id: autorizacao.id,
            paciente_id: paciente.id,
            plano_saude_id: paciente.plano_saude_id,
            terapeuta_designado_id: autorizacao.terapeuta_id,
            terapeuta_executante_id: terapeutaExecId,
            versao_tiss: lote.versao_tiss,
            data_autorizacao_campo4: autorizacao.data_inicio,
            data_validade_senha: autorizacao.data_fim,
            numero_senha: autorizacao.numero_autorizacao,
            codigo_tuss: autorizacao.codigo_tuss,
            descricao_termo: autorizacao.descricao_termo,
            qtd_sessoes_previstas: datasOrdenadas.length,
            valor_unitario_sessao: valorUnitario,
            valor_total_guia: valorTotalGuia,
            nome_assinante: dto.nome_assinante || `${paciente.nome} (Conferido Faturamento)`,
            assinado_em: agora,
            status_guia: 'em_lote',
            enviada_faturamento_em: agora,
            digitado_faturamento_em: agora,
            lote_id: lote.id,
            numero_lote: lote.numero_lote,
          })
          .select('*')
          .single();

        if (!errInsertGuia && novaGuiaDb) {
          guiaAlvoId = novaGuiaDb.id;
        }
      }

      if (guiaAlvoId) {
        const sessoesPayload = datasOrdenadas.map((s, idx) => ({
          guia_id: guiaAlvoId,
          ordem_sessao: idx + 1,
          data_realizacao: s.data_realizacao,
          quantidade: s.quantidade || 1,
          valor_unitario: valorUnitario,
          valor_total: Number(((s.quantidade || 1) * valorUnitario).toFixed(2)),
          assinatura_confirmada: true,
        }));

        const { error: errSessoes } = await supabase
          .from('guias_tiss_sessoes')
          .insert(sessoesPayload);

        if (!errSessoes) {
          const [{ data: guiasAtualizadas }, { data: lotesAtualizados }] =
            await Promise.all([listarGuiasTiss(), listarLotesFaturamento()]);
          return {
            data: guiasAtualizadas.find((g) => g.id === guiaAlvoId) || null,
            lote:
              lotesAtualizados.find((l) => l.numero_lote === lote.numero_lote) ||
              lote,
            error: null,
          };
        }
      }
    } catch {
      // Continua para fallback local
    }
  }

  // Fallback LocalStorage sincronizado com autorizacoes.service.ts
  const guiasLocais = getLocalGuiasRaw();
  const sessoesLocais = getLocalSessoesRaw();

  if (guiaExistente) {
    guiaAlvoId = guiaExistente.id;
    const atualizadas = guiasLocais.map((g) =>
      g.id === guiaAlvoId
        ? {
            ...g,
            lote_id: lote.id,
            numero_lote: lote.numero_lote,
            terapeuta_executante_id: terapeutaExecId,
            terapeuta_executante: terapeutas.find((t) => t.id === terapeutaExecId),
            valor_unitario_sessao: valorUnitario,
            valor_total_guia: valorTotalGuia,
            qtd_sessoes_previstas: datasOrdenadas.length,
            status_guia: 'em_lote' as const,
            digitado_faturamento_em: agora,
            updated_at: agora,
          }
        : g
    );
    saveLocalGuias(atualizadas);
  } else {
    guiaAlvoId = `guia-fat-${Date.now()}`;
    const numeroGuiaPrestador = `${new Date().getFullYear()}${String(
      Math.floor(100000 + Math.random() * 900000)
    )}`;
    const novaGuiaLocal: GuiaTissRecord = {
      id: guiaAlvoId,
      numero_guia_prestador: numeroGuiaPrestador,
      autorizacao_id: autorizacao.id,
      paciente_id: paciente.id,
      plano_saude_id: paciente.plano_saude_id,
      terapeuta_designado_id: autorizacao.terapeuta_id,
      terapeuta_executante_id: terapeutaExecId,
      versao_tiss: lote.versao_tiss,
      data_autorizacao_campo4: autorizacao.data_inicio,
      data_validade_senha: autorizacao.data_fim,
      numero_senha: autorizacao.numero_autorizacao,
      codigo_tuss: autorizacao.codigo_tuss,
      descricao_termo: autorizacao.descricao_termo,
      qtd_sessoes_previstas: datasOrdenadas.length,
      valor_unitario_sessao: valorUnitario,
      valor_total_guia: valorTotalGuia,
      assinatura_paciente_base64: 'ASSINATURA_FISICA_CONFERIDA_FATURAMENTO',
      nome_assinante:
        dto.nome_assinante || `${paciente.nome} (Guia Física Conferida)`,
      assinado_em: agora,
      status_guia: 'em_lote',
      enviada_faturamento_em: agora,
      digitado_faturamento_em: agora,
      lote_id: lote.id,
      numero_lote: lote.numero_lote,
      created_at: agora,
      updated_at: agora,
    };
    saveLocalGuias([novaGuiaLocal, ...guiasLocais]);
  }

  const sessoesOutras = sessoesLocais.filter((s) => s.guia_id !== guiaAlvoId);
  const novasSessoes: GuiaTissSessaoRecord[] = datasOrdenadas.map((s, idx) => ({
    id: `ses-fat-${guiaAlvoId}-${idx + 1}`,
    guia_id: guiaAlvoId,
    ordem_sessao: idx + 1,
    data_realizacao: s.data_realizacao,
    quantidade: s.quantidade || 1,
    valor_unitario: valorUnitario,
    valor_total: Number(((s.quantidade || 1) * valorUnitario).toFixed(2)),
    assinatura_confirmada: true,
    created_at: agora,
  }));
  saveLocalSessoes([...sessoesOutras, ...novasSessoes]);

  const [{ data: guiasAtualizadas }, { data: lotesAtualizados }] =
    await Promise.all([listarGuiasTiss(), listarLotesFaturamento()]);

  return {
    data: guiasAtualizadas.find((g) => g.id === guiaAlvoId) || null,
    lote:
      lotesAtualizados.find((l) => l.numero_lote === lote.numero_lote) || lote,
    error: null,
  };
}

/**
 * Marca um Lote e todas as suas Guias vinculadas como "XML TISS Gerado" (faturada_xml)
 */
export async function marcarLoteComoXmlGerado(numeroLote: string): Promise<{
  lote: LoteFaturamentoRecord | null;
  error: string | null;
}> {
  const numLimpo = numeroLote.trim();
  if (!numLimpo) {
    return { lote: null, error: 'Número do lote inválido.' };
  }

  const agora = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('lotes_faturamento')
        .update({
          status_lote: 'xml_gerado',
          updated_at: agora,
        })
        .eq('numero_lote', numLimpo);

      await supabase
        .from('guias_tiss')
        .update({
          status_guia: 'faturada_xml',
          status_auditoria: 'aprovado',
          updated_at: agora,
        })
        .eq('numero_lote', numLimpo);
    } catch {
      // Fallback local
    }
  }

  const lotesLocais = getLocalLotesRaw().map((l) =>
    l.numero_lote === numLimpo
      ? { ...l, status_lote: 'xml_gerado' as const, updated_at: agora }
      : l
  );
  saveLocalLotes(lotesLocais);

  const guiasLocais = getLocalGuiasRaw().map((g) =>
    g.numero_lote === numLimpo
      ? {
          ...g,
          status_guia: 'faturada_xml' as const,
          status_auditoria: 'aprovado' as const,
          updated_at: agora,
        }
      : g
  );
  saveLocalGuias(guiasLocais);

  const { data: lotesAtualizados } = await listarLotesFaturamento();
  return {
    lote: lotesAtualizados.find((l) => l.numero_lote === numLimpo) || null,
    error: null,
  };
}


