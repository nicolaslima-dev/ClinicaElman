import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface Procedimento {
  codigoTabela: string;
  codigoProcedimento: string;
  descricao: string;
  datahora: string;
  viaTecnica: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export function AdminNovoAtendimentoPage() {
  const navigate = useNavigate();
  const [tipoGuia, setTipoGuia] = useState<'GUIA_CONSULTA' | 'GUIA_SP_SADT'>('GUIA_CONSULTA');
  const [isSessaoSeriada, setIsSessaoSeriada] = useState(false);
  
  // Form estado para procedimentos
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [procForm, setProcForm] = useState({
    tabela: '22',
    codigo: '',
    descricao: '',
    datahora: '2026-09-01T14:30',
    quantidade: 1,
    via: '',
    tecnica: ''
  });

  const isSadt = tipoGuia === 'GUIA_SP_SADT';

  const mockPrecos: Record<string, { desc: string, valor: number }> = {
    '10101012': { desc: 'Consulta em consultório', valor: 150.00 },
    '20103471': { desc: 'Fisioterapia p/ distúrbios osteomioarticulares', valor: 85.00 }
  };

  const handleProcFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'codigo') {
      const mockData = mockPrecos[value] || { desc: value.length >= 4 ? 'Procedimento Genérico TUSS' : '', valor: value.length >= 4 ? 50.0 : 0 };
      setProcForm(prev => ({
        ...prev,
        [name]: value,
        descricao: mockData.desc
      }));
    } else {
      setProcForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const valorUnitario = mockPrecos[procForm.codigo]?.valor || (procForm.codigo.length >= 4 ? 50.0 : 0);
  const valorTotal = valorUnitario * procForm.quantidade;

  const handleAddProcedimento = () => {
    if (!procForm.codigo) {
      alert("Preencha o código do procedimento.");
      return;
    }

    const novoProc: Procedimento = {
      codigoTabela: procForm.tabela,
      codigoProcedimento: procForm.codigo,
      descricao: procForm.descricao,
      datahora: procForm.datahora,
      viaTecnica: (procForm.via || procForm.tecnica) ? `${procForm.via || '-'}/${procForm.tecnica || '-'}` : '-',
      quantidade: procForm.quantidade,
      valorUnitario,
      valorTotal
    };

    setProcedimentos([...procedimentos, novoProc]);
    setProcForm({ ...procForm, codigo: '', descricao: '', quantidade: 1 });
  };

  const removerProcedimento = (index: number) => {
    setProcedimentos(procedimentos.filter((_, i) => i !== index));
  };

  const salvarNovoAtendimento = () => {
    console.log("PAYLOAD TISS GERADO", { tipoGuia, isSessaoSeriada, procedimentos });
    alert('Atendimento Salvo! Payload logado no console.');
    navigate('/atendimento');
  };

  return (
    <div className="fade-in max-w-5xl mx-auto pb-10 w-full">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-ink-400 text-sm mb-1.5">
            <Link to="/dashboard" className="hover:text-brand-700 transition-colors"><i className="ph ph-house"></i></Link>
            <i className="ph ph-caret-right text-xs"></i>
            <Link to="/atendimento" className="hover:text-brand-700 transition-colors">Atendimento</Link>
            <i className="ph ph-caret-right text-xs"></i>
            <span className="text-brand-700 font-medium">Novo Atendimento</span>
          </div>
          <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
            Registro de Atendimento
          </h1>
        </div>
        <div className="flex gap-3">
          <Link to="/atendimento" className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-600 bg-white border border-ink-200 hover:bg-ink-50 transition-colors inline-flex items-center justify-center">
            Cancelar
          </Link>
          <button 
            onClick={salvarNovoAtendimento}
            className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-soft hover:scale-105 active:scale-95"
          >
            <i className="ph ph-check-circle text-lg text-brand-300"></i> Salvar e Gerar Guia
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tipo de Guia */}
        <div className="bg-white p-6 rounded-[20px] shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-base font-semibold font-heading text-ink-900 w-32">Tipo de Guia:</h3>
            <div className="segmented-control flex p-1 bg-ink-50 rounded-lg border border-ink-100 flex-1 max-w-sm">
              <input type="radio" id="guia_consulta" name="tipo_guia" value="GUIA_CONSULTA" checked={tipoGuia === 'GUIA_CONSULTA'} onChange={(e) => setTipoGuia(e.target.value as any)} className="hidden" />
              <label htmlFor="guia_consulta" className={`flex-1 text-center p-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${tipoGuia === 'GUIA_CONSULTA' ? 'bg-white text-brand-600 shadow-sm border border-ink-100' : 'text-ink-500 hover:text-ink-700 border border-transparent'}`}>Consulta</label>

              <input type="radio" id="guia_sadt" name="tipo_guia" value="GUIA_SP_SADT" checked={tipoGuia === 'GUIA_SP_SADT'} onChange={(e) => setTipoGuia(e.target.value as any)} className="hidden" />
              <label htmlFor="guia_sadt" className={`flex-1 text-center p-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${tipoGuia === 'GUIA_SP_SADT' ? 'bg-white text-brand-600 shadow-sm border border-ink-100' : 'text-ink-500 hover:text-ink-700 border border-transparent'}`}>SP / SADT</label>
            </div>
          </div>
        </div>

        {/* Identificação do Paciente */}
        <div className="bg-white p-7 rounded-[20px] shadow-card">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <i className="ph ph-user text-lg"></i>
            </div>
            <h3 className="text-base font-semibold font-heading text-ink-900">Identificação e Elegibilidade</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="col-span-1 md:col-span-4">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Buscar Paciente (Nome, CPF ou Prontuário)</label>
              <div className="relative">
                <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
                <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 pl-10 text-sm outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 transition-all text-ink-900" placeholder="Digite para buscar..." defaultValue="Mariana Costa e Silva (CPF: 123.456.789-00)" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Operadora / Convênio</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="">Selecione...</option>
                <option value="bradesco" selected>Bradesco Saúde</option>
                <option value="cassi">CASSI</option>
                <option value="unimed">Unimed</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Plano</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="">Selecione...</option>
                <option value="top">Top Nacional</option>
                <option value="efetivo" selected>Efetivo Prata</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Matrícula / Carteirinha</label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-mono" defaultValue="738.992.102345.01" />
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Validade da Carteira</label>
              <input type="month" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2027-12" />
            </div>
          </div>
        </div>

        {/* Dados do Agendamento */}
        <div className="bg-white p-7 rounded-[20px] shadow-card">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
            <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center text-ink-600">
              <i className="ph ph-calendar-check text-lg"></i>
            </div>
            <h3 className="text-base font-semibold font-heading text-ink-900">Dados do Agendamento</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Data e Hora do Atendimento</label>
              <input type="datetime-local" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-09-01T14:30" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Autor</label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Tipo Doença</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="">Selecione...</option>
                <option value="aguda">Aguda</option>
                <option value="cronica">Crônica</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Tipo Saída</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="">Selecione...</option>
                <option value="alta">Alta</option>
                <option value="retorno">Retorno</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Status</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="agendado">Agendado</option>
                <option value="em_espera">Em Espera</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Local de Atendimento</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="clinica" selected>Clínica Principal (Matriz)</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Tipo de Atendimento</label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="primeira">Primeira Consulta</option>
                <option value="seguimento" selected>Seguimento / Sessão</option>
              </select>
            </div>
          </div>
        </div>

        {/* Profissional e Regulação */}
        <div className="bg-white p-7 rounded-[20px] shadow-card">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-600">
              <i className="ph ph-stethoscope text-lg"></i>
            </div>
            <h3 className="text-base font-semibold font-heading text-ink-900">Profissional e Regulação</h3>
          </div>

          <div className="mb-3">
            <h4 className="text-sm font-medium text-ink-700 mb-3">Profissional Executante</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Nome do Profissional</label>
                <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="Dr. Carlos Mendes" />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Cód. Operadora</label>
                <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="489" />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Conselho</label>
                <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                  <option value="CRM" selected>CRM</option>
                  <option value="CREFITO">CREFITO</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Número</label>
                <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="44556" />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-xs font-medium text-ink-500 mb-1.5">UF</label>
                <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                  <option value="RJ" selected>RJ</option>
                  <option value="SP">SP</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-6">
                <label className="block text-xs font-medium text-ink-500 mb-1.5">CBO (Classificação Brasileira de Ocupações)</label>
                <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                  <option value="225125" selected>225125 - Médico Clínico</option>
                </select>
              </div>
            </div>
          </div>

          {isSadt && (
            <div className="mt-6 pt-5 border-t border-ink-100">
              <h4 className="text-sm font-medium text-ink-700 mb-3">Profissional Solicitante (Para SP/SADT)</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Nome do Profissional <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Conselho <span className="text-red-500">*</span></label>
                  <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                    <option value="CRM">CRM</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Número</label>
                  <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">CBO <span className="text-red-500">*</span></label>
                  <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                    <option value="225125">225125 - Médico Clínico</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Autorização e Dados Clínicos */}
        <div className="bg-white p-7 rounded-[20px] shadow-card">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <i className="ph ph-file-text text-lg"></i>
            </div>
            <h3 className="text-base font-semibold font-heading text-ink-900">Autorização e Dados Clínicos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Data Solicitação Guia</label>
                <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-07-01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Data Autorização Senha</label>
                <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-07-01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Validade da Senha</label>
                <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-09-15" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Nº Guia Operadora</label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-mono" placeholder="Guia gerada pelo convênio" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Nº Guia Prestador</label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-mono" placeholder="Guia do prestador" defaultValue="38291040" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Senha / Token <span className={isSadt ? "text-red-500" : "hidden"}>*</span></label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-brand-700 font-mono font-medium" placeholder="Código liberado" defaultValue="X88A-92P" />
            </div>

            <div className="col-span-1 md:col-span-4">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Diagnóstico (CID-10 Principal) <span className={isSadt ? "text-red-500" : "hidden"}>*</span></label>
              <div className="relative">
                <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-medium" placeholder="Buscar por código ou descrição..." defaultValue="M54.5 - Dor lombar baixa" />
              </div>
            </div>
          </div>
        </div>

        {/* Tratamento Continuado */}
        {isSadt && (
          <div className="bg-white p-7 rounded-[20px] shadow-card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-100/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <i className="ph ph-calendar-plus text-lg"></i>
                </div>
                <h3 className="text-base font-semibold font-heading text-ink-900">Tratamento Continuado (Sessões)</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isSessaoSeriada} onChange={(e) => setIsSessaoSeriada(e.target.checked)} className="w-4 h-4 text-brand-600 rounded border-ink-300 focus:ring-brand-500" />
                <span className="text-sm font-medium text-ink-700">Ativar Controle de Sessões</span>
              </label>
            </div>
            {isSessaoSeriada && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Sessões Autorizadas</label>
                  <input type="number" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="55" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Freq. Semanal</label>
                  <input type="number" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="5" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Início Tratamento</label>
                  <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-05-29" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Fim Tratamento</label>
                  <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-08-26" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Nº Sessão Atual</label>
                  <input type="number" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-brand-700 font-medium" defaultValue="1" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Procedimentos Realizados */}
        <div className="bg-white p-7 rounded-[20px] shadow-card">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <i className="ph ph-list-numbers text-lg"></i>
            </div>
            <h3 className="text-base font-semibold font-heading text-ink-900">Procedimentos Realizados (TUSS)</h3>
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Cód. Tabela</label>
              <input type="text" name="tabela" value={procForm.tabela} onChange={handleProcFormChange} className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Cód. Procedimento</label>
              <input type="text" name="codigo" value={procForm.codigo} onChange={handleProcFormChange} className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" placeholder="Ex: 10101012" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Descrição</label>
              <input type="text" value={procForm.descricao} readOnly className="w-full bg-ink-50/50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none text-ink-500 cursor-not-allowed" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Data/Hora</label>
              <input type="datetime-local" name="datahora" value={procForm.datahora} onChange={handleProcFormChange} className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Qtd</label>
              <input type="number" name="quantidade" value={procForm.quantidade} onChange={handleProcFormChange} min="1" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Unitário(R$)</label>
              <input type="number" value={valorUnitario.toFixed(2)} readOnly className="w-full bg-ink-50/50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none text-ink-500 cursor-not-allowed" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Total(R$)</label>
              <input type="number" value={valorTotal.toFixed(2)} readOnly className="w-full bg-ink-50/50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none text-ink-500 cursor-not-allowed" />
            </div>
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-11">
              {isSadt && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1.5">Via de Acesso (Condicional)</label>
                    <select name="via" value={procForm.via} onChange={handleProcFormChange} className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                      <option value="">Selecione...</option>
                      <option value="1">1 - Única</option>
                      <option value="2">2 - Mesma Via</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1.5">Técnica Utilizada (Condicional)</label>
                    <select name="tecnica" value={procForm.tecnica} onChange={handleProcFormChange} className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                      <option value="">Selecione...</option>
                      <option value="convencional">Convencional</option>
                      <option value="videolaparoscopia">Videolaparoscopia</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-1">
              <button onClick={handleAddProcedimento} className="w-full bg-ink-900 hover:bg-ink-800 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center h-[42px]">
                <i className="ph ph-plus font-bold"></i>
              </button>
            </div>
          </div>

          <div className="border border-ink-100 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-left text-sm text-ink-600">
              <thead className="bg-ink-50">
                <tr className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Tabela</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-center">Data/Hora</th>
                  <th className="px-4 py-3 text-center">Via/Téc.</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-right">V. Unit</th>
                  <th className="px-4 py-3 text-right">V. Total</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {procedimentos.map((proc, index) => (
                  <tr key={index} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-4 py-3">{proc.codigoTabela}</td>
                    <td className="px-4 py-3 font-mono">{proc.codigoProcedimento}</td>
                    <td className="px-4 py-3">{proc.descricao}</td>
                    <td className="px-4 py-3 text-center text-xs">{new Date(proc.datahora).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-center text-xs">{proc.viaTecnica}</td>
                    <td className="px-4 py-3 text-center">{proc.quantidade}</td>
                    <td className="px-4 py-3 text-right">R$ {proc.valorUnitario.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">R$ {proc.valorTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removerProcedimento(index)} className="text-red-500 hover:text-red-700 p-1">
                        <i className="ph ph-trash text-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {procedimentos.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-ink-400">Nenhum procedimento adicionado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
