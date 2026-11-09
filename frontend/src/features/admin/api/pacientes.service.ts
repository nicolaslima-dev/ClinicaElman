import { supabase } from '@/services/supabase';
import type { CreatePacienteDTO, PacienteRecord } from '../types';
import { getLocalOperadoras, getLocalPlanos } from './convenios.service';
import { formatarCEP, formatarCPF } from '../utils/pacienteValidators';

const LS_PACIENTES_KEY = 'clinica_elman_pacientes_v1';

const SEED_PACIENTES: PacienteRecord[] = [
  {
    id: 'pac-mariana-costa',
    nome: 'Mariana Costa e Silva',
    data_nascimento: '1991-04-18',
    cpf: '123.456.789-09',
    cep: '22640-100',
    logradouro: 'Av. das Américas',
    numero: '3500',
    complemento: 'Bloco 2 Sala 405',
    bairro: 'Barra da Tijuca',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    plano_saude_id: 'pl-bradesco-top',
    carteira_plano: '738992102345019',
    validade_carteira: '2027-12-31',
    ativo: true,
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'pac-joao-pedro',
    nome: 'João Pedro Alves',
    data_nascimento: '2016-08-12',
    cpf: '529.982.247-25',
    cep: '22041-001',
    logradouro: 'Rua Figueiredo de Magalhães',
    numero: '412',
    complemento: 'Apto 802',
    bairro: 'Copacabana',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    plano_saude_id: 'pl-unimed-flex',
    carteira_plano: '00349988112233445',
    validade_carteira: '2027-06-30',
    ativo: true,
    created_at: '2026-09-02T11:20:00Z',
  },
  {
    id: 'pac-ana-maria',
    nome: 'Ana Maria da Silva',
    data_nascimento: '1984-11-05',
    cpf: '111.444.777-35',
    cep: '20541-050',
    logradouro: 'Rua Conde de Bonfim',
    numero: '290',
    complemento: null,
    bairro: 'Tijuca',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    plano_saude_id: 'pl-cassi-assoc',
    carteira_plano: '00012345678901',
    validade_carteira: '2027-10-15',
    ativo: true,
    created_at: '2026-09-05T14:15:00Z',
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

function getLocalPacientesRaw(): PacienteRecord[] {
  try {
    const raw = localStorage.getItem(LS_PACIENTES_KEY);
    if (!raw) {
      localStorage.setItem(LS_PACIENTES_KEY, JSON.stringify(SEED_PACIENTES));
      return SEED_PACIENTES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PACIENTES;
  }
}

function saveLocalPacientes(lista: PacienteRecord[]) {
  localStorage.setItem(LS_PACIENTES_KEY, JSON.stringify(lista));
}

function hidratarRelacionamentosLocais(pacientes: PacienteRecord[]): PacienteRecord[] {
  const operadoras = getLocalOperadoras();
  const planos = getLocalPlanos();

  return pacientes
    .map(pac => {
      const plano = planos.find(pl => pl.id === pac.plano_saude_id);
      const operadora = plano ? operadoras.find(op => op.id === plano.operadora_id) : undefined;
      return {
        ...pac,
        plano: plano ? { ...plano, operadora } : undefined,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Lista todos os pacientes com JOIN relacional em planos_saude e operadoras
 */
export async function listarPacientes(): Promise<{
  data: PacienteRecord[];
  fonte: 'supabase' | 'local';
  error: string | null;
}> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*, plano:planos_saude(*, operadora:operadoras(*))')
        .order('nome', { ascending: true });

      if (!error && data) {
        return {
          data: data as PacienteRecord[],
          fonte: 'supabase',
          error: null,
        };
      }

      if (error && !isMissingTableError(error)) {
        return {
          data: hidratarRelacionamentosLocais(getLocalPacientesRaw()),
          fonte: 'local',
          error: error.message,
        };
      }
    } catch {
      // Fallback local
    }
  }

  return {
    data: hidratarRelacionamentosLocais(getLocalPacientesRaw()),
    fonte: 'local',
    error: null,
  };
}

/**
 * Cadastra novo paciente normalizado (referenciando plano_saude_id)
 */
export async function criarPaciente(payload: CreatePacienteDTO): Promise<{
  data: PacienteRecord | null;
  error: string | null;
}> {
  const cpfFormatado = formatarCPF(payload.cpf);
  const cepFormatado = formatarCEP(payload.cep);

  const rowToInsert = {
    nome: payload.nome.trim(),
    data_nascimento: payload.data_nascimento,
    cpf: cpfFormatado,
    cep: cepFormatado,
    logradouro: payload.logradouro.trim(),
    numero: payload.numero.trim(),
    complemento: payload.complemento?.trim() || null,
    bairro: payload.bairro.trim(),
    cidade: payload.cidade.trim(),
    uf: payload.uf.trim().toUpperCase(),
    plano_saude_id: payload.plano_saude_id,
    carteira_plano: payload.carteira_plano.trim(),
    validade_carteira: payload.validade_carteira || null,
    ativo: payload.ativo ?? true,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert(rowToInsert)
        .select('*, plano:planos_saude(*, operadora:operadoras(*))')
        .single();

      if (!error && data) {
        return { data: data as PacienteRecord, error: null };
      }

      if (error && !isMissingTableError(error)) {
        if (error.code === '23505') {
          return { data: null, error: 'Já existe um paciente cadastrado com este CPF.' };
        }
        return { data: null, error: error.message };
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        return { data: null, error: e?.message || 'Erro ao cadastrar paciente.' };
      }
    }
  }

  // Fallback Local
  const atuais = getLocalPacientesRaw();
  if (atuais.some(p => formatarCPF(p.cpf) === cpfFormatado)) {
    return { data: null, error: 'Já existe um paciente cadastrado com este CPF.' };
  }

  const novo: PacienteRecord = {
    id: crypto.randomUUID(),
    ...rowToInsert,
    created_at: new Date().toISOString(),
  };

  const novaLista = [...atuais, novo];
  saveLocalPacientes(novaLista);
  const [hidratado] = hidratarRelacionamentosLocais([novo]);
  return { data: hidratado, error: null };
}

/**
 * Atualiza cadastro de paciente existente
 */
export async function atualizarPaciente(
  id: string,
  payload: Partial<CreatePacienteDTO>
): Promise<{
  data: PacienteRecord | null;
  error: string | null;
}> {
  const updateObj: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.nome !== undefined) updateObj.nome = payload.nome.trim();
  if (payload.data_nascimento !== undefined) updateObj.data_nascimento = payload.data_nascimento;
  if (payload.cpf !== undefined) updateObj.cpf = formatarCPF(payload.cpf);
  if (payload.cep !== undefined) updateObj.cep = formatarCEP(payload.cep);
  if (payload.logradouro !== undefined) updateObj.logradouro = payload.logradouro.trim();
  if (payload.numero !== undefined) updateObj.numero = payload.numero.trim();
  if (payload.complemento !== undefined) updateObj.complemento = payload.complemento?.trim() || null;
  if (payload.bairro !== undefined) updateObj.bairro = payload.bairro.trim();
  if (payload.cidade !== undefined) updateObj.cidade = payload.cidade.trim();
  if (payload.uf !== undefined) updateObj.uf = payload.uf.trim().toUpperCase();
  if (payload.plano_saude_id !== undefined) updateObj.plano_saude_id = payload.plano_saude_id;
  if (payload.carteira_plano !== undefined) updateObj.carteira_plano = payload.carteira_plano.trim();
  if (payload.validade_carteira !== undefined) updateObj.validade_carteira = payload.validade_carteira || null;
  if (payload.ativo !== undefined) updateObj.ativo = payload.ativo;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .update(updateObj)
        .eq('id', id)
        .select('*, plano:planos_saude(*, operadora:operadoras(*))')
        .single();

      if (!error && data) {
        return { data: data as PacienteRecord, error: null };
      }

      if (error && !isMissingTableError(error)) {
        if (error.code === '23505') {
          return { data: null, error: 'Este CPF já pertence a outro paciente cadastrado.' };
        }
        return { data: null, error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const atuais = getLocalPacientesRaw();
  const idx = atuais.findIndex(p => p.id === id);
  if (idx === -1) return { data: null, error: 'Paciente não encontrado.' };

  if (
    updateObj.cpf &&
    atuais.some(p => p.id !== id && formatarCPF(p.cpf) === updateObj.cpf)
  ) {
    return { data: null, error: 'Este CPF já pertence a outro paciente cadastrado.' };
  }

  const atualizado: PacienteRecord = {
    ...atuais[idx],
    ...updateObj,
  };

  const novaLista = [...atuais];
  novaLista[idx] = atualizado;
  saveLocalPacientes(novaLista);
  const [hidratado] = hidratarRelacionamentosLocais([atualizado]);
  return { data: hidratado, error: null };
}

/**
 * Remove um paciente do cadastro
 */
export async function excluirPaciente(id: string): Promise<{ error: string | null }> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (!error) {
        return { error: null };
      }
      if (!isMissingTableError(error)) {
        return { error: error.message };
      }
    } catch {
      // Fallback local
    }
  }

  const atuais = getLocalPacientesRaw();
  saveLocalPacientes(atuais.filter(p => p.id !== id));
  return { error: null };
}

