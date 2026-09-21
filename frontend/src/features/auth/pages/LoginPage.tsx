import { useState } from 'react';
import { HelpCircle, ShieldCheck, Unlock } from 'lucide-react';
import { AuthSidePanel } from '../components/AuthSidePanel';
import { AuthTopBar } from '../components/AuthTopBar';
import { AuthFooter } from '../components/AuthFooter';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {

  return (
    <div className="h-full w-full bg-white text-ink-800 antialiased overflow-x-hidden">
      <div className="min-h-screen w-full flex flex-col lg:flex-row">
        
        <AuthSidePanel 
          title="Gestão Médica e Auditoria Integrada"
          description="Plataforma clínica executiva dedicada ao monitoramento de faturamento TISS, conciliação de glosas e repasses médicos."
          highlights={[
            {
              icon: <ShieldCheck className="text-2xl" />,
              iconBgClass: "bg-brand-700/40",
              iconBorderClass: "border-brand-400/30",
              iconTextClass: "text-brand-200",
              title: "Padrão TISS v4.01 e ANS",
              description: "Regras de validação automatizada de guias, lotes e demonstrativos de retorno."
            },
            {
              icon: <Unlock className="text-2xl" />,
              iconBgClass: "bg-gold-500/15",
              iconBorderClass: "border-gold-400/30",
              iconTextClass: "text-gold-400",
              title: "Segurança em Nível Hospitalar",
              description: "Acesso criptografado de ponta a ponta e rastreabilidade total conforme a LGPD."
            }
          ]}
        />

        <main className="w-full lg:w-7/12 xl:w-7/12 flex-1 flex flex-col justify-between bg-white px-6 sm:px-12 md:px-16 lg:px-20 xl:px-28 py-10 lg:py-14">
          
          <AuthTopBar />

          <LoginForm />

          <AuthFooter />
        </main>
      </div>


    </div>
  );
}
