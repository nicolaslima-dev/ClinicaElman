import React, { useState } from 'react';
import type { Procedimento } from '@/features/admin/types';

interface ProcedimentosRealizadosSectionProps {
  isSadt: boolean;
  onProcedimentosChange: (procedimentos: Procedimento[]) => void;
}

export function ProcedimentosRealizadosSection({ isSadt, onProcedimentosChange }: ProcedimentosRealizadosSectionProps) {
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

    const novosProcedimentos = [...procedimentos, novoProc];
    setProcedimentos(novosProcedimentos);
    onProcedimentosChange(novosProcedimentos);
    setProcForm({ ...procForm, codigo: '', descricao: '', quantidade: 1 });
  };

  const removerProcedimento = (index: number) => {
    const novosProcedimentos = procedimentos.filter((_, i) => i !== index);
    setProcedimentos(novosProcedimentos);
    onProcedimentosChange(novosProcedimentos);
  };

  return (
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
  );
}
