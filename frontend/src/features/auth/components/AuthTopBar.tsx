import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';

interface AuthTopBarProps {
  showBackButton?: boolean;
}

export function AuthTopBar({ showBackButton }: AuthTopBarProps) {
  const showHelpInfo = () => {
    alert('Para suporte ou liberação de novos perfis médicos, contate a TI Interna no ramal 4022.');
  };

  return (
    <div className={`flex items-center justify-between gap-3 w-full pb-4 ${showBackButton ? '' : 'lg:justify-end'}`}>
      {showBackButton ? (
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-600 hover:text-brand-800 transition-colors py-1.5 px-3 rounded-xl hover:bg-brand-50 border border-transparent hover:border-brand-200"
        >
          <ArrowLeft className="w-4 h-4 text-gold-500" />
          <span>Voltar para o Login</span>
        </Link>
      ) : (
        <div className="lg:hidden flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-brand-900 text-brand-200 flex items-center justify-center font-heading font-bold text-sm">E</span>
          <span className="font-heading font-bold text-ink-900 tracking-tight text-sm">Clínica Elman</span>
        </div>
      )}

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
  );
}
