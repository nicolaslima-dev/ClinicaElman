import { supabase } from '@/services/supabase';
import type {
  CreateOperadoraDTO,
  CreatePlanoSaudeDTO,
  OperadoraRecord,
  PlanoSaudeRecord,
} from '../types';

const LS_OPERADORAS_KEY = 'clinica_elman_operadoras_v1';
const LS_PLANOS_KEY = 'clinica_elman_planos_saude_v1';

const SEED_OPERADORAS: OperadoraRecord[] = [
  {
    id: 'op-bradesco',
    nome: 'BRADESCO',
    registro_ans: '005711',
    versao_tiss: '4.03.00',
    tamanho_matricula: 15,
    dias_validade_autorizacao: 90,
    codigo_prestador: 'ELMAN-005711',
    ativo: true,
  },
  {
    id: 'op-sulamerica',
    nome: 'SULAMERICA',
    registro_ans: '006246',
    versao_tiss: '4.03.00',
    tamanho_matricula: 12,
    dias_validade_autorizacao: 60,
    codigo_prestador: 'ELMAN-006246',
    ativo: true,
  },
  {
    id: 'op-unimed',
    nome: 'UNIMED',
    registro_ans: '343889',
    versao_tiss: '4.02.00',
    tamanho_matricula: 17,
    dias_validade_autorizacao: 60,
    codigo_prestador: 'ELMAN-343889',
    ativo: true,
  },
  {
    id: 'op-cassi',
    nome: 'CASSI',
    registro_ans: '346659',
    versao_tiss: '3.05.00',
    tamanho_matricula: 14,
    dias_validade_autorizacao: 90,
    codigo_prestador: 'ELMAN-346659',
    ativo: true,
  },
  {
    id: 'op-amil',
    nome: 'AMIL',
    registro_ans: '326305',
    versao_tiss: '4.03.00',
    tamanho_matricula: 9,
    dias_validade_autorizacao: 60,
    codigo_prestador: 'ELMAN-326305',
    ativo: true,
  },
  {
    id: 'op-porto',
    nome: 'PORTO SEGURO',
    registro_ans: '000582',
    versao_tiss: '4.01.00',
    tamanho_matricula: 12,
    dias_validade_autorizacao: 60,
    codigo_prestador: 'ELMAN-000582',
    ativo: true,
  },
];

const SEED_PLANOS: PlanoSaudeRecord[] = [
  { id: 'pl-bradesco-top', operadora_id: 'op-bradesco', nome_plano: 'Top Nacional', acomodacao: 'Apartamento', ativo: true },
  { id: 'pl-bradesco-efetivo', operadora_id: 'op-bradesco', nome_plano: 'Efetivo / Flex', acomodacao: 'Enfermaria', ativo: true },
  { id: 'pl-sulamerica-esp', operadora_id: 'op-sulamerica', nome_plano: 'Especial 100', acomodacao: 'Apartamento', ativo: true },
  { id: 'pl-unimed-flex', operadora_id: 'op-unimed', nome_plano: 'Unimed Flex', acomodacao: 'Apartamento', ativo: true },
  { id: 'pl-unimed-nac', operadora_id: 'op-unimed', nome_plano: 'Plano Padrão / Nacional', acomodacao: 'Enfermaria', ativo: true },
  { id: 'pl-cassi-assoc', operadora_id: 'op-cassi', nome_plano: 'CASSI Associados', acomodacao: 'Apartamento', ativo: true },
  { id: 'pl-amil-s450', operadora_id: 'op-amil', nome_plano: 'Amil S450', acomodacao: 'Apartamento', ativo: true },
  { id: 'pl-porto-ouro', operadora_id: 'op-porto', nome_plano: 'Porto Ouro', acomodacao: 'Apartamento', ativo: true },
];

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('YOUR_SUPABASE_URL'));
}

function isMissingTableError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST200' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('failed to fetch')
  );
}

