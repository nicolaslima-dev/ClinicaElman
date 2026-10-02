import React, { useState, useEffect } from 'react';
import type { GuiaFaturamento } from '@/features/admin/types';
import { FaturamentoHeader } from '../components/faturamento/FaturamentoHeader';
import { FaturamentoFiltros } from '../components/faturamento/FaturamentoFiltros';
import { FaturamentoTable } from '../components/faturamento/FaturamentoTable';
import { FaturamentoModalGeracao } from '../components/faturamento/FaturamentoModalGeracao';

export function AdminFaturamentoPage() {
  const [loading, setLoading] = useState(true);
  const [guias, setGuias] = useState<GuiaFaturamento[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalGeracaoOpen, setIsModalGeracaoOpen] = useState(false);
  const [convenio, setConvenio] = useState('');

  useEffect(() => {
    // Simulate fetching
    setLoading(true);
    setTimeout(() => {
      const mockGuias: GuiaFaturamento[] = [
        { id: '1', data: '2026-07-15T00:00:00Z', paciente: 'João Silva', convenio: 'BRADESCO', matricula: '99881122', statusAuditoria: 'validado', valorTotal: 350.0 },
        { id: '2', data: '2026-07-16T00:00:00Z', paciente: 'Maria Souza', convenio: 'SULAMERICA', matricula: '11223344', statusAuditoria: 'validado', valorTotal: 150.0 },
        { id: '3', data: '2026-07-18T00:00:00Z', paciente: 'Carlos Pereira', convenio: 'BRADESCO', matricula: '55667788', statusAuditoria: 'validado', valorTotal: 500.0 },
      ];
      setGuias(mockGuias);
      // Select all by default
      setSelectedIds(new Set(mockGuias.map(g => g.id)));
      setLoading(false);
    }, 1000);
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(guias.map(g => g.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const guiasSelecionadas = guias.filter(g => selectedIds.has(g.id));
  const valorTotalLote = guiasSelecionadas.reduce((acc, curr) => acc + curr.valorTotal, 0);

  const abrirModalGeracao = () => {
    if (!convenio) {
      alert('Selecione um convênio específico para gerar o lote Orizon.');
      return;
    }
    if (guiasSelecionadas.length === 0) {
      alert('Selecione ao menos uma guia para gerar o XML.');
      return;
    }
    const hasPendente = guiasSelecionadas.some(g => g.statusAuditoria !== 'validado');
    if (hasPendente) {
      alert('As guias selecionadas contêm pendências na auditoria. Todas as guias precisam estar no status "Validado TISS" para geração.');
      return;
    }
    setIsModalGeracaoOpen(true);
  };

  const fecharModalGeracao = () => {
    setIsModalGeracaoOpen(false);
  };

  const confirmarGeracaoXML = () => {
    setIsModalGeracaoOpen(false);
    alert('Download do XML efetuado com sucesso!');
    // Update local state to mock processing
    setGuias(guias.filter(g => !selectedIds.has(g.id)));
    setSelectedIds(new Set());
  };

  return (
    <div id="view-faturamento" className="view-section fade-in max-w-6xl mx-auto flex flex-col h-full min-h-[700px]">

      <FaturamentoHeader
        onImprimir={() => window.print()}
        onGerarLote={abrirModalGeracao}
      />

      <FaturamentoFiltros
        convenio={convenio}
        setConvenio={setConvenio}
      />

      <FaturamentoTable
        loading={loading}
        guias={guias}
        selectedIds={selectedIds}
        handleSelectAll={handleSelectAll}
        handleSelectOne={handleSelectOne}
        valorTotalLote={valorTotalLote}
      />

      <FaturamentoModalGeracao
        isOpen={isModalGeracaoOpen}
        onClose={fecharModalGeracao}
        onConfirm={confirmarGeracaoXML}
      />

    </div>
  );
}
