import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AtendimentoKpiCards } from '../components/atendimento/AtendimentoKpiCards';
import type { Atendimento } from '@/features/admin/types';
import { AtendimentoTable } from '../components/atendimento/AtendimentoTable';
import { ModalImpressao } from '../components/atendimento/ModalImpressao';
import { ModalHistorico } from '../components/atendimento/ModalHistorico';
import { ModalAssinatura } from '../components/atendimento/ModalAssinatura';

export function AdminAtendimentoPage() {
  const [isModalImpressaoOpen, setModalImpressaoOpen] = useState(false);
  const [isModalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [isModalAssinaturaOpen, setModalAssinaturaOpen] = useState(false);

  const [historicoPaciente, setHistoricoPaciente] = useState<Atendimento | null>(null);

  // Mock de atendimentos
  const mockAtendimentos: Atendimento[] = [
    {
      id: 1,
      paciente: 'Mariana Costa e Silva',
      guia: '883921',
      horario: '14:30',
      data: '01/09/2026',
      profissional: 'Dr. Carlos Mendes',
      local: 'Consultório 1',
      convenio: 'Bradesco Top Nacional',
      cobertura: 'Com coparticipação',
      status: 'aguardando',
      statusFinanceiro: 'pendente'
    },
    {
      id: 2,
      paciente: 'João Pedro Alves',
      guia: '445122',
      horario: '15:00',
      data: '01/09/2026',
      profissional: 'Dra. Luciana Silva',
      local: 'Consultório 3',
      convenio: 'Unimed Flex',
      cobertura: 'Sem coparticipação',
      status: 'em_atendimento',
      statusFinanceiro: 'autorizado'
    }
  ];

  const abrirHistorico = (item: Atendimento) => {
    setHistoricoPaciente(item);
    setModalHistoricoOpen(true);
  };

  const handleConfirmImpressao = (metodo: string, tipo: string) => {
    setModalImpressaoOpen(false);
    if (metodo === 'digitalizadora') {
      setModalAssinaturaOpen(true);
    } else {
      alert(`Gerando PDF padrão ANS (${tipo}). Link de assinatura digital enviado via Gov.br ou Portal.`);
    }
  };

  const exportarAgenda = () => {
    alert('Agenda Exportada com sucesso!');
  };

  return (
    <>
      <div id="view-atendimento" className="view-section fade-in max-w-7xl mx-auto w-full">
        {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-semibold font-heading text-ink-900 tracking-tight">
            Gestão de Atendimentos
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Acompanhe a agenda do dia, cadastre novas fichas e monitore o fluxo clínico.
          </p>
        </div>
        <Link to="/atendimento/novo">
          <button
            className="bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-soft group"
          >
            <i className="ph ph-plus-circle text-lg text-brand-300 group-hover:rotate-90 transition-transform duration-300"></i>
            Novo Atendimento
          </button>
        </Link>
      </div>

      <AtendimentoKpiCards onExportarAgenda={exportarAgenda} />

      <AtendimentoTable
        atendimentos={mockAtendimentos}
        onOpenHistorico={abrirHistorico}
        onOpenImpressao={() => setModalImpressaoOpen(true)}
      />
      </div>

      <ModalImpressao
        isOpen={isModalImpressaoOpen}
        onClose={() => setModalImpressaoOpen(false)}
        onConfirm={handleConfirmImpressao}
      />

      <ModalHistorico
        isOpen={isModalHistoricoOpen}
        onClose={() => setModalHistoricoOpen(false)}
        paciente={historicoPaciente}
      />

      <ModalAssinatura
        isOpen={isModalAssinaturaOpen}
        onClose={() => setModalAssinaturaOpen(false)}
        onAssinar={() => {
          setModalAssinaturaOpen(false);
          alert('A assinatura foi capturada e o PDF gerado com sucesso!');
        }}
      />
    </>
  );
}
