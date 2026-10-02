import React from 'react';

export function DadosAgendamentoSection() {
  return (
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
  );
}
