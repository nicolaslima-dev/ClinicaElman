import { type FormEvent } from 'react';
import { Mail, Send } from 'lucide-react';

interface ForgotPasswordEmailStepProps {
  email: string;
  setEmail: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function ForgotPasswordEmailStep({ email, setEmail, onSubmit }: ForgotPasswordEmailStepProps) {
  return (
    <div className="fade-in">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
            E-mail Institucional ou Usuário
          </label>
          <div className="input-pill flex items-center px-4 py-3.5 rounded-xl">
            <Mail className="w-5 h-5 text-ink-400 mr-3 shrink-0" />
            <input 
              type="text" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: ilsa.carla@clinicaelman.com.br"
              className="w-full bg-transparent text-sm sm:text-base text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-ink-400 mt-1.5">
            O token de liberação será enviado exclusivamente ao endereço homologado da clínica.
          </p>
        </div>

        <div>
          <button 
            type="submit"
            className="w-full bg-ink-900 hover:bg-brand-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm hover:shadow-brand-glow group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600"
          >
            <span>Enviar Código de Validação</span>
            <Send className="w-5 h-5 text-gold-400 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </form>


    </div>
  );
}
