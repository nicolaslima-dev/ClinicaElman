// --- ESTADO GLOBAL (MOCK SUPABASE com LocalStorage) ---
function getInitialState() {
    const saved = localStorage.getItem('clinica_elman_state');
    if (saved) return JSON.parse(saved);
    
    return {
        kpis: { faturado: 142850, aprovado: 124300, retido: 18550 },
        auditorias: [
            { id: 1, data: '01/06/2026', paciente: 'Ana Maria da Silva', convenio: 'CASSI', proc: '50000250 (Tab 22)', valor: 74.02, status: 'erro', mensagem: 'Profissional CBO Fisioterapia faturado sob CRM. Matrícula exige 14 dígitos.' },
            { id: 2, data: '02/06/2026', paciente: 'João Pedro Costa', convenio: 'BRADESCO', proc: '10101012 (Cons)', valor: 120.00, status: 'erro', mensagem: 'Ausência de senha de autorização para o procedimento.' },
            { id: 3, data: '03/06/2026', paciente: 'Maria Eduarda', convenio: 'SULAMERICA', proc: '20104097', valor: 350.50, status: 'erro', mensagem: 'Data de validade da carteira expirada.' }
        ]
    };
}

const state = getInitialState();
const charts = { convenio: null, glosa: null };
let activeAuditoriaId = null;

function saveState() {
    localStorage.setItem('clinica_elman_state', JSON.stringify({
        kpis: state.kpis,
        auditorias: state.auditorias
    }));
}

// --- UTILITÁRIOS ---
const formatCurrency = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

// --- RENDERIZADORES DINÂMICOS (PREP PARA BACKEND) ---
async function fetchAndRenderDashboard() {
    const kpisContainer = document.getElementById('dashboard-kpis');
    if (!kpisContainer) return;
    
    const cardsHtml = `
        <div class="glass-card p-6 rounded-2xl shadow-soft relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="bg-slate-100 p-2.5 rounded-xl text-slate-500"><i class="ph ph-wallet text-xl"></i></div>
                <span class="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full">+12%</span>
            </div>
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturado no Mês</h3>
            <p class="text-3xl font-black font-heading text-slate-800 mt-1">${formatCurrency(state.kpis.faturado)}</p>
            <p class="text-sm text-slate-400 mt-1 font-medium">1.240 guias geradas</p>
        </div>
        
        <div class="glass-card p-6 rounded-2xl shadow-soft relative overflow-hidden border-l-4 border-brand-500 group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="bg-brand-50 p-2.5 rounded-xl text-brand-600"><i class="ph ph-check-circle text-xl"></i></div>
                <span class="bg-brand-50 text-brand-600 text-xs font-bold px-2.5 py-1 rounded-full">87% do total</span>
            </div>
            <h3 class="text-xs font-bold text-brand-600/70 uppercase tracking-wider">Aprovado Orizon</h3>
            <p class="text-3xl font-black font-heading text-brand-600 mt-1 transition-all duration-500" id="dash-aprovado">${formatCurrency(state.kpis.aprovado)}</p>
            <div class="mt-3 relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="absolute top-0 left-0 h-full bg-brand-500 rounded-full" style="width: 87%"></div>
            </div>
        </div>

        <div class="glass-card p-6 rounded-2xl shadow-soft relative overflow-hidden border-l-4 border-red-500 group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="bg-red-50 p-2.5 rounded-xl text-red-600"><i class="ph ph-warning-circle text-xl"></i></div>
                <span class="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">-3% vs mês anterior</span>
            </div>
            <h3 class="text-xs font-bold text-red-500/70 uppercase tracking-wider">Retido em Erros</h3>
            <p class="text-3xl font-black font-heading text-red-600 mt-1 transition-all duration-500" id="dash-retido">${formatCurrency(state.kpis.retido)}</p>
            <p class="text-sm text-red-500 font-medium mt-1">Requer correção no lote</p>
        </div>
    `;
    kpisContainer.innerHTML = cardsHtml;
}

