import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'error' | null;

interface ForgotPasswordAlertProps {
  alert: { message: string; type: AlertType };
}

export function ForgotPasswordAlert({ alert }: ForgotPasswordAlertProps) {
  if (!alert.type) return null;

  return (
    <div className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-3 transition-all duration-200 fade-in
      ${alert.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 
        alert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
        'bg-brand-50 text-brand-800 border-brand-200'}`}
    >
      {alert.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
      {alert.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
      {alert.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
      <span>{alert.message}</span>
    </div>
  );
}
