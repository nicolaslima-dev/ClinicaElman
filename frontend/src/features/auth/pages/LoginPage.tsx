import { useState } from 'react';
import { HelpCircle, ShieldCheck } from 'lucide-react';
import { InstitutionalSidePanel } from '../components/InstitutionalSidePanel';
import { LoginForm } from '../components/LoginForm';
import { PasswordRecoveryModal } from '../components/PasswordRecoveryModal';

export function LoginPage() {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const openPasswordRecovery = (email: string) => {
    setRecoveryEmail(email);
    setShowRecoveryModal(true);
  };

  const closePasswordRecovery = () => {
    setShowRecoveryModal(false);
  };

  const showHelpInfo = () => {
    alert('Para suporte ou liberação de novos perfis médicos, contate a TI Interna no ramal 4022.');
  };

  return (
    <div className="h-full w-full bg-white text-ink-800 antialiased overflow-x-hidden">
      <div className="min-h-screen w-full flex flex-col lg:flex-row">
        
        <InstitutionalSidePanel />

        <main className="w-full lg:w-7/12 xl:w-7/12 flex-1 flex flex-col justify-between bg-white px-6 sm:px-12 md:px-16 lg:px-20 xl:px-28 py-10 lg:py-14">
          
          {/* Top Right Bar */}
          <div className="flex items-center justify-between lg:justify-end gap-3 w-full pb-4">
            <div className="lg:hidden flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-brand-900 text-brand-200 flex items-center justify-center font-heading font-bold text-sm">E</span>
              <span className="font-heading font-bold text-ink-900 tracking-tight text-sm">Clínica Elman</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={showHelpInfo}
                className="text-xs font-medium text-ink-500 hover:text-brand-700 transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-full border border-ink-100 hover:border-brand-200 bg-white"
              >
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <span>Central de Suporte</span>
              </button>

            </div>
          </div>

          <LoginForm onOpenRecovery={openPasswordRecovery} />

          {/* Bottom Footer */}
          <footer className="w-full pt-6 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
            <p className="text-center sm:text-left leading-relaxed">
              Acesso monitorado. Uso restrito a colaboradores autorizados da <strong>Clínica Elman</strong> sob termos da LGPD médica.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> SSL 256-bit
              </span>

            </div>
          </footer>
        </main>
      </div>

      <PasswordRecoveryModal 
        isOpen={showRecoveryModal} 
        onClose={closePasswordRecovery} 
        initialEmail={recoveryEmail} 
      />
    </div>
  );
}
