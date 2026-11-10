import type {
  AutorizacaoRecord,
  ResultadoValidacaoFaturamentoGuia,
  ResumoSemanaIso,
} from '../types';
import { formatarDataBr, obterChaveSemana } from './pacienteValidators';

/**
 * Retorna a chave ISO da semana (Ex: 2026-Sem.45) e o intervalo de Segunda a Domingo formatado em PT-BR
 */
export function obterIntervaloSemanaIso(dataIso: string): {
  chaveSemana: string;
  intervaloLabel: string;
} {
  const chaveSemana = obterChaveSemana(dataIso);
  const [anoStr, mesStr, diaStr] = dataIso.split('T')[0].split('-');
  const dt = new Date(Number(anoStr), Number(mesStr) - 1, Number(diaStr));
  if (isNaN(dt.getTime())) {
    return { chaveSemana, intervaloLabel: dataIso };
  }

  // Ajusta para segunda-feira (1) até domingo (7)
  const diaSemana = dt.getDay() === 0 ? 7 : dt.getDay();
  const segunda = new Date(dt);
  segunda.setDate(dt.getDate() - (diaSemana - 1));

  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);

  const fmt = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  return {
    chaveSemana,
    intervaloLabel: `${fmt(segunda)} a ${fmt(domingo)}`,
  };
}

/**
 * Motor completo de validação da Fase 3 (Recebimento e Digitação de Guia no Faturamento):
 * - Trava máxima de 10 datas por guia
 * - Quantidade = 1 por data de atendimento
 * - Obediência ao Campo 4 (Data Início da Autorização) e Data Fim
 * - Bloqueio de datas repetidas (na própria guia ou já lançadas em outras guias da mesma senha)
 * - Validação automática de Periodicidade Semanal (Semana ISO <= Qtd Semanal Autorizada)
 * - Validação automática de Quantidade Total (Acumulado na senha <= Qtd Total Autorizada)
 * - Conferência de Terapeuta Executante vs. Terapeuta Designado e Valor Tabelado da Operadora
 */
