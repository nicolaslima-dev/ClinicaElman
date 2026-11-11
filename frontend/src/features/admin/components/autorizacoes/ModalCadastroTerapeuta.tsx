import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CreateTerapeutaDTO } from '@/features/admin/types';
import { UFS_BRASIL } from '@/features/admin/utils/pacienteValidators';

interface ModalCadastroTerapeutaProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (dados: CreateTerapeutaDTO) => Promise<boolean>;
}

const CONSELHOS_PROFISSIONAIS = [
  { sigla: 'CRP', label: 'CRP - Conselho Regional de Psicologia', cboSugerido: '251510', espSugerida: 'Psicologia / Terapia ABA' },
  { sigla: 'CREFITO', label: 'CREFITO - Fisioterapia e Terapia Ocupacional', cboSugerido: '223605', espSugerida: 'Fisioterapia / Terapia Ocupacional' },
  { sigla: 'CRFa', label: 'CRFa - Conselho Regional de Fonoaudiologia', cboSugerido: '223810', espSugerida: 'Fonoaudiologia' },
  { sigla: 'CRM', label: 'CRM - Conselho Regional de Medicina', cboSugerido: '225125', espSugerida: 'Medicina Clínica / Neurologia' },
  { sigla: 'CRN', label: 'CRN - Conselho Regional de Nutricionistas', cboSugerido: '223710', espSugerida: 'Nutrição Clínica' },
];

export function ModalCadastroTerapeuta({
  isOpen,
  onClose,
  onSalvar,
}: ModalCadastroTerapeutaProps) {
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [conselho, setConselho] = useState('CRP');
  const [numeroConselho, setNumeroConselho] = useState('');
  const [ufConselho, setUfConselho] = useState('RJ');
  const [cbo, setCbo] = useState('251510');
  const [especialidade, setEspecialidade] = useState('Psicologia / Terapia ABA');
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrocarConselho = (novaSigla: string) => {
    setConselho(novaSigla);
    const info = CONSELHOS_PROFISSIONAIS.find(c => c.sigla === novaSigla);
    if (info) {
      setCbo(info.cboSugerido);
      setEspecialidade(info.espSugerida);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !numeroConselho.trim() || !cbo.trim()) {
      setErro('Preencha o nome do terapeuta, número do conselho e código CBO.');
      return;
    }

    setSalvando(true);
    const ok = await onSalvar({
      nome: nome.trim(),
      email: email.trim() || null,
      conselho,
      numero_conselho: numeroConselho.trim(),
      uf_conselho: ufConselho,
      cbo: cbo.trim(),
      especialidade: especialidade.trim(),
    });
    setSalvando(false);

    if (ok) {
      setNome('');
      setEmail('');
      setNumeroConselho('');
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto fade-in"
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-ink-100 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <i className="ph ph-stethoscope text-base sm:text-xl"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold font-heading text-ink-900 leading-snug break-words">
                Cadastrar Terapeuta
              </h3>
              <p className="text-[11px] sm:text-xs text-ink-500 leading-tight mt-0.5">
                Profissional habilitado para Autorizações e Guias TISS.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 bg-ink-50 hover:bg-ink-100 rounded-full p-2 transition-colors shrink-0 cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">
              Nome do Terapeuta / Profissional <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Dra. Camila Menezes"
              className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">
              E-mail de Acesso (vínculo com login do Portal do Terapeuta)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ex: camila.menezes@clinicaelman.com.br"
              className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Conselho</label>
              <select
                value={conselho}
                onChange={e => handleTrocarConselho(e.target.value)}
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
              >
                {CONSELHOS_PROFISSIONAIS.map(c => (
                  <option key={c.sigla} value={c.sigla}>
                    {c.sigla}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Nº Conselho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroConselho}
                onChange={e => setNumeroConselho(e.target.value)}
                placeholder="Ex: 05/68412"
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">UF</label>
              <select
                value={ufConselho}
                onChange={e => setUfConselho(e.target.value)}
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
              >
                {UFS_BRASIL.map(uf => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Código CBO (TISS) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cbo}
                onChange={e => setCbo(e.target.value)}
                placeholder="Ex: 251510"
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm font-mono text-ink-900 outline-none focus:bg-white focus:border-brand-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Especialidade</label>
              <input
                type="text"
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                placeholder="Ex: Psicologia / ABA"
                className="w-full bg-ink-50 border border-ink-200 rounded-xl p-2.5 text-sm text-ink-900 outline-none focus:bg-white focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-ink-50 border-t border-ink-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-ink-600 bg-white border border-ink-200 hover:bg-ink-50 transition-colors text-center cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-ink-900 hover:bg-ink-800 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-soft cursor-pointer"
          >
            <i className="ph ph-check-circle text-brand-300 text-base sm:text-lg"></i>
            {salvando ? 'Salvando...' : 'Salvar Terapeuta'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