async function fetchAndRenderAuditorias() {
    const tbody = document.getElementById('tbodyAuditoria');
    const totalErros = state.auditorias.filter(a => a.status === 'erro').length;
    
    // Update badges no sidebar e na tela
    const sidebarBadge = document.getElementById('sidebar-badge-erros');
    if(sidebarBadge) sidebarBadge.textContent = totalErros;
    
    if(!tbody) return; // Só atualiza a tabela se estiver na página de auditoria
    
    const telaBadge = document.getElementById('contador-erros-tela');
    if (telaBadge) {
        if(totalErros > 0) {
            telaBadge.textContent = `${totalErros} Erros Pendentes`;
            telaBadge.parentElement.className = "bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all";
            telaBadge.parentElement.innerHTML = `<i class="ph ph-warning-circle text-lg"></i> <span id="contador-erros-tela">${totalErros} Erros Pendentes</span>`;
        } else {
            telaBadge.textContent = "Tudo validado!";
            telaBadge.parentElement.className = "bg-green-50 border border-green-100 text-green-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all";
            telaBadge.parentElement.innerHTML = `<i class="ph ph-check-circle text-lg"></i> <span id="contador-erros-tela">Tudo validado!</span>`;
        }
    }

    let html = '';
    state.auditorias.forEach(item => {
        const isErro = item.status === 'erro';
        const rowClass = isErro ? 'bg-red-50/30 hover:bg-red-50/60' : 'bg-green-50/30 hover:bg-green-50/60';
        const badgeClass = isErro ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200';
        const badgeText = isErro ? 'Erro Cadastral' : 'Validado';
        const btnHtml = isErro 
            ? `<button onclick="abrirDrawer(${item.id})" class="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold py-1.5 px-4 rounded-lg shadow-sm text-xs transition-all flex items-center gap-1.5 ml-auto"><i class="ph ph-wrench"></i> Corrigir</button>`
            : `<span class="text-slate-400 text-xs font-semibold flex items-center justify-end gap-1"><i class="ph ph-check"></i> Aprovado</span>`;

        html += `
            <tr class="border-b border-slate-100 transition-colors duration-300 ${rowClass}">
                <td class="p-5 text-slate-500">${item.data}</td>
                <td class="p-5 font-bold font-heading text-slate-800">${item.paciente}</td>
                <td class="p-5"><span class="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold shadow-sm">${item.convenio}</span></td>
                <td class="p-5"><span class="px-3 py-1.5 rounded-md text-xs font-bold border shadow-sm flex items-center gap-1.5 w-max ${badgeClass}">${isErro ? '<i class="ph ph-warning-circle"></i>' : '<i class="ph ph-check-circle"></i>'} ${badgeText}</span></td>
                <td class="p-5 text-right">${btnHtml}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// --- MODALS & DRAWERS ---
function abrirModalGeracao() {
    const modal = document.getElementById('modalConfirmacao');
    const box = document.getElementById('modalBox');
    if(!modal) return;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    box.classList.remove('scale-95', 'opacity-0');
    box.classList.add('scale-100', 'opacity-100');
}

function fecharModalGeracao() {
    const modal = document.getElementById('modalConfirmacao');
    const box = document.getElementById('modalBox');
    if(!modal) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    box.classList.remove('scale-100', 'opacity-100');
    box.classList.add('scale-95', 'opacity-0');
}

function confirmarGeracaoXML() {
    fecharModalGeracao();
    setTimeout(() => {
        window.location.href = 'auditoria.html';
    }, 300);
}

function abrirDrawer(id) {
    activeAuditoriaId = id;
    const item = state.auditorias.find(a => a.id === id);
    
    const drawerContent = document.getElementById('drawerContent');
    drawerContent.innerHTML = `
        <div class="mb-6 pb-6 border-b border-slate-100">
            <h3 class="text-xl font-bold font-heading text-slate-800">${item.paciente}</h3>
            <p class="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <span class="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">${item.data}</span> 
                Proc: <strong class="text-slate-700">${item.proc}</strong>
            </p>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-xl p-5 mb-8 shadow-sm">
            <div class="flex items-start gap-3">
                <div class="bg-red-100 p-2 rounded-full text-red-600 shrink-0"><i class="ph ph-warning text-lg"></i></div>
                <div>
                    <h3 class="text-sm font-bold text-red-800">Rejeição Prevista Orizon</h3>
                    <p class="mt-2 text-sm text-red-700 leading-relaxed">${item.mensagem}</p>
                </div>
            </div>
        </div>

        <form class="space-y-6" onsubmit="event.preventDefault()">
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Conselho do Executante</label>
                <select class="w-full border border-slate-200 rounded-xl shadow-sm p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                    <option value="CRM">CRM - Conselho Regional de Medicina</option>
                    <option value="CREFITO" selected>CREFITO - Conselho Reg. de Fisioterapia</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Matrícula ${item.convenio}</label>
                <input type="text" value="0001234567" class="w-full border border-red-300 rounded-xl shadow-sm p-3 text-sm bg-red-50/50 outline-none transition-all focus:ring-2 focus:ring-red-500" onkeyup="validarMatriculaDrawer(this)">
                <p id="msgMatricula" class="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1"><i class="ph ph-warning-circle"></i> Possui 10 dígitos. Exigido: 14.</p>
            </div>
        </form>
    `;

    document.getElementById('drawerOverlay').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('drawerPanel').classList.remove('translate-x-full');
}

function fecharDrawer() {
    activeAuditoriaId = null;
    const overlay = document.getElementById('drawerOverlay');
    const panel = document.getElementById('drawerPanel');
    if(overlay) overlay.classList.add('opacity-0', 'pointer-events-none');
    if(panel) panel.classList.add('translate-x-full');
}

function validarMatriculaDrawer(input) {
    const msg = document.getElementById('msgMatricula');
    if(input.value.length === 14) {
        input.className = "w-full border rounded-xl shadow-sm p-3 text-sm outline-none transition-all border-brand-400 focus:ring-2 focus:ring-brand-500 bg-brand-50/30 text-brand-900";
        msg.innerHTML = '<i class="ph ph-check-circle"></i> Matrícula válida.';
        msg.className = "mt-2 text-xs font-semibold text-brand-600 flex items-center gap-1";
    } else {
        input.className = "w-full border rounded-xl shadow-sm p-3 text-sm outline-none transition-all border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50/50";
        msg.innerHTML = `<i class="ph ph-warning-circle"></i> Possui ${input.value.length} dígitos. Exigido: 14.`;
        msg.className = "mt-2 text-xs font-semibold text-red-600 flex items-center gap-1";
    }
}

function salvarCorrecao() {
    fecharDrawer();
    
    if (activeAuditoriaId) {
        const item = state.auditorias.find(a => a.id === activeAuditoriaId);
        if(item) {
            item.status = 'validado';
            
            // Transfere o valor de 'retido' para 'aprovado'
            state.kpis.retido -= item.valor;
            state.kpis.aprovado += item.valor;
            
            saveState();

            setTimeout(() => {
                fetchAndRenderAuditorias();
            }, 400); 
        }
    }
}

// --- CHARTS CONFIG ---
function renderCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#94a3b8'; // slate-400
    
    // 1. Bar Chart
    const ctxConv = document.getElementById('convenioChart');
    if(ctxConv) {
        const gradient = ctxConv.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#0d9488'); // brand-600
        gradient.addColorStop(1, '#2dd4bf'); // brand-400

        charts.convenio = new Chart(ctxConv, {
            type: 'bar',
            data: {
                labels: ['CASSI', 'Bradesco', 'Unimed', 'Amil'],
                datasets: [{
                    data: [45000, 38000, 29000, 18500],
                    backgroundColor: gradient,
                    borderRadius: 8,
                    barPercentage: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a', padding: 12, cornerRadius: 8,
                        callbacks: { label: c => 'R$ ' + c.raw.toLocaleString('pt-BR', {minimumFractionDigits: 2}) }
                    }
                },
                scales: {
                    y: { grid: { color: '#f1f5f9', borderDash: [4,4] }, border: {display: false}, ticks: { callback: v => 'R$ ' + (v/1000) + 'k' } },
                    x: { grid: { display: false }, border: {display: false} }
                }
            }
        });
    }

    // 2. Doughnut Chart
    const ctxGlosa = document.getElementById('glosaChart');
    if(ctxGlosa) {
        const labels = ['Cadastro', 'Validade', 'Senha', 'CBO'];
        const colors = ['#f43f5e', '#f97316', '#eab308', '#8b5cf6'];
        
        // Simulação dinâmica basica baseada no total de erros cadastrais 
        const errosPendentes = state.auditorias.filter(a => a.status === 'erro').length;
        const base = errosPendentes > 0 ? 40 : 39; // Se validou 1, diminui
        const dataVals = [base, 30, 20, 10];
        
        charts.glosa = new Chart(ctxGlosa, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: dataVals, backgroundColor: colors, borderWidth: 0, borderRadius: 5, spacing: 3 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { 
                    legend: { display: false },
                    tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 8 }
                }
            }
        });

        // Render custom HTML legend
        const legendHtml = labels.map((label, i) => `
            <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${colors[i]}"></span>
                    <span class="text-slate-600 font-medium">${label}</span>
                </div>
                <span class="font-bold text-slate-800">${dataVals[i]}%</span>
            </div>
        `).join('');
        document.getElementById('glosa-legend').innerHTML = legendHtml;
    }
}

// --- INIT MUNDIAL ---
window.addEventListener('DOMContentLoaded', () => {
    // Atualizar badge do sidebar logo no início em todas as páginas
    const totalErros = state.auditorias.filter(a => a.status === 'erro').length;
    const sidebarBadge = document.getElementById('sidebar-badge-erros');
    if(sidebarBadge) sidebarBadge.textContent = totalErros;

    fetchAndRenderDashboard();
    fetchAndRenderAuditorias();
    renderCharts();
});
