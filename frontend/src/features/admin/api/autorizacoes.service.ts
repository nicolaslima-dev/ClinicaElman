import { supabase } from '@/services/supabase';
import type {
  AutorizacaoRecord,
  CreateAutorizacaoDTO,
  CreateTerapeutaDTO,
  EmitirGuiaSpSadtDTO,
  GuiaTissRecord,
  GuiaTissSessaoRecord,
  ProcedimentoTussRecord,
  TerapeutaRecord,
} from '../types';
import { listarPacientes } from './pacientes.service';

const LS_TERAPEUTAS_KEY = 'clinica_elman_terapeutas_v1';
const LS_PROCEDIMENTOS_KEY = 'clinica_elman_procedimentos_tuss_v1';
const LS_AUTORIZACOES_KEY = 'clinica_elman_autorizacoes_v1';
const LS_GUIAS_TISS_KEY = 'clinica_elman_guias_tiss_v1';
const LS_GUIAS_SESSOES_KEY = 'clinica_elman_guias_sessoes_v1';

const SEED_TERAPEUTAS: TerapeutaRecord[] = [
  {
    id: 'ter-luciana-silva',
    nome: 'Dra. Luciana Silva',
    email: 'luciana.silva@clinicaelman.com.br',
    conselho: 'CRP',
    numero_conselho: '05/68412',
    uf_conselho: 'RJ',
    cbo: '251510',
    especialidade: 'Psicologia / Terapia ABA',
    ativo: true,
  },
  {
    id: 'ter-carlos-mendes',
    nome: 'Dr. Carlos Mendes',
    email: 'carlos.mendes@clinicaelman.com.br',
    conselho: 'CREFITO',
    numero_conselho: '2/149820-F',
    uf_conselho: 'RJ',
    cbo: '223605',
    especialidade: 'Fisioterapia Neurofuncional',
    ativo: true,
  },
  {
    id: 'ter-fernanda-rocha',
    nome: 'Dra. Fernanda Rocha',
    email: 'fernanda.rocha@clinicaelman.com.br',
    conselho: 'CRFa',
    numero_conselho: '1-14892',
    uf_conselho: 'RJ',
    cbo: '223810',
    especialidade: 'Fonoaudiologia Infantil',
    ativo: true,
  },
  {
    id: 'ter-roberto-almeida',
    nome: 'Dr. Roberto Almeida',
    email: 'roberto.almeida@clinicaelman.com.br',
    conselho: 'CREFITO',
    numero_conselho: '2/088310-TO',
    uf_conselho: 'RJ',
    cbo: '223905',
    especialidade: 'Terapia Ocupacional',
    ativo: true,
  },
];

const SEED_PROCEDIMENTOS_TUSS: ProcedimentoTussRecord[] = [
  {
    codigo_tuss: '50000470',
    descricao: 'Sessão de Psicoterapia / Terapia ABA Individual',
    tabela_dominio: '22',
    conselho_obrigatorio: 'CRP',
    cbo_prefixo: '251510',
    exige_senha: true,
  },
  {
    codigo_tuss: '50000615',
    descricao: 'Sessão de Fonoaudiologia Individual',
    tabela_dominio: '22',
    conselho_obrigatorio: 'CRFa',
    cbo_prefixo: '223810',
    exige_senha: true,
  },
  {
    codigo_tuss: '50000054',
    descricao: 'Sessão de Terapia Ocupacional Individual',
    tabela_dominio: '22',
    conselho_obrigatorio: 'CREFITO',
    cbo_prefixo: '223905',
    exige_senha: true,
  },
  {
    codigo_tuss: '20103471',
    descricao: 'Fisioterapia para Distúrbios Osteomioarticulares',
    tabela_dominio: '22',
    conselho_obrigatorio: 'CREFITO',
    cbo_prefixo: '223605',
    exige_senha: true,
  },
  {
    codigo_tuss: '50000560',
    descricao: 'Atendimento Psicopedagógico / Neuropsicologia',
    tabela_dominio: '22',
    conselho_obrigatorio: 'CRP',
    cbo_prefixo: '251540',
    exige_senha: true,
  },
  {
    codigo_tuss: '10101012',
    descricao: 'Consulta em Consultório (no horário normal)',
    tabela_dominio: '22',
    conselho_obrigatorio: 'CRM',
    cbo_prefixo: '225125',
    exige_senha: false,
  },
];

