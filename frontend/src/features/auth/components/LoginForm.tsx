import { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.service';

type AlertType = 'info' | 'success' | 'error' | null;

interface LoginFormProps {
  onOpenRecovery: (email: string) => void;
}

export function LoginForm({ onOpenRecovery }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: AlertType }>({ message: '', type: null });

  const togglePassword = () => setShowPassword(!showPassword);



  const navigate = useNavigate();

  const processLogin = async (event: FormEvent) => {
    event.preventDefault();

    if (!username || !password) {
      setAlert({ message: 'Por favor, preencha o usuário e a senha.', type: 'error' });
      return;
    }

    setIsLoading(true);

    const { error } = await login(username, password);

    setIsLoading(false);

    if (error) {
      setAlert({ message: error.message, type: 'error' });
      return;
    }

    setAlert({ message: 'Autenticação autorizada! Redirecionando para o painel...', type: 'success' });

    setTimeout(() => {
      navigate('/');
    }, 800);
  };

  return (
    <div className="w-full max-w-lg mx-auto my-auto py-8 fade-in">
      <div className="mb-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink-900 tracking-tight">
          Identificação
        </h2>
        <p className="text-sm sm:text-base text-ink-400 mt-2 leading-relaxed">
          Informe suas credenciais institucionais para gerenciar faturamentos, auditorias e atendimentos.
        </p>
      </div>

      {/* Toast / Status alert */}
      {alert.type && (
        <div className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-3 transition-all duration-200 ${alert.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          alert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            'bg-brand-50 text-brand-800 border-brand-200'
          }`}>
          {alert.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
          {alert.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
          {alert.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* The Form */}
      <form onSubmit={processLogin} className="space-y-6">

        {/* Username/Email */}
        <div>
          <label htmlFor="usernameInput" className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
            Usuário ou E-mail Corporativo
          </label>
          <div className="input-pill flex items-center px-4 py-3.5 rounded-xl">
            <User className="w-5 h-5 text-ink-400 mr-3 shrink-0" />
            <input
              type="text"
              id="usernameInput"
              name="username"
              required
              autoComplete="username"
              placeholder="ex: ilsa.carla@clinicaelman.com.br"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="passwordInput" className="block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Senha de Acesso
            </label>
            <button
              type="button"
              onClick={() => onOpenRecovery(username)}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors focus:outline-none"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="input-pill flex items-center px-4 py-3.5 rounded-xl relative">
            <Lock className="w-5 h-5 text-ink-400 mr-3 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="passwordInput"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Digite sua senha institucional"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base text-ink-900 placeholder:text-ink-300 focus:outline-none pr-10"
            />
            <button
              type="button"
              onClick={togglePassword}
              title="Mostrar ou ocultar senha"
              className="absolute right-3.5 text-ink-400 hover:text-ink-700 transition-colors focus:outline-none p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
            />
            <span className="text-xs sm:text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors">
              Manter sessão ativa por 30 dias
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-ink-900 hover:bg-brand-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm hover:shadow-brand-glow group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600"
          >
            {isLoading ? (
              <>
                <span>Validando credenciais...</span>
                <Loader2 className="w-5 h-5 animate-spin" />
              </>
            ) : (
              <>
                <span>Acessar</span>
                <ArrowRight className="w-5 h-5 text-gold-400 group-hover:translate-x-1.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>


    </div>
  );
}
