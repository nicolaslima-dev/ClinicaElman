import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { TipoGuiaSection } from '../components/novo-atendimento/TipoGuiaSection';
import { IdentificacaoSection } from '../components/novo-atendimento/IdentificacaoSection';
import { DadosAgendamentoSection } from '../components/novo-atendimento/DadosAgendamentoSection';
import { ProfissionalRegulacaoSection } from '../components/novo-atendimento/ProfissionalRegulacaoSection';
import { AutorizacaoDadosClinicosSection } from '../components/novo-atendimento/AutorizacaoDadosClinicosSection';
import { TratamentoContinuadoSection } from '../components/novo-atendimento/TratamentoContinuadoSection';
import { ProcedimentosRealizadosSection } from '../components/novo-atendimento/ProcedimentosRealizadosSection';
import type { Procedimento } from '@/features/admin/types';

export function AdminNovoAtendimentoPage() {
  const navigate = useNavigate();
  const [tipoGuia, setTipoGuia] = useState<'GUIA_CONSULTA' | 'GUIA_SP_SADT'>('GUIA_CONSULTA');
  const [isSessaoSeriada, setIsSessaoSeriada] = useState(false);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

  const isSadt = tipoGuia === 'GUIA_SP_SADT';

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
            <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
              Registro de Atendimento
            </h1>
          </div>
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
        <TipoGuiaSection tipoGuia={tipoGuia} setTipoGuia={setTipoGuia} />
        <IdentificacaoSection />
        <DadosAgendamentoSection />
        <ProfissionalRegulacaoSection isSadt={isSadt} />
        <AutorizacaoDadosClinicosSection isSadt={isSadt} />
        <TratamentoContinuadoSection isSadt={isSadt} isSessaoSeriada={isSessaoSeriada} setIsSessaoSeriada={setIsSessaoSeriada} />
        <ProcedimentosRealizadosSection isSadt={isSadt} onProcedimentosChange={setProcedimentos} />
      </div>
    </div>
  );
}
