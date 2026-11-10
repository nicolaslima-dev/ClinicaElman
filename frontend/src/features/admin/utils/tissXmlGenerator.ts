import type {
  GuiaTissRecord,
  LoteFaturamentoRecord,
  OperadoraRecord,
  VersaoTiss,
} from '../types';

/**
 * Escapa caracteres especiais para conformidade estrita com XML 1.0 (UTF-8)
 */
function escapeXml(valor: string | number | null | undefined): string {
  if (valor === undefined || valor === null) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .trim();
}

/**
 * Implementação nativa RFC 1321 MD5 em TypeScript para cálculo do Hash Epílogo ANS (<ans:hash>)
 * A ANS exige que o hash MD5 de 32 caracteres hexadecimais minúsculos seja calculado sobre
 * a concatenação dos valores das tags do conteúdo da mensagem TISS (UTF-8).
 */
export function calcularHashMd5Ans(input: string): string {
  function rotateLeft(lValue: number, iShiftBits: number): number {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number): number {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function f(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const utf8 = unescape(encodeURIComponent(str));
    const lMessageLength = utf8.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 =
      (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray: number[] = new Array(lNumberOfWords - 1).fill(0);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] =
        (lWordArray[lWordCount] || 0) |
        (utf8.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] =
      (lWordArray[lWordCount] || 0) | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number): string {
    let wordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const temp = '0' + lByte.toString(16);
      wordToHexValue += temp.substr(temp.length - 2, 2);
    }
    return wordToHexValue;
  }

  const x = convertToWordArray(input);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  const S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  const S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;

    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Mapeia a sigla do Conselho Profissional para o código numérico da Tabela de Domínio 26 da ANS
 */
function mapearConselhoAns(sigla?: string | null): string {
  const s = (sigla || 'CRP').toUpperCase().trim();
  switch (s) {
    case 'CRAS':
      return '01';
    case 'COREN':
      return '02';
    case 'CRF':
      return '03';
    case 'CRFA':
      return '04';
    case 'CREFITO':
      return '05';
    case 'CRM':
      return '06';
    case 'CRN':
      return '07';
    case 'CRO':
      return '08';
    case 'CRP':
      return '09';
    default:
      return '10'; // Outros Conselhos
  }
}

/**
 * Mapeia a sigla da UF para o código IBGE de 2 dígitos exigido pela Tabela de Domínio 59 da ANS
 */
function mapearUfIbgeAns(uf?: string | null): string {
  const mapa: Record<string, string> = {
    RO: '11',
    AC: '12',
    AM: '13',
    RR: '14',
    PA: '15',
    AP: '16',
    TO: '17',
    MA: '21',
    PI: '22',
    CE: '23',
    RN: '24',
    PB: '25',
    PE: '26',
    AL: '27',
    SE: '28',
    BA: '29',
    MG: '31',
    ES: '32',
    RJ: '33',
    SP: '35',
    PR: '41',
    SC: '42',
    RS: '43',
    MS: '50',
    MT: '51',
    GO: '52',
    DF: '53',
  };
  const chave = (uf || 'RJ').toUpperCase().trim();
  return mapa[chave] || '33';
}

export interface ResultadoGeracaoXmlTiss {
  xml: string;
  hashMd5: string;
  nomeArquivoSugerido: string;
  numeroLote: string;
  operadoraNome: string;
  registroAns: string;
  versaoTiss: VersaoTiss;
  quantidadeGuias: number;
  quantidadeSessoes: number;
  valorTotalLote: number;
}

/**
 * Gera o documento XML TISS oficial no Padrão ANS para um Lote de Guias SP/SADT,
 * adaptando dinamicamente o cabeçalho, schema XSD e tags conforme a versão TISS da Operadora
 * (ex: 4.03.00, 4.02.00, 4.01.00, 3.05.00, etc.) e calculando o Hash MD5 canônico no epílogo.
 */
export function gerarXmlLoteTiss(params: {
  lote: LoteFaturamentoRecord;
  guias?: GuiaTissRecord[];
  operadora?: OperadoraRecord | null;
}): ResultadoGeracaoXmlTiss {
  const { lote } = params;
  const guiasDoLote = params.guias || lote.guias || [];
  const operadora =
    params.operadora ||
    lote.operadora ||
    guiasDoLote[0]?.plano?.operadora ||
    null;

  const versaoTiss: VersaoTiss =
    operadora?.versao_tiss ||
    lote.versao_tiss ||
    guiasDoLote[0]?.versao_tiss ||
    '4.03.00';

  const versaoUnderscore = versaoTiss.replace(/\./g, '_');
  const isFamilia3 = versaoTiss.startsWith('3.');

  const operadoraNome = operadora?.nome || 'OPERADORA';
  const registroAns = (operadora?.registro_ans || '005711').padStart(6, '0');
  const codigoPrestador = operadora?.codigo_prestador || '00000000014285';

  const agora = new Date();
  const dataRegistro = agora.toISOString().split('T')[0];
  const horaRegistro = agora.toTimeString().split(' ')[0];
  const sequencialTransacao = String(lote.numero_lote).replace(/\D/g, '') || '1';

  let somaSessoesLote = 0;
  let somaValorLote = 0;

  const guiasXmlArray = guiasDoLote.map((guia) => {
    const sessoes = [...(guia.sessoes || [])].sort(
      (a, b) => a.ordem_sessao - b.ordem_sessao
    );
    const terapeuta =
      guia.terapeuta_executante ||
      guia.terapeuta_designado ||
      guia.autorizacao?.terapeuta;

    const valorUnitarioPadrao = Number(
      guia.valor_unitario_sessao ??
        sessoes[0]?.valor_unitario ??
        guia.autorizacao?.valor_unitario_sessao ??
        0
    );

    let somaValorGuia = 0;

    const procedimentosExecutadosXml = sessoes
      .map((sessao, idx) => {
        const qtd = Number(sessao.quantidade) || 1;
        const vlrUnit = Number(sessao.valor_unitario ?? valorUnitarioPadrao);
        const vlrTotalItem = Number((qtd * vlrUnit).toFixed(2));

        somaSessoesLote += qtd;
        somaValorGuia += vlrTotalItem;

        return `            <ans:procedimentoExecutado>
              <ans:sequencialItem>${idx + 1}</ans:sequencialItem>
              <ans:dataExecucao>${escapeXml(sessao.data_realizacao.split('T')[0])}</ans:dataExecucao>
              <ans:procedimento>
                <ans:codigoTabela>22</ans:codigoTabela>
                <ans:codigoProcedimento>${escapeXml(guia.codigo_tuss)}</ans:codigoProcedimento>
                <ans:descricaoProcedimento>${escapeXml(guia.descricao_termo)}</ans:descricaoProcedimento>
              </ans:procedimento>
              <ans:quantidadeExecutada>${qtd}</ans:quantidadeExecutada>
              <ans:reducaoAcrescimo>1.00</ans:reducaoAcrescimo>
              <ans:valorUnitario>${vlrUnit.toFixed(2)}</ans:valorUnitario>
              <ans:valorTotal>${vlrTotalItem.toFixed(2)}</ans:valorTotal>
            </ans:procedimentoExecutado>`;
      })
      .join('\n');

    somaValorGuia = Number(somaValorGuia.toFixed(2));
    somaValorLote += somaValorGuia;

    const campo4DataAutorizacao = (
      guia.data_autorizacao_campo4 ||
      guia.autorizacao?.data_inicio ||
      dataRegistro
    ).split('T')[0];

    const dataValidadeSenha = (
      guia.data_validade_senha ||
      guia.autorizacao?.data_fim ||
      dataRegistro
    ).split('T')[0];

    const numeroCarteira =
      guia.paciente?.carteira_plano || '000000000000000';
    const nomeBeneficiario = guia.paciente?.nome || 'PACIENTE';
    const nomeProfissional = terapeuta?.nome || 'PROFISSIONAL EXECUTANTE';
    const conselhoCodigo = mapearConselhoAns(terapeuta?.conselho);
    const numeroConselho = terapeuta?.numero_conselho || '00000';
    const ufIbge = mapearUfIbgeAns(terapeuta?.uf_conselho);
    const cbo = (terapeuta?.cbo || '251510').replace(/\D/g, '');

    // Na família TISS 3.x (ex: 3.05.00), <ans:nomeBeneficiario> é incluído em <ans:dadosBeneficiario>;
    // Na família TISS 4.x (ex: 4.03.00), <ans:dadosBeneficiario> foca em numeroCarteira e atendimentoRN
    const tagNomeBeneficiario = isFamilia3
      ? `\n            <ans:nomeBeneficiario>${escapeXml(nomeBeneficiario)}</ans:nomeBeneficiario>`
      : '';

    return `        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>${escapeXml(registroAns)}</ans:registroANS>
            <ans:numeroGuiaPrestador>${escapeXml(guia.numero_guia_prestador)}</ans:numeroGuiaPrestador>
            <ans:guiaPrincipal>${escapeXml(guia.numero_guia_operadora || guia.numero_senha)}</ans:guiaPrincipal>
          </ans:cabecalhoGuia>
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${escapeXml(guia.numero_guia_operadora || guia.numero_senha)}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>${escapeXml(campo4DataAutorizacao)}</ans:dataAutorizacao>
            <ans:senha>${escapeXml(guia.numero_senha)}</ans:senha>
            <ans:dataValidadeSenha>${escapeXml(dataValidadeSenha)}</ans:dataValidadeSenha>
          </ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>${escapeXml(numeroCarteira)}</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>${tagNomeBeneficiario}
          </ans:dadosBeneficiario>
          <ans:dadosSolicitante>
            <ans:contratadoSolicitante>
              <ans:codigoPrestadorNaOperadora>${escapeXml(codigoPrestador)}</ans:codigoPrestadorNaOperadora>
              <ans:nomeContratado>CLINICA ELMAN</ans:nomeContratado>
            </ans:contratadoSolicitante>
            <ans:profissionalSolicitante>
              <ans:nomeProfissional>${escapeXml(nomeProfissional)}</ans:nomeProfissional>
              <ans:conselhoProfissional>${escapeXml(conselhoCodigo)}</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>${escapeXml(numeroConselho)}</ans:numeroConselhoProfissional>
              <ans:UF>${escapeXml(ufIbge)}</ans:UF>
              <ans:CBOS>${escapeXml(cbo)}</ans:CBOS>
            </ans:profissionalSolicitante>
          </ans:dadosSolicitante>
          <ans:dadosSolicitacao>
            <ans:dataSolicitacao>${escapeXml(campo4DataAutorizacao)}</ans:dataSolicitacao>
            <ans:caraterAtendimento>1</ans:caraterAtendimento>
          </ans:dadosSolicitacao>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
              <ans:codigoPrestadorNaOperadora>${escapeXml(codigoPrestador)}</ans:codigoPrestadorNaOperadora>
              <ans:nomeContratado>CLINICA ELMAN</ans:nomeContratado>
            </ans:contratadoExecutante>
            <ans:CNES>2077485</ans:CNES>
            <ans:profissionalExecutante>
              <ans:nomeProfissional>${escapeXml(nomeProfissional)}</ans:nomeProfissional>
              <ans:conselhoProfissional>${escapeXml(conselhoCodigo)}</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>${escapeXml(numeroConselho)}</ans:numeroConselhoProfissional>
              <ans:UF>${escapeXml(ufIbge)}</ans:UF>
              <ans:CBOS>${escapeXml(cbo)}</ans:CBOS>
            </ans:profissionalExecutante>
          </ans:dadosExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>03</ans:tipoAtendimento>
            <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
            <ans:regimeAtendimento>01</ans:regimeAtendimento>
          </ans:dadosAtendimento>
          <ans:procedimentosExecutados>
${procedimentosExecutadosXml}
          </ans:procedimentosExecutados>
          <ans:valorTotal>
            <ans:valorProcedimentos>${somaValorGuia.toFixed(2)}</ans:valorProcedimentos>
            <ans:valorTotalGeral>${somaValorGuia.toFixed(2)}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaSP-SADT>`;
  });

  const corpoParaHash = `  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>${escapeXml(sequencialTransacao)}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${escapeXml(dataRegistro)}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>${escapeXml(horaRegistro)}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>${escapeXml(codigoPrestador)}</ans:codigoPrestadorNaOperadora>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>${escapeXml(registroAns)}</ans:registroANS>
    </ans:destino>
    <ans:Padrao>${escapeXml(versaoTiss)}</ans:Padrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${escapeXml(lote.numero_lote)}</ans:numeroLote>
      <ans:guiasTISS>
${guiasXmlArray.join('\n')}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>`;

  // Conforme especificação da ANS, o hash MD5 é calculado sobre o conteúdo textual das tags
  const conteudoValoresLimpos = corpoParaHash.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  const hashMd5 = calcularHashMd5Ans(conteudoValoresLimpos);

  const xmlFinal = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas http://www.ans.gov.br/padroes/tiss/schemas/tissV${versaoUnderscore}.xsd">
${corpoParaHash}
  <ans:epilogo>
    <ans:hash>${hashMd5}</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;

  const nomeOpSlug = operadoraNome.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const nomeArquivoSugerido = `LOTE_${lote.numero_lote}_${nomeOpSlug}_TISS_${versaoUnderscore}.xml`;

  return {
    xml: xmlFinal,
    hashMd5,
    nomeArquivoSugerido,
    numeroLote: lote.numero_lote,
    operadoraNome,
    registroAns,
    versaoTiss,
    quantidadeGuias: guiasDoLote.length,
    quantidadeSessoes: somaSessoesLote,
    valorTotalLote: Number(somaValorLote.toFixed(2)),
  };
}

/**
 * Dispara o download nativo do arquivo .xml no navegador
 */
export function baixarArquivoXmlTiss(nomeArquivo: string, conteudoXml: string): void {
  const blob = new Blob([conteudoXml], {
    type: 'application/xml;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

