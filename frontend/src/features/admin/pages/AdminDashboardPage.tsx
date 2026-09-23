import React, { useEffect, useState } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';

export function AdminDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Atualiza a hora a cada 60 segundos para manter sempre a hora atualizada
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(currentDate).toUpperCase();

  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(currentDate);

  useEffect(() => {
    // Import Phosphor Icons se não estiver no index.html
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@phosphor-icons/web';
    document.head.appendChild(script);

    // Chart.js script (se não estiver globalmente disponível, idealmente seria npm install chart.js)
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    chartScript.onload = () => {
      renderCharts();
    };
    document.head.appendChild(chartScript);

    return () => {
      // Limpeza opcional
    };
  }, []);

  const renderCharts = () => {
    // Replicar a lógica de charts do app.js original caso o Chart.js seja carregado via script
    if (typeof window !== 'undefined' && (window as any).Chart) {
      const Chart = (window as any).Chart;
      Chart.defaults.font.family = "'Inter', sans-serif";
      Chart.defaults.color = '#727d89';

      const ctxConv = document.getElementById('convenioChart') as HTMLCanvasElement;
      if (ctxConv) {
        new Chart(ctxConv, {
          type: 'bar',
          data: {
            labels: ['Bradesco', 'SulAmérica', 'Amil', 'Unimed', 'Porto Seguro', 'Cassi'],
            datasets: [{
              data: [42, 35, 25, 20, 15, 6],
              backgroundColor: '#2f695f',
              hoverBackgroundColor: '#1f433d',
              borderRadius: 6,
              maxBarThickness: 38
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#161b21',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: { label: (ctx: any) => `R$ ${ctx.parsed.y} mil` }
              }
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#727d89', font: { family: 'Inter', size: 12 } } },
              y: { grid: { color: '#eceef0' }, border: { display: false }, ticks: { color: '#a9b1ba', font: { family: 'Inter', size: 11 } } }
            }
          }
        });
      }

      const ctxGlosa = document.getElementById('glosaChart') as HTMLCanvasElement;
      if (ctxGlosa) {
        new Chart(ctxGlosa, {
          type: 'doughnut',
          data: {
            labels: ['Corrigidas antes do envio', 'Requerem atenção pós-envio'],
            datasets: [{
              data: [85, 15],
              backgroundColor: ['#2f695f', '#ef4444'],
              borderWidth: 3,
              borderColor: '#ffffff',
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#161b21',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed}%` }
              }
            }
          }
        });
      }
    }
  };

  return (
    <div id="view-dashboard" className="view-section fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold font-heading text-ink-900 tracking-tight">Dashboard executivo</h1>

          {/* Dynamic Date Container */}
          <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 bg-white border border-ink-100 rounded-full shadow-sm text-sm text-ink-500 font-medium">
            <i className="ph ph-calendar-blank text-brand-600"></i>
            <span className="capitalize">{formattedDate}</span>
            <span className="w-1 h-1 rounded-full bg-ink-200"></span>
            <i className="ph ph-clock text-brand-600"></i>
            <span>{formattedTime}</span>
          </div>
        </div>
        <a href="#" className="w-full sm:w-auto justify-center bg-ink-900 hover:bg-ink-800 text-white font-medium py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 group shadow-soft hover:shadow-premium-hover">
          Auditar lotes
          <i className="ph ph-arrow-right group-hover:translate-x-0.5 transition-transform"></i>
        </a>
      </div>

      {/* SOLID KPI CARDS (No borders, premium shadow) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8" id="dashboard-kpis">
        <KpiCard
          title="Faturado no Mês"
          value="R$ 142.850,00"
          subtitle="1.240 guias geradas"
          icon="ph-wallet"
          colorScheme="emerald"
          badgeText="+12%"
          badgeIcon="ph-trend-up"
          animationDelay="0ms"
        />

        <KpiCard
          title="Aprovado Orizon"
          value="R$ 124.300,00"
          progressPercentage={87}
          icon="ph-check-circle"
          colorScheme="brand"
          badgeText="87% do total"
          badgeIcon="ph-check"
          animationDelay="100ms"
        />

        <KpiCard
          title="Retido em Erros"
          value="R$ 18.550,00"
          subtitle="Requer correção no lote"
          subtitleColor="text-red-500"
          icon="ph-warning-circle"
          colorScheme="red"
          badgeText="-3% vs mês ant."
          badgeIcon="ph-trend-down"
          animationDelay="200ms"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-5 sm:p-7 rounded-[20px] shadow-card">
          <div className="flex justify-between items-start mb-6 sm:mb-7">
            <div>
              <h3 className="text-base font-semibold font-heading text-ink-900">Volume financeiro por convênio</h3>
              <p className="text-xs text-ink-400 mt-1">Valores faturados no mês, em milhares de reais</p>
            </div>
            <button className="text-ink-300 hover:text-ink-600 transition-colors"><i className="ph ph-dots-three-bold text-xl"></i></button>
          </div>
          <div className="relative h-64 sm:h-72 w-full"><canvas id="convenioChart"></canvas></div>
        </div>

        <div className="bg-white p-5 sm:p-7 rounded-[20px] shadow-card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base font-semibold font-heading text-ink-900">Glosas evitadas</h3>
              <p className="text-xs text-ink-400 mt-1">Auditoria prévia TISS</p>
            </div>
            <button className="text-ink-300 hover:text-ink-600 transition-colors"><i className="ph ph-dots-three-bold text-xl"></i></button>
          </div>
          <div className="relative h-48 sm:h-52 flex justify-center items-center w-full mt-4 sm:mt-0">
            <canvas id="glosaChart"></canvas>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" id="glosa-center">
              <span className="text-[32px] font-bold font-heading text-ink-900 leading-none">85%</span>
              <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-widest mt-1">Recuperado</span>
            </div>
          </div>
          <div className="mt-5 space-y-3 pt-5 border-t border-ink-100" id="glosa-legend">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2f695f]"></span>
                <span className="text-ink-500">Corrigidas antes do envio</span>
              </div>
              <span className="font-medium text-ink-800">85%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                <span className="text-ink-500">Requerem atenção pós-envio</span>
              </div>
              <span className="font-medium text-ink-800">15%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
