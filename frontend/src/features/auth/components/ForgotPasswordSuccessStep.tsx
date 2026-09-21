import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function ForgotPasswordSuccessStep() {
  return (
    <div className="fade-in text-center py-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
        <CheckCircle className="w-10 h-10" />
      </div>

      <h3 className="text-2xl font-heading font-bold text-ink-900 mb-2">
        Senha Atualizada!
      </h3>
      <p className="text-sm text-ink-500 max-w-sm mx-auto mb-8 leading-relaxed">
        Sua credencial de acesso ao painel executivo da Clínica Elman foi redefinida com êxito. Você já pode autenticar normalmente.
      </p>

      <Link 
        to="/login"
        className="w-full inline-flex items-center justify-center gap-2 bg-ink-900 hover:bg-brand-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-brand-glow group"
      >
        <span>Acessar Login Executivo</span>
        <ArrowRight className="w-5 h-5 text-gold-400 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
