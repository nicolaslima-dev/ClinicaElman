import { useState } from 'react';
import type { AuditoriaGuia } from '@/features/admin/types';
import { AuditoriaHeader } from '../components/auditoria/AuditoriaHeader';
import { AuditoriaFiltros } from '../components/auditoria/AuditoriaFiltros';
import { AuditoriaTable } from '../components/auditoria/AuditoriaTable';
import { AuditoriaDrawer } from '../components/auditoria/AuditoriaDrawer';

const mockInicial: AuditoriaGuia[] = [
  { id: '1', data: '2026-06-15T00:00:00Z', paciente: 'Ana Paula Santos', convenio: 'BRADESCO', status: 'pendente', erro: 'CID obrigatório não informado.' },
  { id: '2', data: '2026-06-16T00:00:00Z', paciente: 'Marcos Vinicius', convenio: 'SULAMERICA', status: 'pendente', erro: 'Código do procedimento incompatível com a idade.' },
  { id: '3', data: '2026-06-18T00:00:00Z', paciente: 'Lúcia Helena', convenio: 'UNIMED', status: 'pendente', erro: 'Matrícula do beneficiário inválida.' },
];

export function AdminAuditoriaPage() {
  const [guias, setGuias] = useState<AuditoriaGuia[]>(mockInicial);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState<AuditoriaGuia | null>(null);

  const [convenio, setConvenio] = useState('');
  const [competencia, setCompetencia] = useState('2026-06');

  const pendentesCount = guias.filter(g => g.status === 'pendente').length;

  const restaurarTestes = () => {
    setGuias(mockInicial);
  };

  const abrirDrawer = (guia: AuditoriaGuia) => {
    setSelectedGuia(guia);
    setIsDrawerOpen(true);
  };

  const fecharDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedGuia(null), 300); // Wait for transition
  };

  const salvarCorrecao = () => {
    if (selectedGuia) {
      setGuias(prev => prev.map(g => g.id === selectedGuia.id ? { ...g, status: 'corrigido' } : g));
      fecharDrawer();
    }
  };

  // Filter guias
  const guiasFiltradas = guias.filter(g => {
    if (convenio && g.convenio !== convenio) return false;
    // Assuming simple competence match based on YYYY-MM
    if (competencia && !g.data.startsWith(competencia)) return false;
    return true;
  });

  return (
    <div id="view-auditoria" className="view-section fade-in max-w-6xl mx-auto flex flex-col h-full min-h-[700px]">
      <AuditoriaHeader 
        pendentesCount={pendentesCount} 
        onRestaurar={restaurarTestes} 
      />

      <AuditoriaFiltros 
        convenio={convenio} 
        setConvenio={setConvenio} 
        competencia={competencia} 
        setCompetencia={setCompetencia} 
      />

      <AuditoriaTable 
        guias={guiasFiltradas} 
        onAbrirDrawer={abrirDrawer} 
      />

      <AuditoriaDrawer 
        isOpen={isDrawerOpen} 
        guia={selectedGuia} 
        onClose={fecharDrawer} 
        onSalvar={salvarCorrecao} 
      />
    </div>
  );
}
