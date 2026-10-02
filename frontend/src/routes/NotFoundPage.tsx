import React from 'react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center p-6 fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-premium border border-ink-200 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
          <i className="ph ph-traffic-cone text-4xl text-brand-600"></i>
        </div>
        
        <h1 className="text-3xl font-bold font-heading text-ink-950 mb-3 tracking-tight">
          Página em Construção
        </h1>
        
        <p className="text-ink-500 mb-8 leading-relaxed text-sm">
          A rota que você tentou acessar ainda não foi desenvolvida ou não está disponível no momento. 
          Nossa equipe está trabalhando para liberar novas funcionalidades em breve!
        </p>

        <button 
          onClick={() => navigate(-1)} 
          className="w-full h-12 bg-ink-900 hover:bg-ink-800 text-white rounded-xl font-medium transition-all shadow-soft flex items-center justify-center gap-2"
        >
          <i className="ph ph-arrow-left text-lg"></i>
          Voltar para a página anterior
        </button>
      </div>
      
      <div className="mt-8 text-ink-400 text-xs font-medium tracking-wide">
        CLÍNICA ELMAN &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
