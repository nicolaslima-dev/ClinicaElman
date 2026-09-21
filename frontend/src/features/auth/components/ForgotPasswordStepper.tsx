import { CheckCircle2, Key } from 'lucide-react';

interface ForgotPasswordStepperProps {
  step: number;
  email: string;
}

export function ForgotPasswordStepper({ step, email }: ForgotPasswordStepperProps) {
  if (step >= 4) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-xs mb-6">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center transition-all ${step >= 1 ? 'bg-brand-800' : 'bg-ink-100 text-ink-400'}`}>
            {step > 1 ? <CheckCircle2 className="w-4 h-4 text-white" /> : '1'}
          </span>
          <span className="text-xs font-medium text-ink-800">E-mail</span>
        </div>
        <div className={`h-[2px] flex-1 mx-2 ${step > 1 ? 'bg-brand-800' : 'bg-ink-100'}`}></div>
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${step >= 2 ? (step > 2 ? 'bg-brand-800 text-white' : 'bg-brand-800 text-white') : 'bg-ink-100 text-ink-400'}`}>
            {step > 2 ? <CheckCircle2 className="w-4 h-4 text-white" /> : '2'}
          </span>
          <span className={`text-xs font-medium ${step >= 2 ? 'text-ink-900' : 'text-ink-400'}`}>Código</span>
        </div>
        <div className={`h-[2px] flex-1 mx-2 ${step > 2 ? 'bg-brand-800' : 'bg-ink-100'}`}></div>
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${step >= 3 ? 'bg-brand-800 text-white' : 'bg-ink-100 text-ink-400'}`}>3</span>
          <span className={`text-xs font-medium ${step >= 3 ? 'text-ink-900' : 'text-ink-400'}`}>Senha</span>
        </div>
      </div>

      {step > 1 && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-800 border border-brand-100 mb-3">
          <Key className="w-4 h-4 text-brand-600" />
          <span>
            {step === 2 && 'Validação em Duas Etapas'}
            {step === 3 && 'Nova Credencial'}
          </span>
        </div>
      )}

      <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink-900 tracking-tight">
        {step === 1 && 'Esqueceu sua senha?'}
        {step === 2 && 'Verificação de Segurança'}
        {step === 3 && 'Criar Nova Senha'}
      </h2>
      <p className="text-sm sm:text-base text-ink-400 mt-2 leading-relaxed">
        {step === 1 && 'Informe o e-mail cadastrado ou usuário corporativo para enviarmos um token de autorização.'}
        {step === 2 && `Insira o código de 6 dígitos enviado para ${email || 'seu e-mail institucional'}.`}
        {step === 3 && 'Cadastre uma nova senha institucional de alta complexidade em conformidade com as regras hospitalares.'}
      </p>
    </div>
  );
}
