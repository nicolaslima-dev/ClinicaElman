import React from 'react';

interface AuditoriaHeaderProps {
  pendentesCount: number;
  onRestaurar: () => void;
}

export function AuditoriaHeader({ pendentesCount, onRestaurar }: AuditoriaHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900 tracking-tight">Central de Auditoria</h1>
        <p className="text-sm text-slate-500 mt-2">Resolução de glosas prévias antes do envio Orizon</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onRestaurar} title="Restaurar os 3 erros para novos testes" className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors">
          <i className="ph ph-arrows-clockwise text-lg"></i>
          Restaurar Testes
        </button>
        <span className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all ${pendentesCount > 0 ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-green-50 border border-green-100 text-green-600'}`}>
          <i className={pendentesCount > 0 ? "ph ph-warning-circle text-lg" : "ph ph-check-circle text-lg"}></i>
          <span id="contador-erros-tela">{pendentesCount > 0 ? `${pendentesCount} Erros Pendentes` : 'Tudo Validado'}</span>
        </span>
      </div>
    </div>
  );
}
