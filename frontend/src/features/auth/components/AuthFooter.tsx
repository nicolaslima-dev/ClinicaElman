import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

interface AuthFooterProps {
  showLoginLink?: boolean;
}

export function AuthFooter({ showLoginLink }: AuthFooterProps) {
  return (
    <footer className="w-full pt-6 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
      <p className="text-center sm:text-left leading-relaxed">
        Acesso monitorado. Uso restrito a colaboradores autorizados da <strong>Clínica Elman</strong> sob termos da LGPD médica.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> SSL 256-bit
        </span>
        {showLoginLink && (
          <>
            <span>•</span>
            <Link to="/login" className="hover:text-brand-700 transition-colors font-medium">Voltar ao Login</Link>
          </>
        )}
      </div>
    </footer>
  );
}