export function validarDigitacaoGuiaFaturamento(params: {
  autorizacao: AutorizacaoRecord | null;
  datasSessoes: Array<{ data_realizacao: string; quantidade: number }>;
  datasOutrasGuiasMesmaSenha: string[];
  terapeutaExecutanteId?: string;
  valorUnitarioInformado: number;
  valorTabeladoOperadora?: number | null;
}): ResultadoValidacaoFaturamentoGuia {
  const {
    autorizacao,
    datasSessoes,
    datasOutrasGuiasMesmaSenha,
    terapeutaExecutanteId,
    valorUnitarioInformado,
    valorTabeladoOperadora,
  } = params;

  const errosBloqueantes: string[] = [];
  const avisos: string[] = [];

  if (!autorizacao) {
    return {
      conforme: false,
      errosBloqueantes: ['Selecione um paciente e uma Autorização (Senha) ativa.'],
      avisos: [],
      semanasIso: [],
      saldoAutorizacao: {
        totalAutorizado: 0,
        jaRealizadoOutrasGuias: 0,
        sessoesGuiaAtual: datasSessoes.length,
        totalAcumulado: datasSessoes.length,
        saldoRestanteAposGuia: 0,
        estourouSaldoTotal: false,
      },
      divergenciaTerapeuta: false,
      divergenciaValorTabela: false,
      valorTabeladoOperadora,
    };
  }

  // 1. Trava de no mínimo 1 e no máximo 10 datas por guia
  if (datasSessoes.length === 0) {
    errosBloqueantes.push('Insira ao menos 1 data de sessão realizada na guia.');
  }
  if (datasSessoes.length > 10) {
    errosBloqueantes.push(
      `Limite TISS excedido: a guia possui ${datasSessoes.length} datas, mas o máximo permitido é de 10 datas por guia.`
    );
  }

  // 2. Validação de cada linha (Vigência Campo 4, Quantidade = 1 e Duplicidades)
  const campo4 = autorizacao.data_inicio.split('T')[0];
  const dataFim = autorizacao.data_fim.split('T')[0];
  const vistasNaGuia = new Set<string>();
  const conjuntoOutrasGuias = new Set(
    datasOutrasGuiasMesmaSenha.map((d) => d.split('T')[0])
  );

  datasSessoes.forEach((item, idx) => {
    const dt = (item.data_realizacao || '').split('T')[0];
    if (!dt) {
      errosBloqueantes.push(`Sessão #${idx + 1}: data de realização não informada.`);
      return;
    }

    if (item.quantidade !== 1) {
      errosBloqueantes.push(
        `Sessão #${idx + 1} (${formatarDataBr(dt)}): quantidade informada (${item.quantidade}) diferente de 1. Cada linha diária deve ter quantidade igual a 1.`
      );
    }

    if (vistasNaGuia.has(dt)) {
      errosBloqueantes.push(
        `Data repetida na guia: ${formatarDataBr(dt)} foi inserida mais de uma vez nesta guia.`
      );
    }
    vistasNaGuia.add(dt);

    if (conjuntoOutrasGuias.has(dt)) {
      errosBloqueantes.push(
        `Data já faturada/lançada em outra guia desta autorização: ${formatarDataBr(dt)}.`
      );
    }

    if (dt < campo4) {
      errosBloqueantes.push(
        `Data ${formatarDataBr(dt)} é anterior ao Campo "4 – Data da Autorização" (${formatarDataBr(campo4)}).`
      );
    }

    if (dataFim && dt > dataFim) {
      errosBloqueantes.push(
        `Data ${formatarDataBr(dt)} ultrapassa a Data Fim da autorização (${formatarDataBr(dataFim)}).`
      );
    }
  });

  // 3. Validação Automática de Periodicidade Semanal (Semana ISO)
  const mapaSemanas = new Map<
    string,
    {
      intervaloLabel: string;
      datasGuiaAtual: string[];
      datasOutrasGuias: string[];
    }
  >();

  // Primeiro registra as datas das outras guias da mesma autorização nas semanas correspondentes
  datasOutrasGuiasMesmaSenha.forEach((rawDate) => {
    const dt = rawDate.split('T')[0];
    if (!dt) return;
    const { chaveSemana, intervaloLabel } = obterIntervaloSemanaIso(dt);
    const atual = mapaSemanas.get(chaveSemana) || {
      intervaloLabel,
      datasGuiaAtual: [],
      datasOutrasGuias: [],
    };
    if (!atual.datasOutrasGuias.includes(dt)) {
      atual.datasOutrasGuias.push(dt);
    }
    mapaSemanas.set(chaveSemana, atual);
  });

  // Agora adiciona as datas da guia atual
  datasSessoes.forEach((item) => {
    const dt = (item.data_realizacao || '').split('T')[0];
    if (!dt) return;
    const { chaveSemana, intervaloLabel } = obterIntervaloSemanaIso(dt);
    const atual = mapaSemanas.get(chaveSemana) || {
      intervaloLabel,
      datasGuiaAtual: [],
      datasOutrasGuias: [],
    };
    atual.datasGuiaAtual.push(dt);
    mapaSemanas.set(chaveSemana, atual);
  });

  const limiteSemanal = autorizacao.quantidade_sessoes_semanais || 1;
  const semanasIso: ResumoSemanaIso[] = Array.from(mapaSemanas.entries())
    .filter(([, val]) => val.datasGuiaAtual.length > 0) // Mostra semanas que possuem datas da guia atual
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chaveSemana, val]) => {
      const totalNaSemana = val.datasGuiaAtual.length + val.datasOutrasGuias.length;
      const excedeuLimite = totalNaSemana > limiteSemanal;
      if (excedeuLimite) {
        errosBloqueantes.push(
          `Estouro de Periodicidade Semanal (${chaveSemana} — ${val.intervaloLabel}): ${totalNaSemana} sessões lançadas na semana, mas a autorização permite no máximo ${limiteSemanal} sessão(ões)/semana.`
        );
      }
      return {
        chaveSemana,
        intervaloLabel: val.intervaloLabel,
        datasGuiaAtual: val.datasGuiaAtual.sort(),
        datasOutrasGuias: val.datasOutrasGuias.sort(),
        totalNaSemana,
        limiteSemanal,
        excedeuLimite,
      };
    });

  // 4. Validação Automática de Quantidade Total (Saldo da Senha)
  const totalAutorizado = autorizacao.quantidade_total_sessoes;
  const jaRealizadoOutrasGuias = datasOutrasGuiasMesmaSenha.length;
  const sessoesGuiaAtual = datasSessoes.reduce(
    (acc, curr) => acc + (Number(curr.quantidade) || 1),
    0
  );
  const totalAcumulado = jaRealizadoOutrasGuias + sessoesGuiaAtual;
  const saldoRestanteAposGuia = totalAutorizado - totalAcumulado;
  const estourouSaldoTotal = totalAcumulado > totalAutorizado;

  if (estourouSaldoTotal) {
    errosBloqueantes.push(
      `Estouro de Quantidade Total Autorizada: a senha #${autorizacao.numero_autorizacao} autoriza ${totalAutorizado} sessão(ões) no total (${jaRealizadoOutrasGuias} já utilizadas + ${sessoesGuiaAtual} nesta guia = ${totalAcumulado} sessões).`
    );
  }

  // 5. Conferência de Terapeuta Executante vs. Terapeuta Designado na Autorização
  const divergenciaTerapeuta = Boolean(
    terapeutaExecutanteId &&
      autorizacao.terapeuta_id &&
      terapeutaExecutanteId !== autorizacao.terapeuta_id
  );
  if (divergenciaTerapeuta) {
    avisos.push(
      'Atenção (Crítica de Auditoria): O terapeuta selecionado na digitação é diferente do Terapeuta Designado originalmente na autorização/guia.'
    );
  }

  // 6. Conferência de Valor da Sessão vs. Tabela Contratual da Operadora
  const divergenciaValorTabela = Boolean(
    valorTabeladoOperadora !== null &&
      valorTabeladoOperadora !== undefined &&
      valorTabeladoOperadora > 0 &&
      Math.abs(valorUnitarioInformado - valorTabeladoOperadora) > 0.009
  );
  if (divergenciaValorTabela && valorTabeladoOperadora) {
    avisos.push(
      `Atenção (Crítica de Valor): Valor informado (R$ ${valorUnitarioInformado.toFixed(2)}) diverge da Tabela Contratual da Operadora (R$ ${valorTabeladoOperadora.toFixed(2)}).`
    );
  }

  return {
    conforme: errosBloqueantes.length === 0,
    errosBloqueantes,
    avisos,
    semanasIso,
    saldoAutorizacao: {
      totalAutorizado,
      jaRealizadoOutrasGuias,
      sessoesGuiaAtual,
      totalAcumulado,
      saldoRestanteAposGuia,
      estourouSaldoTotal,
    },
    divergenciaTerapeuta,
    divergenciaValorTabela,
    valorTabeladoOperadora,
  };
}