const SEED_AUTORIZACOES: AutorizacaoRecord[] = [
  {
    id: 'aut-mariana-01',
    paciente_id: 'pac-mariana-costa',
    terapeuta_id: 'ter-carlos-mendes',
    numero_autorizacao: 'AUTH-2026-883921',
    codigo_tuss: '20103471',
    descricao_termo: 'Fisioterapia para Distúrbios Osteomioarticulares',
    data_inicio: '2026-09-01',
    data_fim: '2026-11-30',
    quantidade_total_sessoes: 30,
    quantidade_sessoes_semanais: 3,
    valor_unitario_sessao: 85.0,
    status: 'ativa',
    observacoes: 'Autorização concedida pelo Bradesco Saúde - Reabilitação motora.',
    created_at: '2026-09-01T10:30:00Z',
  },
  {
    id: 'aut-joao-02',
    paciente_id: 'pac-joao-pedro',
    terapeuta_id: 'ter-luciana-silva',
    numero_autorizacao: 'UNIM-2026-445122',
    codigo_tuss: '50000470',
    descricao_termo: 'Sessão de Psicoterapia / Terapia ABA Individual',
    data_inicio: '2026-09-10',
    data_fim: '2026-12-10',
    quantidade_total_sessoes: 40,
    quantidade_sessoes_semanais: 5,
    valor_unitario_sessao: 120.0,
    status: 'ativa',
    observacoes: 'Terapia ABA seriada - Observar Campo 4 (10/09/2026).',
    created_at: '2026-09-10T09:00:00Z',
  },
  {
    id: 'aut-ana-03',
    paciente_id: 'pac-ana-maria',
    terapeuta_id: 'ter-fernanda-rocha',
    numero_autorizacao: 'CASSI-2026-991044',
    codigo_tuss: '50000615',
    descricao_termo: 'Sessão de Fonoaudiologia Individual',
    data_inicio: '2026-10-01',
    data_fim: '2026-12-30',
    quantidade_total_sessoes: 20,
    quantidade_sessoes_semanais: 2,
    valor_unitario_sessao: 95.0,
    status: 'ativa',
    observacoes: 'Padrão CASSI TISS 3.05.00.',
    created_at: '2026-10-01T14:00:00Z',
  },
];

const SEED_GUIAS: GuiaTissRecord[] = [
  {
    id: 'guia-mariana-001',
    numero_guia_prestador: '2026008839',
    numero_guia_operadora: 'AUTH-2026-883921',
    autorizacao_id: 'aut-mariana-01',
    paciente_id: 'pac-mariana-costa',
    plano_saude_id: 'pl-bradesco-top',
    terapeuta_designado_id: 'ter-carlos-mendes',
    versao_tiss: '4.03.00',
    data_autorizacao_campo4: '2026-09-01',
    data_validade_senha: '2026-11-30',
    numero_senha: 'AUTH-2026-883921',
    codigo_tuss: '20103471',
    descricao_termo: 'Fisioterapia para Distúrbios Osteomioarticulares',
    qtd_sessoes_previstas: 10,
    assinatura_paciente_base64: null,
    nome_assinante: null,
    assinado_em: null,
    status_guia: 'em_preenchimento',
    created_at: '2026-09-01T11:00:00Z',
  },
  {
    id: 'guia-joao-002',
    numero_guia_prestador: '2026004451',
    numero_guia_operadora: 'UNIM-2026-445122',
    autorizacao_id: 'aut-joao-02',
    paciente_id: 'pac-joao-pedro',
    plano_saude_id: 'pl-unimed-flex',
    terapeuta_designado_id: 'ter-luciana-silva',
    versao_tiss: '4.02.00',
    data_autorizacao_campo4: '2026-09-10',
    data_validade_senha: '2026-12-10',
    numero_senha: 'UNIM-2026-445122',
    codigo_tuss: '50000470',
    descricao_termo: 'Sessão de Psicoterapia / Terapia ABA Individual',
    qtd_sessoes_previstas: 10,
    assinatura_paciente_base64: null,
    nome_assinante: null,
    assinado_em: null,
    status_guia: 'enviada_terapeuta',
    created_at: '2026-09-10T09:30:00Z',
  },
];

