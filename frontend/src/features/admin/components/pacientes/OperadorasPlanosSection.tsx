import React from 'react';
import type { OperadoraRecord, PacienteRecord } from '@/features/admin/types';
import type { ModoModalConvenio } from './ModalOperadoraPlano';

interface OperadorasPlanosSectionProps {
  operadoras: OperadoraRecord[];
  pacientes: PacienteRecord[];
  onAbrirModal: (modo: ModoModalConvenio) => void;
}

export function OperadorasPlanosSection({
  operadoras,
  pacientes,
  onAbrirModal,
}: OperadorasPlanosSectionProps) {
  const contarPacientesOperadora = (operadoraId: string) =>
    pacientes.filter(p => p.plano?.operadora_id === operadoraId || p.plano?.operadora?.id === operadoraId)
      .length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white p-4 sm:p-6 rounded-[20px] shadow-card border border-ink-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold font-heading text-ink-900">
            Operadoras & Planos Pré-Definidos (Modelagem Relacional)
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            Cadastre cada operadora com sua Versão TISS oficial. Ao vincular um plano ao paciente, a versão TISS e regras são herdadas automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAbrirModal({ tipo: 'nova_operadora' })}
          className="w-full sm:w-auto justify-center bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-5 rounded-full transition-all text-xs sm:text-sm flex items-center gap-2 shadow-soft shrink-0 cursor-pointer"
        >
          <i className="ph ph-plus-circle text-brand-300 text-lg"></i>
          Nova Operadora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {operadoras.map(op => {
          const qtdPacientes = contarPacientesOperadora(op.id);
          const planos = op.planos || [];

          return (
            <div
              key={op.id}
              className="bg-white rounded-[20px] p-4 sm:p-6 shadow-card border border-ink-100/70 flex flex-col justify-between hover:border-brand-200 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold font-heading text-sm border border-brand-100">
                      {op.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold font-heading text-ink-900 text-base leading-tight">
                        {op.nome}
                      </h4>
                      <span className="text-[11px] font-mono text-ink-400">
                        ANS: {op.registro_ans || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                    TISS {op.versao_tiss}
                  </span>
                </div>

                {/* Metadados Pré-definidos */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-ink-50/70 border border-ink-100 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-ink-400 uppercase block">Carteira</span>
                    <span className="text-xs font-semibold text-ink-800">
                      {op.tamanho_matricula ? `${op.tamanho_matricula} díg.` : 'Livre'}
                    </span>
                  </div>
                  <div className="border-x border-ink-200/60">
                    <span className="text-[10px] text-ink-400 uppercase block">Val. Senha</span>
                    <span className="text-xs font-semibold text-ink-800">
                      {op.dias_validade_autorizacao} dias
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-400 uppercase block">Pacientes</span>
                    <span className="text-xs font-semibold text-brand-700">{qtdPacientes}</span>
                  </div>
                </div>

                {/* Lista de Planos da Operadora */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2">
                    Planos Vinculados ({planos.length})
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {planos.length === 0 ? (
                      <p className="text-xs text-ink-400 italic">Nenhum plano cadastrado.</p>
                    ) : (
                      planos.map(pl => (
                        <div
                          key={pl.id}
                          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-ink-50/50 border border-ink-100 text-xs"
                        >
                          <span className="font-medium text-ink-800 truncate">{pl.nome_plano}</span>
                          <span className="text-[10px] text-ink-400 shrink-0 ml-2">
                            {pl.acomodacao || 'Ambulatorial'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-ink-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onAbrirModal({ tipo: 'editar_operadora', operadora: op })}
                  className="text-xs font-medium text-ink-600 hover:text-ink-900 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors flex items-center gap-1"
                >
                  <i className="ph ph-gear"></i> Editar Regras / TISS
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirModal({ tipo: 'novo_plano', operadora: op })}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <i className="ph ph-plus"></i> Adicionar Plano
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