/**
 * Parser utilitário para importação em lote (CSV ou texto colado do Excel/Planilha)
 * Seguindo o fluxo padrão:
 *  Formato aceito: codigo_tuss;descricao;valor_sessao;conselho;cbo
 *  ou simplificado: codigo_tuss;valor_sessao
 */
export interface LinhaImportacaoTabelaContrato {
  codigo_tuss: string;
  descricao?: string;
  valor_sessao: number;
  conselho_obrigatorio?: string;
  cbo_prefixo?: string;
}

export function parseLinhasContratoOperadora(texto: string): {
  itens: LinhaImportacaoTabelaContrato[];
  erros: string[];
} {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const itens: LinhaImportacaoTabelaContrato[] = [];
  const erros: string[] = [];

  linhas.forEach((linha, index) => {
    // Ignora cabeçalho se começar com "codigo" ou "tuss"
    if (index === 0 && /^(codigo|código|tuss)/i.test(linha)) {
      return;
    }

    const separador = linha.includes(';') ? ';' : linha.includes('\t') ? '\t' : ',';
    const colunas = linha.split(separador).map((c) => c.trim());

    if (colunas.length < 2) {
      erros.push(`Linha ${index + 1}: formato inválido ("${linha}"). Use CODIGO_TUSS;DESCRICAO;VALOR ou CODIGO_TUSS;VALOR.`);
      return;
    }

    const codigo_tuss = colunas[0].replace(/\D/g, '') || colunas[0];
    if (!codigo_tuss) {
      erros.push(`Linha ${index + 1}: código TUSS vazio.`);
      return;
    }

    // Se tiver 2 colunas: [codigo_tuss, valor]
    // Se tiver 3+ colunas: [codigo_tuss, descricao, valor, conselho?, cbo?]
    let descricao: string | undefined;
    let valorBruto: string;
    let conselho_obrigatorio: string | undefined;
    let cbo_prefixo: string | undefined;

    if (colunas.length === 2) {
      valorBruto = colunas[1];
    } else {
      descricao = colunas[1];
      valorBruto = colunas[2];
      conselho_obrigatorio = colunas[3] || undefined;
      cbo_prefixo = colunas[4] || undefined;
    }

    const valorLimpo = Number(
      valorBruto.replace(/[R$\s]/g, '').replace(',', '.')
    );

    if (isNaN(valorLimpo) || valorLimpo <= 0) {
      erros.push(`Linha ${index + 1}: valor inválido ("${valorBruto}") para o código ${codigo_tuss}.`);
      return;
    }

    itens.push({
      codigo_tuss,
      descricao,
      valor_sessao: Number(valorLimpo.toFixed(2)),
      conselho_obrigatorio,
      cbo_prefixo,
    });
  });

  return { itens, erros };
}

