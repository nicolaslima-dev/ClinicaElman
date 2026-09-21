import { useState, useEffect, type FormEvent } from 'react';
import { Key, X, Mail, Send, Check } from 'lucide-react';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail: string;
}

export function PasswordRecoveryModal({ isOpen, onClose, initialEmail }: PasswordRecoveryModalProps) {
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecoveryEmail(initialEmail);
      setRecoveryFeedback(null);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const submitRecoveryRequest = (event: FormEvent) => {
    event.preventDefault();
    setRecoveryFeedback(`Instâncias de validação enviadas para ${recoveryEmail}.`);

    setTimeout(() => {
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-7 sm:p-8 shadow-2xl border border-ink-100 fade-in">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-900">Recuperação de Acesso</h3>
              <p className="text-[11px] text-ink-400">Protocolo seguro de redefinição</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-ink-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-ink-500 mb-6 leading-relaxed">
          Por políticas de proteção aos prontuários e auditorias TISS, a nova credencial temporária será remetida
          somente ao e-mail institucional corporativo homologado.
        </p>

        <form onSubmit={submitRecoveryRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
              E-mail Institucional Cadastrado
            </label>
            <div className="input-pill flex items-center px-4 py-3 rounded-xl">
              <Mail className="w-5 h-5 text-ink-400 mr-3" />
              <input 
                type="email" 
                required 
                placeholder="seu.nome@clinicaelman.com.br"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none"
              />
            </div>
          </div>

          {recoveryFeedback && (
            <div className="text-xs p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2.5 fade-in">
              <Check className="w-4 h-4" /> 
              <span>
                Instâncias de validação enviadas para <strong>{recoveryEmail}</strong>.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Token</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
