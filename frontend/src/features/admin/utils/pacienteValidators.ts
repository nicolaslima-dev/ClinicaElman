export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export function limparDigitos(valor: string): string {
  return (valor || '').replace(/\D/g, '');
}

export function formatarCPF(valor: string): string {
  const digitos = limparDigitos(valor).slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
}

/**
 * Validação algorítmica oficial de CPF (11 dígitos + dígitos verificadores Mod-11)
 */
export function validarCPF(cpf: string): boolean {
  const limpo = limparDigitos(cpf);
  if (limpo.length !== 11) return false;

  // Rejeita sequências repetidas como 000.000.000-00, 111.111.111-11, etc.
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(limpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(limpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(limpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(limpo.charAt(10))) return false;

  return true;
}

export function formatarCEP(valor: string): string {
  const digitos = limparDigitos(valor).slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`;
}

export interface EnderecoViaCepResult {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
}

export async function buscarEnderecoViaCep(cep: string): Promise<EnderecoViaCepResult | null> {
  const cepLimpo = limparDigitos(cep);
  if (cepLimpo.length !== 8) return null;

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data?.erro) return null;

    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
      complemento: data.complemento || '',
    };
  } catch {
    return null;
  }
}

export function calcularIdade(dataNascimento: string): number | null {
  if (!dataNascimento) return null;
  const partes = dataNascimento.split('T')[0].split('-');
  if (partes.length !== 3) return null;

  const nasc = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  if (isNaN(nasc.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

export function formatarDataBr(dataIso?: string | null): string {
  if (!dataIso) return '-';
  const partes = dataIso.split('T')[0].split('-');
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarEnderecoCompleto(p: {
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}): string {
  const comp = p.complemento ? `, ${p.complemento}` : '';
  return `${p.logradouro}, ${p.numero}${comp} - ${p.bairro}, ${p.cidade}/${p.uf} - CEP ${formatarCEP(p.cep)}`;
}

export function validarCarteiraPorOperadora(
  carteira: string,
  tamanhoEsperado?: number | null
): {
  conforme: boolean;
  digitosAtuais: number;
  mensagem: string;
} {
  const alfanum = (carteira || '').replace(/[\s.-]/g, '');
  const digitosAtuais = alfanum.length;

  if (!tamanhoEsperado || tamanhoEsperado <= 0) {
    return {
      conforme: digitosAtuais > 0,
      digitosAtuais,
      mensagem: `${digitosAtuais} caractere(s) informado(s)`,
    };
  }

  if (digitosAtuais === tamanhoEsperado) {
    return {
      conforme: true,
      digitosAtuais,
      mensagem: `Conforme regra da operadora (${tamanhoEsperado} dígitos)`,
    };
  }

  return {
    conforme: false,
    digitosAtuais,
    mensagem: `Atenção: informado ${digitosAtuais} dígito(s), padrão da operadora é ${tamanhoEsperado} dígitos`,
  };
}

/**
 * Soma N dias a uma data YYYY-MM-DD (usado para sugerir Data Fim da autorização com base nos dias padrão da operadora)
 */
export function somarDiasDataIso(dataIso: string, dias: number): string {
  if (!dataIso) return '';
  const partes = dataIso.split('T')[0].split('-');
  if (partes.length !== 3) return '';
  const dt = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  if (isNaN(dt.getTime())) return '';
  dt.setDate(dt.getDate() + dias);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula a chave da semana ISO (YYYY-Sww) para conferência de periodicidade semanal
 */
export function obterChaveSemana(dataIso: string): string {
  const [anoStr, mesStr, diaStr] = dataIso.split('T')[0].split('-');
  const data = new Date(Number(anoStr), Number(mesStr) - 1, Number(diaStr));
  if (isNaN(data.getTime())) return dataIso;

  const temp = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemana = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const numSemana = Math.ceil(((temp.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-Sem.${String(numSemana).padStart(2, '0')}`;
}

/**
 * Valida uma nova data de realização de sessão frente às regras da Guia TISS:
 * - Obediência obrigatória ao Campo "4 - Data da Autorização" (data_inicio) e Validade (data_fim)
 * - Proibição de datas repetidas
 * - Limite máximo de sessões da guia (máx. 10)
 * - Alerta/verificação de periodicidade semanal autorizada
 */
export function validarNovaDataSessaoGuia(params: {
  novaData: string;
  datasExistentes: string[];
  dataAutorizacaoCampo4: string;
  dataValidadeSenha: string;
  limiteSessoesGuia: number;
  limiteSemanal?: number;
}): {
  valido: boolean;
  erro?: string;
  avisoSemanal?: string;
} {
  const {
    novaData,
    datasExistentes,
    dataAutorizacaoCampo4,
    dataValidadeSenha,
    limiteSessoesGuia,
    limiteSemanal,
  } = params;

  if (!novaData) {
    return { valido: false, erro: 'Selecione a data de realização da sessão.' };
  }

  const maxPermitido = Math.min(10, limiteSessoesGuia || 10);
  if (datasExistentes.length >= maxPermitido) {
    return {
      valido: false,
      erro: `Limite atingido: esta guia permite no máximo ${maxPermitido} sessão(ões) (teto TISS de 10 datas por guia).`,
    };
  }

  if (datasExistentes.includes(novaData)) {
    return {
      valido: false,
      erro: `A data ${formatarDataBr(novaData)} já foi lançada nesta guia. Datas repetidas não são permitidas.`,
    };
  }

  const campo4 = dataAutorizacaoCampo4.split('T')[0];
  const validade = dataValidadeSenha.split('T')[0];

  if (novaData < campo4) {
    return {
      valido: false,
      erro: `Bloqueado pela regra TISS: a data ${formatarDataBr(novaData)} é anterior ao Campo "4 – Data da Autorização" (${formatarDataBr(campo4)}), que corresponde à Data Início da senha.`,
    };
  }

  if (validade && novaData > validade) {
    return {
      valido: false,
      erro: `Bloqueado pela regra TISS: a data ${formatarDataBr(novaData)} ultrapassa a Data Fim / Validade da Senha (${formatarDataBr(validade)}).`,
    };
  }

  let avisoSemanal: string | undefined;
  if (limiteSemanal && limiteSemanal > 0) {
    const chaveNova = obterChaveSemana(novaData);
    const qtdMesmaSemana =
      datasExistentes.filter(d => obterChaveSemana(d) === chaveNova).length + 1;
    if (qtdMesmaSemana > limiteSemanal) {
      avisoSemanal = `Atenção: com a data ${formatarDataBr(novaData)}, a semana (${chaveNova}) acumula ${qtdMesmaSemana} sessões, acima da periodicidade autorizada (${limiteSemanal}x/semana).`;
    }
  }

  return { valido: true, avisoSemanal };
}

