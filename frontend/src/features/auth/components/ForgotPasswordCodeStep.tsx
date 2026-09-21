import { type FormEvent, type KeyboardEvent, type MutableRefObject } from 'react';
import { CheckCircle } from 'lucide-react';

interface ForgotPasswordCodeStepProps {
  pin: string[];
  pinRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  countdown: number;
  canResend: boolean;
  onPinChange: (index: number, value: string) => void;
  onPinKeyDown: (index: number, e: KeyboardEvent<HTMLInputElement>) => void;
  onResend: () => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function ForgotPasswordCodeStep({
  pin,
  pinRefs,
  countdown,
  canResend,
  onPinChange,
  onPinKeyDown,
  onResend,
  onBack,
  onSubmit
}: ForgotPasswordCodeStepProps) {
  return (
    <div className="fade-in">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
            Código de Verificação (6 dígitos)
          </label>
          
          <div className="flex items-center justify-between gap-2 sm:gap-3 py-2">
            {pin.map((digit, idx) => (
              <input 
                key={idx}
                ref={el => { pinRefs.current[idx] = el; }}
                type="text" 
                maxLength={1} 
                value={digit}
                onChange={(e) => onPinChange(idx, e.target.value)}
                onKeyDown={(e) => onPinKeyDown(idx, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border border-ink-200 bg-ink-50 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 rounded-xl transition-all outline-none"
                inputMode="numeric"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-ink-400">Não recebeu o código?</span>
            <button 
              type="button" 
              onClick={onResend}
              disabled={!canResend}
              className={`font-semibold transition-colors ${canResend ? 'text-brand-700 hover:text-brand-900' : 'text-ink-300 cursor-not-allowed'}`}
            >
              Reenviar {countdown > 0 ? `em ${countdown}s` : 'Agora'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            type="button" 
            onClick={onBack}
            className="w-full sm:w-1/3 py-3.5 px-4 rounded-xl border border-ink-200 text-ink-700 font-semibold text-sm hover:bg-ink-50 transition-colors"
          >
            Alterar E-mail
          </button>
          <button 
            type="submit"
            className="w-full sm:w-2/3 bg-ink-900 hover:bg-brand-900 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 group shadow-sm hover:shadow-brand-glow"
          >
            <span>Validar Código</span>
            <CheckCircle className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </form>


    </div>
  );
}