export function getLocalOperadoras(): OperadoraRecord[] {
  try {
    const raw = localStorage.getItem(LS_OPERADORAS_KEY);
    if (!raw) {
      localStorage.setItem(LS_OPERADORAS_KEY, JSON.stringify(SEED_OPERADORAS));
      return SEED_OPERADORAS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_OPERADORAS;
  }
}

export function getLocalPlanos(): PlanoSaudeRecord[] {
  try {
    const raw = localStorage.getItem(LS_PLANOS_KEY);
    if (!raw) {
      localStorage.setItem(LS_PLANOS_KEY, JSON.stringify(SEED_PLANOS));
      return SEED_PLANOS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PLANOS;
  }
}

function saveLocalOperadoras(lista: OperadoraRecord[]) {
  localStorage.setItem(LS_OPERADORAS_KEY, JSON.stringify(lista));
}

function saveLocalPlanos(lista: PlanoSaudeRecord[]) {
  localStorage.setItem(LS_PLANOS_KEY, JSON.stringify(lista));
}

function montarOperadorasComPlanosLocal(): OperadoraRecord[] {
  const operadoras = getLocalOperadoras();
  const planos = getLocalPlanos();
  return operadoras
    .map(op => ({
      ...op,
      planos: planos.filter(p => p.operadora_id === op.id),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Lista todas as Operadoras com seus respectivos Planos de Saúde aninhados (JOIN 1:N)
 */
export async function listarOperadorasComPlanos(): Promise<{
  data: OperadoraRecord[];
  fonte: 'supabase' | 'local';
  error: string | null;
}> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('operadoras')
        .select('*, planos:planos_saude(*)')
        .order('nome', { ascending: true });

      if (!error && data) {
        return {
          data: data as OperadoraRecord[],
          fonte: 'supabase',
          error: null,
        };
      }

      if (error && !isMissingTableError(error)) {
        return {
          data: montarOperadorasComPlanosLocal(),
          fonte: 'local',
          error: error.message,
        };
      }
    } catch {
      // Fallback silencioso para local se sem rede
    }
  }

  return {
    data: montarOperadorasComPlanosLocal(),
    fonte: 'local',
    error: null,
  };
}

/**
 * Cadastra uma nova Operadora com sua Versão TISS pré-definida e opcionalmente cria um Plano inicial
 */
export async function criarOperadora(payload: CreateOperadoraDTO): Promise<{
  data: OperadoraRecord | null;
  planoCriado: PlanoSaudeRecord | null;
  error: string | null;
}> {
  const nomeFormatado = payload.nome.trim().toUpperCase();
  const nomePlanoInicial = (payload.plano_inicial_nome || 'Plano Padrão / Nacional').trim();
  const acomodacaoInicial = payload.plano_inicial_acomodacao || 'Apartamento';

  if (isSupabaseConfigured()) {
    try {
      const { data: opData, error: opError } = await supabase
        .from('operadoras')
        .insert({
          nome: nomeFormatado,
          registro_ans: payload.registro_ans?.trim() || null,
          versao_tiss: payload.versao_tiss,
          tamanho_matricula: payload.tamanho_matricula ?? null,
          dias_validade_autorizacao: payload.dias_validade_autorizacao ?? 60,
          codigo_prestador: payload.codigo_prestador?.trim() || null,
          ativo: payload.ativo ?? true,
        })
        .select('*')
        .single();

      if (!opError && opData) {
        let planoCriado: PlanoSaudeRecord | null = null;
        if (nomePlanoInicial) {
          const { data: plData } = await supabase
            .from('planos_saude')
            .insert({
              operadora_id: opData.id,
              nome_plano: nomePlanoInicial,
              acomodacao: acomodacaoInicial,
              ativo: true,
            })
            .select('*')
            .single();
          planoCriado = (plData as PlanoSaudeRecord) || null;
        }
        return {
          data: { ...(opData as OperadoraRecord), planos: planoCriado ? [planoCriado] : [] },
          planoCriado,
          error: null,
        };
      }

      if (opError && !isMissingTableError(opError)) {
        if (opError.code === '23505') {
          return { data: null, planoCriado: null, error: 'Já existe uma operadora cadastrada com este nome.' };
        }
        return { data: null, planoCriado: null, error: opError.message };
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        return { data: null, planoCriado: null, error: e?.message || 'Erro ao salvar operadora.' };
      }
    }
  }

  // Fallback Local
  const operadoras = getLocalOperadoras();
  if (operadoras.some(o => o.nome.toUpperCase() === nomeFormatado)) {
    return { data: null, planoCriado: null, error: 'Já existe uma operadora cadastrada com este nome.' };
  }

  const novaOp: OperadoraRecord = {
    id: crypto.randomUUID(),
    nome: nomeFormatado,
    registro_ans: payload.registro_ans?.trim() || null,
    versao_tiss: payload.versao_tiss,
    tamanho_matricula: payload.tamanho_matricula ?? null,
    dias_validade_autorizacao: payload.dias_validade_autorizacao ?? 60,
    codigo_prestador: payload.codigo_prestador?.trim() || null,
    ativo: payload.ativo ?? true,
    created_at: new Date().toISOString(),
  };

  saveLocalOperadoras([...operadoras, novaOp]);

  let novoPlano: PlanoSaudeRecord | null = null;
  if (nomePlanoInicial) {
    const planos = getLocalPlanos();
    novoPlano = {
      id: crypto.randomUUID(),
      operadora_id: novaOp.id,
      nome_plano: nomePlanoInicial,
      acomodacao: acomodacaoInicial,
      ativo: true,
      created_at: new Date().toISOString(),
    };
    saveLocalPlanos([...planos, novoPlano]);
  }

  return {
    data: { ...novaOp, planos: novoPlano ? [novoPlano] : [] },
    planoCriado: novoPlano,
    error: null,
  };
}

/**
 * Atualiza os dados pré-definidos de uma Operadora (ex: atualizar Versão TISS ou Tamanho da Matrícula)
 */
export async function atualizarOperadora(
  id: string,
  payload: Partial<CreateOperadoraDTO>
): Promise<{ data: OperadoraRecord | null; error: string | null }> {
  if (isSupabaseConfigured()) {
    try {
      const updateObj: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.nome !== undefined) updateObj.nome = payload.nome.trim().toUpperCase();
      if (payload.registro_ans !== undefined) updateObj.registro_ans = payload.registro_ans?.trim() || null;
      if (payload.versao_tiss !== undefined) updateObj.versao_tiss = payload.versao_tiss;
      if (payload.tamanho_matricula !== undefined) updateObj.tamanho_matricula = payload.tamanho_matricula;
      if (payload.dias_validade_autorizacao !== undefined) {
        updateObj.dias_validade_autorizacao = payload.dias_validade_autorizacao;
      }
      if (payload.codigo_prestador !== undefined) {
        updateObj.codigo_prestador = payload.codigo_prestador?.trim() || null;
      }
      if (payload.ativo !== undefined) updateObj.ativo = payload.ativo;

      const { data, error } = await supabase
        .from('operadoras')
        .update(updateObj)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        return { data: data as OperadoraRecord, error: null };
      }
      if (error && !isMissingTableError(error)) {
        return { data: null, error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const operadoras = getLocalOperadoras();
  const idx = operadoras.findIndex(o => o.id === id);
  if (idx === -1) return { data: null, error: 'Operadora não encontrada.' };

  const atualizada: OperadoraRecord = {
    ...operadoras[idx],
    nome: payload.nome ? payload.nome.trim().toUpperCase() : operadoras[idx].nome,
    registro_ans: payload.registro_ans !== undefined ? payload.registro_ans?.trim() || null : operadoras[idx].registro_ans,
    versao_tiss: payload.versao_tiss ?? operadoras[idx].versao_tiss,
    tamanho_matricula:
      payload.tamanho_matricula !== undefined ? payload.tamanho_matricula : operadoras[idx].tamanho_matricula,
    dias_validade_autorizacao:
      payload.dias_validade_autorizacao ?? operadoras[idx].dias_validade_autorizacao,
    codigo_prestador:
      payload.codigo_prestador !== undefined ? payload.codigo_prestador?.trim() || null : operadoras[idx].codigo_prestador,
    ativo: payload.ativo ?? operadoras[idx].ativo,
    updated_at: new Date().toISOString(),
  };

  const novaLista = [...operadoras];
  novaLista[idx] = atualizada;
  saveLocalOperadoras(novaLista);
  return { data: atualizada, error: null };
}

/**
 * Adiciona um novo Plano de Saúde vinculado a uma Operadora existente
 */
export async function criarPlanoSaude(payload: CreatePlanoSaudeDTO): Promise<{
  data: PlanoSaudeRecord | null;
  error: string | null;
}> {
  const nomePlano = payload.nome_plano.trim();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('planos_saude')
        .insert({
          operadora_id: payload.operadora_id,
          nome_plano: nomePlano,
          acomodacao: payload.acomodacao || 'Ambulatorial',
          ativo: payload.ativo ?? true,
        })
        .select('*')
        .single();

      if (!error && data) {
        return { data: data as PlanoSaudeRecord, error: null };
      }
      if (error && !isMissingTableError(error)) {
        if (error.code === '23505') {
          return { data: null, error: 'Este plano já está cadastrado para a operadora selecionada.' };
        }
        return { data: null, error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const planos = getLocalPlanos();
  if (
    planos.some(
      p => p.operadora_id === payload.operadora_id && p.nome_plano.toLowerCase() === nomePlano.toLowerCase()
    )
  ) {
    return { data: null, error: 'Este plano já está cadastrado para a operadora selecionada.' };
  }

  const novoPlano: PlanoSaudeRecord = {
    id: crypto.randomUUID(),
    operadora_id: payload.operadora_id,
    nome_plano: nomePlano,
    acomodacao: payload.acomodacao || 'Ambulatorial',
    ativo: true,
    created_at: new Date().toISOString(),
  };

  saveLocalPlanos([...planos, novoPlano]);
  return { data: novoPlano, error: null };
}