const SEED_GUIAS_SESSOES: GuiaTissSessaoRecord[] = [
  {
    id: 'ses-001',
    guia_id: 'guia-mariana-001',
    ordem_sessao: 1,
    data_realizacao: '2026-09-02',
    quantidade: 1,
    assinatura_confirmada: true,
  },
  {
    id: 'ses-002',
    guia_id: 'guia-mariana-001',
    ordem_sessao: 2,
    data_realizacao: '2026-09-04',
    quantidade: 1,
    assinatura_confirmada: true,
  },
  {
    id: 'ses-003',
    guia_id: 'guia-mariana-001',
    ordem_sessao: 3,
    data_realizacao: '2026-09-06',
    quantidade: 1,
    assinatura_confirmada: true,
  },
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

export function getLocalTerapeutas(): TerapeutaRecord[] {
  try {
    const raw = localStorage.getItem(LS_TERAPEUTAS_KEY);
    if (!raw) {
      localStorage.setItem(LS_TERAPEUTAS_KEY, JSON.stringify(SEED_TERAPEUTAS));
      return SEED_TERAPEUTAS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_TERAPEUTAS;
  }
}

function saveLocalTerapeutas(lista: TerapeutaRecord[]) {
  localStorage.setItem(LS_TERAPEUTAS_KEY, JSON.stringify(lista));
}

export function getLocalProcedimentosTuss(): ProcedimentoTussRecord[] {
  try {
    const raw = localStorage.getItem(LS_PROCEDIMENTOS_KEY);
    if (!raw) {
      localStorage.setItem(LS_PROCEDIMENTOS_KEY, JSON.stringify(SEED_PROCEDIMENTOS_TUSS));
      return SEED_PROCEDIMENTOS_TUSS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PROCEDIMENTOS_TUSS;
  }
}

function getLocalAutorizacoesRaw(): AutorizacaoRecord[] {
  try {
    const raw = localStorage.getItem(LS_AUTORIZACOES_KEY);
    if (!raw) {
      localStorage.setItem(LS_AUTORIZACOES_KEY, JSON.stringify(SEED_AUTORIZACOES));
      return SEED_AUTORIZACOES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_AUTORIZACOES;
  }
}

function saveLocalAutorizacoes(lista: AutorizacaoRecord[]) {
  localStorage.setItem(LS_AUTORIZACOES_KEY, JSON.stringify(lista));
}

function getLocalGuiasRaw(): GuiaTissRecord[] {
  try {
    const raw = localStorage.getItem(LS_GUIAS_TISS_KEY);
    if (!raw) {
      localStorage.setItem(LS_GUIAS_TISS_KEY, JSON.stringify(SEED_GUIAS));
      return SEED_GUIAS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_GUIAS;
  }
}

function saveLocalGuias(lista: GuiaTissRecord[]) {
  localStorage.setItem(LS_GUIAS_TISS_KEY, JSON.stringify(lista));
}

function getLocalSessoesRaw(): GuiaTissSessaoRecord[] {
  try {
    const raw = localStorage.getItem(LS_GUIAS_SESSOES_KEY);
    if (!raw) {
      localStorage.setItem(LS_GUIAS_SESSOES_KEY, JSON.stringify(SEED_GUIAS_SESSOES));
      return SEED_GUIAS_SESSOES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_GUIAS_SESSOES;
  }
}

function saveLocalSessoes(lista: GuiaTissSessaoRecord[]) {
  localStorage.setItem(LS_GUIAS_SESSOES_KEY, JSON.stringify(lista));
}

// ============================================================================
// TERAPEUTAS E PROCEDIMENTOS TUSS
// ============================================================================

export async function listarTerapeutas(): Promise<{
  data: TerapeutaRecord[];
  fonte: 'supabase' | 'local';
}> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('terapeutas')
        .select('*')
        .order('nome', { ascending: true });

      if (!error && data && data.length > 0) {
        return { data: data as TerapeutaRecord[], fonte: 'supabase' };
      }
    } catch {
      // Fallback local
    }
  }
  return { data: getLocalTerapeutas(), fonte: 'local' };
}

export async function criarTerapeuta(payload: CreateTerapeutaDTO): Promise<{
  data: TerapeutaRecord | null;
  error: string | null;
}> {
  const row = {
    nome: payload.nome.trim(),
    email: payload.email?.trim() || null,
    conselho: payload.conselho.trim().toUpperCase(),
    numero_conselho: payload.numero_conselho.trim(),
    uf_conselho: payload.uf_conselho.trim().toUpperCase(),
    cbo: payload.cbo.trim(),
    especialidade: payload.especialidade.trim(),
    ativo: true,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('terapeutas')
        .insert(row)
        .select('*')
        .single();

      if (!error && data) {
        return { data: data as TerapeutaRecord, error: null };
      }
      if (error && !isMissingTableError(error)) {
        return { data: null, error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const atuais = getLocalTerapeutas();
  const novo: TerapeutaRecord = {
    id: crypto.randomUUID(),
    ...row,
    created_at: new Date().toISOString(),
  };
  saveLocalTerapeutas([...atuais, novo]);
  return { data: novo, error: null };
}

export async function listarProcedimentosTuss(): Promise<{
  data: ProcedimentoTussRecord[];
  fonte: 'supabase' | 'local';
}> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('procedimentos_tuss')
        .select('*')
        .order('codigo_tuss', { ascending: true });

      if (!error && data && data.length > 0) {
        return { data: data as ProcedimentoTussRecord[], fonte: 'supabase' };
      }
    } catch {
      // Fallback local
    }
  }
  return { data: getLocalProcedimentosTuss(), fonte: 'local' };
}

// ============================================================================
// HIDRATAÇÃO LOCAL DE AUTORIZAÇÕES E GUIAS
// ============================================================================

async function hidratarDadosLocais(): Promise<{
  autorizacoes: AutorizacaoRecord[];
  guias: GuiaTissRecord[];
}> {
  const [{ data: pacientes }, terapeutas, autorizacoesRaw, guiasRaw, sessoesRaw] =
    await Promise.all([
      listarPacientes(),
      Promise.resolve(getLocalTerapeutas()),
      Promise.resolve(getLocalAutorizacoesRaw()),
      Promise.resolve(getLocalGuiasRaw()),
      Promise.resolve(getLocalSessoesRaw()),
    ]);

  const guiasHidratadas: GuiaTissRecord[] = guiasRaw.map(g => {
    const paciente = pacientes.find(p => p.id === g.paciente_id);
    const terapeuta_designado = terapeutas.find(t => t.id === g.terapeuta_designado_id);
    const autorizacao = autorizacoesRaw.find(a => a.id === g.autorizacao_id);
    const sessoes = sessoesRaw
      .filter(s => s.guia_id === g.id)
      .sort((a, b) => a.ordem_sessao - b.ordem_sessao);

    return {
      ...g,
      paciente,
      plano: paciente?.plano,
      terapeuta_designado,
      autorizacao,
      sessoes,
    };
  });

  const autorizacoesHidratadas: AutorizacaoRecord[] = autorizacoesRaw.map(aut => {
    const paciente = pacientes.find(p => p.id === aut.paciente_id);
    const terapeuta = terapeutas.find(t => t.id === aut.terapeuta_id);
    const guiasDaAut = guiasHidratadas.filter(g => g.autorizacao_id === aut.id);

    const sessoes_emitidas = guiasDaAut.reduce(
      (acc, g) => acc + Number(g.qtd_sessoes_previstas || 0),
      0
    );
    const sessoes_realizadas = guiasDaAut.reduce(
      (acc, g) => acc + (g.sessoes?.length || 0),
      0
    );
    const saldo_disponivel = Math.max(0, aut.quantidade_total_sessoes - sessoes_emitidas);

    return {
      ...aut,
      paciente,
      terapeuta,
      guias: guiasDaAut,
      sessoes_emitidas,
      sessoes_realizadas,
      saldo_disponivel,
    };
  });

  return {
    autorizacoes: autorizacoesHidratadas.sort((a, b) =>
      (b.created_at || b.data_inicio).localeCompare(a.created_at || a.data_inicio)
    ),
    guias: guiasHidratadas.sort((a, b) =>
      (b.created_at || '').localeCompare(a.created_at || '')
    ),
  };
}

// ============================================================================
// AUTORIZAÇÕES (SENHAS) E GUIAS TISS SP/SADT
// ============================================================================

export async function listarAutorizacoes(): Promise<{
  data: AutorizacaoRecord[];
  fonte: 'supabase' | 'local';
  error: string | null;
}> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('autorizacoes')
        .select(
          `*,
          paciente:pacientes(*, plano:planos_saude(*, operadora:operadoras(*))),
          terapeuta:terapeutas(*),
          guias:guias_tiss(*, sessoes:guias_tiss_sessoes(*))`
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        const enriquecidas: AutorizacaoRecord[] = (data as any[]).map(aut => {
          const guiasDaAut: GuiaTissRecord[] = (aut.guias || []).map((g: any) => ({
            ...g,
            paciente: aut.paciente,
            plano: aut.paciente?.plano,
            terapeuta_designado: aut.terapeuta,
            sessoes: (g.sessoes || []).sort(
              (a: GuiaTissSessaoRecord, b: GuiaTissSessaoRecord) => a.ordem_sessao - b.ordem_sessao
            ),
          }));

          const sessoes_emitidas = guiasDaAut.reduce(
            (acc, g) => acc + Number(g.qtd_sessoes_previstas || 0),
            0
          );
          const sessoes_realizadas = guiasDaAut.reduce(
            (acc, g) => acc + (g.sessoes?.length || 0),
            0
          );
          const saldo_disponivel = Math.max(
            0,
            Number(aut.quantidade_total_sessoes) - sessoes_emitidas
          );

          return {
            ...aut,
            guias: guiasDaAut,
            sessoes_emitidas,
            sessoes_realizadas,
            saldo_disponivel,
          };
        });

        return { data: enriquecidas, fonte: 'supabase', error: null };
      }

      if (error && !isMissingTableError(error)) {
        const { autorizacoes } = await hidratarDadosLocais();
        return { data: autorizacoes, fonte: 'local', error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const { autorizacoes } = await hidratarDadosLocais();
  return { data: autorizacoes, fonte: 'local', error: null };
}

export async function listarGuiasTiss(): Promise<{
  data: GuiaTissRecord[];
  fonte: 'supabase' | 'local';
  error: string | null;
}> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('guias_tiss')
        .select(
          `*,
          paciente:pacientes(*, plano:planos_saude(*, operadora:operadoras(*))),
          terapeuta_designado:terapeutas(*),
          autorizacao:autorizacoes(*),
          sessoes:guias_tiss_sessoes(*)`
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatadas: GuiaTissRecord[] = (data as any[]).map(g => ({
          ...g,
          plano: g.paciente?.plano,
          sessoes: (g.sessoes || []).sort(
            (a: GuiaTissSessaoRecord, b: GuiaTissSessaoRecord) => a.ordem_sessao - b.ordem_sessao
          ),
        }));
        return { data: formatadas, fonte: 'supabase', error: null };
      }

      if (error && !isMissingTableError(error)) {
        const { guias } = await hidratarDadosLocais();
        return { data: guias, fonte: 'local', error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const { guias } = await hidratarDadosLocais();
  return { data: guias, fonte: 'local', error: null };
}

function gerarNumeroGuiaPrestador(): string {
  const ano = new Date().getFullYear();
  const sufixo = Math.floor(100000 + Math.random() * 900000);
  return `${ano}${sufixo}`;
}

/**
 * Cadastra uma nova Autorização (Senha do Plano) e opcionalmente já emite a 1ª Guia TISS SP/SADT para o Terapeuta
 */
export async function criarAutorizacao(payload: CreateAutorizacaoDTO): Promise<{
  data: AutorizacaoRecord | null;
  guiaEmitida: GuiaTissRecord | null;
  error: string | null;
}> {
  const numAut = payload.numero_autorizacao.trim().toUpperCase();

  if (payload.data_fim < payload.data_inicio) {
    return {
      data: null,
      guiaEmitida: null,
      error: 'A Data Fim da autorização não pode ser anterior à Data Início (Campo 4).',
    };
  }

  const rowToInsert = {
    paciente_id: payload.paciente_id,
    terapeuta_id: payload.terapeuta_id,
    numero_autorizacao: numAut,
    codigo_tuss: payload.codigo_tuss.trim(),
    descricao_termo: payload.descricao_termo.trim(),
    data_inicio: payload.data_inicio,
    data_fim: payload.data_fim,
    quantidade_total_sessoes: Number(payload.quantidade_total_sessoes),
    quantidade_sessoes_semanais: Number(payload.quantidade_sessoes_semanais),
    valor_unitario_sessao: Number(payload.valor_unitario_sessao || 0),
    status: 'ativa' as const,
    observacoes: payload.observacoes?.trim() || null,
  };

  let autorizacaoCriadaId: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('autorizacoes')
        .insert(rowToInsert)
        .select('*')
        .single();

      if (!error && data) {
        autorizacaoCriadaId = data.id;
      } else if (error && !isMissingTableError(error)) {
        if (error.code === '23505') {
          return {
            data: null,
            guiaEmitida: null,
            error: 'Já existe uma autorização cadastrada com este Número / Senha.',
          };
        }
        return { data: null, guiaEmitida: null, error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  if (!autorizacaoCriadaId) {
    const atuais = getLocalAutorizacoesRaw();
    if (atuais.some(a => a.numero_autorizacao.toUpperCase() === numAut)) {
      return {
        data: null,
        guiaEmitida: null,
        error: 'Já existe uma autorização cadastrada com este Número / Senha.',
      };
    }

    const novaAut: AutorizacaoRecord = {
      id: crypto.randomUUID(),
      ...rowToInsert,
      created_at: new Date().toISOString(),
    };
    saveLocalAutorizacoes([novaAut, ...atuais]);
    autorizacaoCriadaId = novaAut.id;
  }

  let guiaEmitida: GuiaTissRecord | null = null;
  if (payload.emitir_primeira_guia) {
    const qtdGuia = Math.min(
      10,
      Math.max(1, Number(payload.qtd_sessoes_primeira_guia || payload.quantidade_total_sessoes || 10))
    );
    const resGuia = await emitirGuiaSpSadt({
      autorizacao_id: autorizacaoCriadaId,
      qtd_sessoes_previstas: qtdGuia,
      numero_guia_operadora: numAut,
    });
    guiaEmitida = resGuia.data;
  }

  const { data: todas } = await listarAutorizacoes();
  const encontrada = todas.find(a => a.id === autorizacaoCriadaId) || null;
  return { data: encontrada, guiaEmitida, error: null };
}

/**
 * Emite uma Guia TISS SP/SADT a partir de uma Autorização ativa:
 * - Preenche automaticamente o Campo 4 (Data da Autorização = data_inicio da senha)
 * - Herda a Versão TISS da Operadora do paciente
 * - Preenche o Termo Autorizado e o Terapeuta Designado
 * - Envia a guia para a fila do Terapeuta
 */
export async function emitirGuiaSpSadt(payload: EmitirGuiaSpSadtDTO): Promise<{
  data: GuiaTissRecord | null;
  error: string | null;
}> {
  const { data: autorizacoes } = await listarAutorizacoes();
  const aut = autorizacoes.find(a => a.id === payload.autorizacao_id);

  if (!aut) {
    return { data: null, error: 'Autorização não localizada.' };
  }

  const saldoDisponivel = aut.saldo_disponivel ?? aut.quantidade_total_sessoes;
  const qtdSolicitada = Number(payload.qtd_sessoes_previstas);

  if (qtdSolicitada < 1 || qtdSolicitada > 10) {
    return {
      data: null,
      error: 'Cada Guia TISS SP/SADT deve conter entre 1 e no máximo 10 sessões.',
    };
  }

  if (qtdSolicitada > saldoDisponivel) {
    return {
      data: null,
      error: `Saldo insuficiente na autorização: restam ${saldoDisponivel} sessão(ões) disponíveis.`,
    };
  }

  const paciente = aut.paciente;
  const planoSaudeId = paciente?.plano_saude_id || '';
  const versaoTiss = paciente?.plano?.operadora?.versao_tiss || '4.03.00';
  const numeroGuiaPrestador = gerarNumeroGuiaPrestador();

  const rowGuia = {
    numero_guia_prestador: numeroGuiaPrestador,
    numero_guia_operadora: payload.numero_guia_operadora?.trim() || aut.numero_autorizacao,
    autorizacao_id: aut.id,
    paciente_id: aut.paciente_id,
    plano_saude_id: planoSaudeId,
    terapeuta_designado_id: aut.terapeuta_id,
    versao_tiss: versaoTiss,
    data_autorizacao_campo4: aut.data_inicio, // Campo 4 = Data Início da senha!
    data_validade_senha: aut.data_fim,
    numero_senha: aut.numero_autorizacao,
    codigo_tuss: aut.codigo_tuss,
    descricao_termo: aut.descricao_termo,
    qtd_sessoes_previstas: qtdSolicitada,
    status_guia: 'enviada_terapeuta' as const,
  };

  let guiaCriadaId: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('guias_tiss')
        .insert(rowGuia)
        .select('*')
        .single();

      if (!error && data) {
        guiaCriadaId = data.id;
      } else if (error && !isMissingTableError(error)) {
        return { data: null, error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  if (!guiaCriadaId) {
    const atuais = getLocalGuiasRaw();
    const novaGuia: GuiaTissRecord = {
      id: crypto.randomUUID(),
      ...rowGuia,
      assinatura_paciente_base64: null,
      nome_assinante: null,
      assinado_em: null,
      created_at: new Date().toISOString(),
    };
    saveLocalGuias([novaGuia, ...atuais]);
    guiaCriadaId = novaGuia.id;
  }

  const { data: todasGuias } = await listarGuiasTiss();
  const guiaCompleta = todasGuias.find(g => g.id === guiaCriadaId) || null;
  return { data: guiaCompleta, error: null };
}

/**
 * Salva as datas de realização preenchidas pelo Terapeuta na Guia TISS,
 * garantindo obediência ao Campo 4 (Data Início), Data Fim e teto de 10 datas
 */
export async function salvarSessoesGuiaTerapeuta(
  guiaId: string,
  datasRealizadas: string[]
): Promise<{
  data: GuiaTissRecord | null;
  error: string | null;
}> {
  const { data: todasGuias } = await listarGuiasTiss();
  const guia = todasGuias.find(g => g.id === guiaId);

  if (!guia) {
    return { data: null, error: 'Guia TISS não encontrada.' };
  }

  const datasOrdenadas = [...datasRealizadas].sort();
  if (datasOrdenadas.length > 10 || datasOrdenadas.length > guia.qtd_sessoes_previstas) {
    return {
      data: null,
      error: `A guia permite no máximo ${Math.min(10, guia.qtd_sessoes_previstas)} datas de realização.`,
    };
  }

  const campo4 = guia.data_autorizacao_campo4.split('T')[0];
  const validade = guia.data_validade_senha.split('T')[0];

  for (const dt of datasOrdenadas) {
    if (dt < campo4) {
      return {
        data: null,
        error: `A data ${dt} é anterior ao Campo "4 – Data da Autorização" (${campo4}).`,
      };
    }
    if (validade && dt > validade) {
      return {
        data: null,
        error: `A data ${dt} ultrapassa a validade da senha (${validade}).`,
      };
    }
  }

  const novoStatus =
    guia.status_guia === 'enviada_faturamento'
      ? 'enviada_faturamento'
      : datasOrdenadas.length > 0
      ? 'em_preenchimento'
      : 'enviada_terapeuta';

  if (isSupabaseConfigured()) {
    try {
      const { error: delError } = await supabase
        .from('guias_tiss_sessoes')
        .delete()
        .eq('guia_id', guiaId);

      if (!delError) {
        if (datasOrdenadas.length > 0) {
          const rows = datasOrdenadas.map((dt, idx) => ({
            guia_id: guiaId,
            ordem_sessao: idx + 1,
            data_realizacao: dt,
            quantidade: 1,
            assinatura_confirmada: true,
          }));
          const { error: insError } = await supabase.from('guias_tiss_sessoes').insert(rows);
          if (insError) return { data: null, error: insError.message };
        }

        await supabase
          .from('guias_tiss')
          .update({ status_guia: novoStatus, updated_at: new Date().toISOString() })
          .eq('id', guiaId);

        const { data: atualizadas } = await listarGuiasTiss();
        return { data: atualizadas.find(g => g.id === guiaId) || null, error: null };
      }
    } catch {
      // Fallback local
    }
  }

  // Fallback Local
  const sessoesOutrasGuias = getLocalSessoesRaw().filter(s => s.guia_id !== guiaId);
  const novasSessoes: GuiaTissSessaoRecord[] = datasOrdenadas.map((dt, idx) => ({
    id: crypto.randomUUID(),
    guia_id: guiaId,
    ordem_sessao: idx + 1,
    data_realizacao: dt,
    quantidade: 1,
    assinatura_confirmada: true,
    created_at: new Date().toISOString(),
  }));
  saveLocalSessoes([...sessoesOutrasGuias, ...novasSessoes]);

  const guiasLocais = getLocalGuiasRaw().map(g =>
    g.id === guiaId
      ? { ...g, status_guia: novoStatus as any, updated_at: new Date().toISOString() }
      : g
  );
  saveLocalGuias(guiasLocais);

  const { data: atualizadas } = await listarGuiasTiss();
  return { data: atualizadas.find(g => g.id === guiaId) || null, error: null };
}

/**
 * Grava a assinatura do Paciente ou Responsável Legal na Guia TISS
 */
export async function salvarAssinaturaGuia(
  guiaId: string,
  assinaturaBase64: string,
  nomeAssinante: string
): Promise<{
  data: GuiaTissRecord | null;
  error: string | null;
}> {
  const agora = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('guias_tiss')
        .update({
          assinatura_paciente_base64: assinaturaBase64,
          nome_assinante: nomeAssinante.trim(),
          assinado_em: agora,
          updated_at: agora,
        })
        .eq('id', guiaId);

      if (!error) {
        const { data: atualizadas } = await listarGuiasTiss();
        return { data: atualizadas.find(g => g.id === guiaId) || null, error: null };
      }
    } catch {
      // Fallback local
    }
  }

  const guiasLocais = getLocalGuiasRaw().map(g =>
    g.id === guiaId
      ? {
          ...g,
          assinatura_paciente_base64: assinaturaBase64,
          nome_assinante: nomeAssinante.trim(),
          assinado_em: agora,
          updated_at: agora,
        }
      : g
  );
  saveLocalGuias(guiasLocais);

  const { data: atualizadas } = await listarGuiasTiss();
  return { data: atualizadas.find(g => g.id === guiaId) || null, error: null };
}

/**
 * Finaliza a etapa do Terapeuta e envia a Guia preenchida + assinada para o setor de Faturamento da Clínica Elman
 */
export async function enviarGuiaParaFaturamento(guiaId: string): Promise<{
  data: GuiaTissRecord | null;
  error: string | null;
}> {
  const { data: todasGuias } = await listarGuiasTiss();
  const guia = todasGuias.find(g => g.id === guiaId);

  if (!guia) {
    return { data: null, error: 'Guia não encontrada.' };
  }

  const sessoes = guia.sessoes || [];
  if (sessoes.length === 0) {
    return {
      data: null,
      error: 'Preencha ao menos 1 data de realização de sessão antes de enviar para o faturamento.',
    };
  }

  if (!guia.assinatura_paciente_base64) {
    return {
      data: null,
      error: 'É obrigatório coletar a assinatura do paciente ou responsável legal antes de enviar para o faturamento.',
    };
  }

  const agora = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('guias_tiss')
        .update({
          status_guia: 'enviada_faturamento',
          enviada_faturamento_em: agora,
          updated_at: agora,
        })
        .eq('id', guiaId);

      if (!error) {
        const { data: atualizadas } = await listarGuiasTiss();
        return { data: atualizadas.find(g => g.id === guiaId) || null, error: null };
      }
    } catch {
      // Fallback local
    }
  }

  const guiasLocais = getLocalGuiasRaw().map(g =>
    g.id === guiaId
      ? {
          ...g,
          status_guia: 'enviada_faturamento' as const,
          enviada_faturamento_em: agora,
          updated_at: agora,
        }
      : g
  );
  saveLocalGuias(guiasLocais);

  const { data: atualizadas } = await listarGuiasTiss();
  return { data: atualizadas.find(g => g.id === guiaId) || null, error: null };
}

