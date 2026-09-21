import { type FormEvent } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, Save } from 'lucide-react';

interface ForgotPasswordPasswordStepProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  hasLength: boolean;
  hasNumber: boolean;
  hasUpper: boolean;
  onSubmit: (e: FormEvent) => void;
}

export function ForgotPasswordPasswordStep({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  hasLength,
  hasNumber,
  hasUpper,
  onSubmit
}: ForgotPasswordPasswordStepProps) {
  return (
    <div className="fade-in">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
            Nova Senha Institucional
          </label>
          <div className="input-pill flex items-center px-4 py-3.5 rounded-xl relative">
            <Lock className="w-5 h-5 text-ink-400 mr-3 shrink-0" />
            <input 
              type={showNewPassword ? 'text' : 'password'}
              required 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className="w-full bg-transparent text-sm sm:text-base text-ink-900 placeholder:text-ink-300 focus:outline-none pr-10"
            />
            <button 
              type="button" 
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 text-ink-400 hover:text-ink-700 p-1"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
            Confirmar Nova Senha
          </label>
          <div className="input-pill flex items-center px-4 py-3.5 rounded-xl relative">
            <Lock className="w-5 h-5 text-ink-400 mr-3 shrink-0" />
            <input 
              type={showConfirmPassword ? 'text' : 'password'}
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-transparent text-sm sm:text-base text-ink-900 placeholder:text-ink-300 focus:outline-none pr-10"
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 text-ink-400 hover:text-ink-700 p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-ink-50/70 border border-ink-100 text-xs space-y-1.5">
          <p className="font-semibold text-ink-700 mb-2">Critérios de segurança hospitalar:</p>
          <div className={`flex items-center gap-2 ${hasLength ? 'text-emerald-700 font-medium' : 'text-ink-500'}`}>
            {hasLength ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-ink-300 ml-1 mr-1" />}
            <span>Pelo menos 8 caracteres</span>
          </div>
          <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-ink-500'}`}>
            {hasNumber ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-ink-300 ml-1 mr-1" />}
            <span>Pelo menos 1 número</span>
          </div>
          <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-ink-500'}`}>
            {hasUpper ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-ink-300 ml-1 mr-1" />}
            <span>Pelo menos 1 letra maiúscula</span>
          </div>
        </div>

        <div className="pt-2">
          <button 
            type="submit"
            className="w-full bg-ink-900 hover:bg-brand-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm hover:shadow-brand-glow group active:scale-[0.99]"
          >
            <span>Salvar Nova Senha</span>
            <Save className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
