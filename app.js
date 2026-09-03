// --- CONFIGURAÇÃO SUPABASE ---
let supabaseClient = null;
try {
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        throw new Error("As variáveis do .env não foram carregadas. O navegador pode ter bloqueado o arquivo .env devido ao MIME type ou erro 404.");
    }
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
    console.error("Falha ao inicializar Supabase:", err);
    window.addEventListener('DOMContentLoaded', () => {
        mostrarToast('Erro Crítico', err.message, 'error', 10000);
    });
}

// --- ESTADO GLOBAL (Integração Supabase) ---
let state = {
    kpis: { faturado: 0, aprovado: 0, retido: 0 },
    auditorias: [],
    chartsData: { convenios: [], glosas: [] }
};
const charts = { convenio: null, glosa: null };
let activeAuditoriaId = null;

async function loadStateFromSupabase() {
    try {
        if (!supabaseClient) throw new Error("Supabase não inicializado devido a erro no .env");
        const { data: kpisData, error: kpisError } = await supabaseClient.from('kpis').select('*').single();
        if (kpisError) throw kpisError;

        const { data: audData, error: audError } = await supabaseClient.from('auditorias').select('*').order('id', { ascending: true });
        if (audError) throw audError;

        const { data: convData, error: convError } = await supabaseClient.from('dashboard_convenios').select('*').order('ordem', { ascending: true });
        if (convError && convError.code !== '42P01') console.error(convError);

        const { data: glosaData, error: glosaError } = await supabaseClient.from('dashboard_glosas').select('*').order('ordem', { ascending: true });
        if (glosaError && glosaError.code !== '42P01') console.error(glosaError);

        if (kpisData) {
            state.kpis = {
                faturado: kpisData.faturado,
                aprovado: kpisData.aprovado,
                retido: kpisData.retido
            };
        }
        
        if (convData) {
            state.chartsData.convenios = convData;
        }

        if (glosaData) {
            state.chartsData.glosas = glosaData;
        }

        if (audData) {
            state.auditorias = audData.map(item => ({
                id: item.id,
                data: item.data,
                paciente: item.paciente,
                convenio: item.convenio,
                proc: item.proc,
                valor: item.valor,
                status: item.status,
                tipoErro: item.tipo_erro,
                mensagem: item.mensagem,
                conselhoAtual: item.conselho_atual,
                matriculaAtual: item.matricula_atual,
                senhaAtual: item.senha_atual,
                validadeAtual: item.validade_atual,
                resolvidoEm: item.resolvido_em
            }));
        }

        fetchAndRenderDashboard();
        fetchAndRenderAuditorias();
        renderCharts();

        if (document.getElementById('tbodyAtendimentos')) {
            initFiltrosAtendimentos();
            fetchAndRenderAtendimentos(1);
            fetchAtendimentosKPIs();
        }

        if (document.getElementById('tbodyFaturamento')) {
            fetchAndRenderFaturamento();
        }
    } catch (e) {
        console.error('Erro ao buscar dados do Supabase:', e);
        mostrarToast('Erro de Conexão', 'Não foi possível carregar os dados do banco.', 'error');
    }
}

async function restaurarEstadoPadrao() {
    try {
        mostrarToast('Restaurando...', 'O lote de auditoria está voltando ao estado inicial...', 'info');

        // Atualiza KPI
        await supabaseClient.from('kpis').upsert({
            id: 1, faturado: 142850, aprovado: 124300, retido: 18550
        });

        // Deleta as auditorias existentes (limpa tabela) para evitar sujeira,
        // mas como a política pode não permitir DELETE livremente dependendo de como foi criada,
        // faremos upsert sobrescrevendo os 3 ids originais.
        const mockAuditorias = [
            { id: 1, data: '01/06/2026', paciente: 'Ana Maria da Silva', convenio: 'CASSI', proc: '50000250 (Fisioterapia Motora)', valor: 74.02, status: 'erro', tipo_erro: 'cbo_matricula', mensagem: 'Profissional CBO Fisioterapia faturado sob CRM. Matrícula CASSI exige 14 dígitos.', conselho_atual: 'CRM', matricula_atual: '0001234567', senha_atual: null, validade_atual: null },
            { id: 2, data: '02/06/2026', paciente: 'João Pedro Costa', convenio: 'BRADESCO', proc: '10101012 (Consulta Médica)', valor: 120.00, status: 'erro', tipo_erro: 'senha_autorizacao', mensagem: 'Ausência de senha/token de autorização prévia da operadora Bradesco Saúde.', conselho_atual: null, matricula_atual: null, senha_atual: '', validade_atual: null },
            { id: 3, data: '03/06/2026', paciente: 'Maria Eduarda', convenio: 'SULAMERICA', proc: '20104097 (Exame Especial)', valor: 350.50, status: 'erro', tipo_erro: 'validade_carteira', mensagem: 'Data de validade da carteira do beneficiário expirada no cadastro original.', conselho_atual: null, matricula_atual: null, senha_atual: null, validade_atual: '2026-05-31' }
        ];

        const { error } = await supabaseClient.from('auditorias').upsert(mockAuditorias);
        if (error) throw error;
        
        await loadStateFromSupabase();
        mostrarToast('Dados Restaurados', 'O estado foi resetado com 3 erros para testes.', 'success');
    } catch (e) {
        console.error('Erro ao restaurar:', e);
        mostrarToast('Erro', 'Falha ao restaurar banco de dados. Verifique a permissão do Supabase.', 'error');
    }
}

// --- UTILITÁRIOS ---
const formatCurrency = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

// --- SISTEMA DE NOTIFICAÇÕES (TOAST PERSONALIZADO) ---
function mostrarToast(titulo, mensagem, tipo = 'success', duracao = 4500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    
    // Configurações de estilo por tipo
    let iconClass = 'ph-check-circle text-emerald-600';
    let iconBg = 'bg-emerald-50';
    let borderAccent = 'bg-emerald-600';
    let borderColor = 'border-emerald-100';

    if (tipo === 'error') {
        iconClass = 'ph-warning-circle text-rose-600';
        iconBg = 'bg-rose-50';
        borderAccent = 'bg-rose-600';
        borderColor = 'border-rose-100';
    } else if (tipo === 'warning') {
        iconClass = 'ph-warning text-amber-600';
        iconBg = 'bg-amber-50';
        borderAccent = 'bg-amber-500';
        borderColor = 'border-amber-100';
    } else if (tipo === 'info') {
        iconClass = 'ph-info text-brand-600';
        iconBg = 'bg-brand-50';
        borderAccent = 'bg-brand-600';
        borderColor = 'border-brand-100';
    }

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `pointer-events-auto flex items-start gap-3.5 p-4 pr-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border ${borderColor} min-w-[320px] max-w-md transform translate-y-[-16px] opacity-0 transition-all duration-300 relative overflow-hidden`;
    
    toast.innerHTML = `
        <div class="w-1.5 h-full absolute left-0 top-0 ${borderAccent}"></div>
        <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
            <i class="ph ${iconClass} text-2xl"></i>
        </div>
        <div class="flex-1">
            <h4 class="text-sm font-bold font-heading text-slate-900">${titulo}</h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${mensagem}</p>
        </div>
        <button onclick="removerToast('${toastId}')" class="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <i class="ph ph-x text-sm"></i>
        </button>
    `;

    container.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-16px]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto-remover
    setTimeout(() => {
        removerToast(toastId);
    }, duracao);
}

function removerToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-16px]', 'opacity-0');
        setTimeout(() => {
            if (toast && toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

// --- RENDERIZADORES DINÂMICOS (PREP PARA BACKEND) ---
async function fetchAndRenderDashboard() {
    const kpisContainer = document.getElementById('dashboard-kpis');
    if (!kpisContainer) return;
    
    const cardsHtml = `
        <!-- Card 1: Faturado no Mês -->
        <div class="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between hover:shadow-premium-hover transition-shadow duration-300" style="animation-delay: 0ms">
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <i class="ph ph-wallet text-2xl text-emerald-600"></i>
                </div>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <i class="ph ph-trend-up"></i>
                    +12%
                </span>
            </div>
            <div>
                <h4 class="text-sm font-semibold text-slate-500 mb-1">Faturado no Mês</h4>
                <p class="text-3xl font-bold font-heading text-slate-900">${formatCurrency(state.kpis.faturado)}</p>
                <p class="text-xs text-slate-400 mt-1 font-medium">1.240 guias geradas</p>
            </div>
        </div>
        
        <!-- Card 2: Aprovado Orizon -->
        <div class="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between hover:shadow-premium-hover transition-shadow duration-300" style="animation-delay: 100ms">
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                    <i class="ph ph-check-circle text-2xl text-brand-600"></i>
                </div>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                    <i class="ph ph-check"></i>
                    ${Math.round((state.kpis.aprovado / state.kpis.faturado) * 100)}% do total
                </span>
            </div>
            <div>
                <h4 class="text-sm font-semibold text-slate-500 mb-1">Aprovado Orizon</h4>
                <p class="text-3xl font-bold font-heading text-slate-900 transition-all duration-500" id="dash-aprovado">${formatCurrency(state.kpis.aprovado)}</p>
                <div class="mt-2.5 relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="absolute top-0 left-0 h-full bg-brand-500 rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.round((state.kpis.aprovado / state.kpis.faturado) * 100))}%"></div>
                </div>
            </div>
        </div>

        <!-- Card 3: Retido em Erros -->
        <div class="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between hover:shadow-premium-hover transition-shadow duration-300" style="animation-delay: 200ms">
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <i class="ph ph-warning-circle text-2xl text-red-600"></i>
                </div>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${state.kpis.retido === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}">
                    <i class="ph ${state.kpis.retido === 0 ? 'ph-check-circle' : 'ph-trend-down'}"></i>
                    ${state.kpis.retido === 0 ? 'Zero Glosas' : '-3% vs mês ant.'}
                </span>
            </div>
            <div>
                <h4 class="text-sm font-semibold text-slate-500 mb-1">Retido em Erros</h4>
                <p class="text-3xl font-bold font-heading text-slate-900 transition-all duration-500" id="dash-retido">${formatCurrency(state.kpis.retido)}</p>
                <p class="text-xs ${state.kpis.retido === 0 ? 'text-emerald-600' : 'text-red-500'} font-medium mt-1">
                    ${state.kpis.retido === 0 ? 'Todos os erros resolvidos com sucesso' : 'Requer correção no lote'}
                </p>
            </div>
        </div>
    `;
    kpisContainer.innerHTML = cardsHtml;
}

async function fetchAndRenderAuditorias() {
    const tbody = document.getElementById('tbodyAuditoria');
    const totalErros = state.auditorias.filter(a => a.status === 'erro').length;
    
    // Update badges no sidebar e na tela
    const sidebarBadge = document.getElementById('sidebar-badge-erros');
    if (sidebarBadge) {
        sidebarBadge.textContent = totalErros;
        if (totalErros === 0) {
            sidebarBadge.className = "bg-emerald-500 text-white text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full transition-all";
            sidebarBadge.textContent = "✓";
        } else {
            sidebarBadge.className = "bg-gold-500 text-ink-900 text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full transition-all";
            sidebarBadge.textContent = totalErros;
        }
    }
    
    const telaBadge = document.getElementById('contador-erros-tela');
    if (telaBadge && telaBadge.parentElement) {
        if (totalErros > 0) {
            telaBadge.textContent = `${totalErros} Erro${totalErros > 1 ? 's' : ''} Pendente${totalErros > 1 ? 's' : ''}`;
            telaBadge.parentElement.className = "bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all";
            telaBadge.parentElement.innerHTML = `<i class="ph ph-warning-circle text-lg"></i> <span id="contador-erros-tela">${totalErros} Erro${totalErros > 1 ? 's' : ''} Pendente${totalErros > 1 ? 's' : ''}</span>`;
        } else {
            telaBadge.textContent = "100% Validado!";
            telaBadge.parentElement.className = "bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all";
            telaBadge.parentElement.innerHTML = `<i class="ph ph-check-circle text-lg text-emerald-600"></i> <span id="contador-erros-tela">100% Validado! Lote Pronto</span>`;
        }
    }

    if (!tbody) return; // Só atualiza a tabela se estiver na página de auditoria

    let html = '';
    state.auditorias.forEach(item => {
        const isErro = item.status === 'erro';
        const rowClass = isErro ? 'bg-red-50/20 hover:bg-red-50/40' : 'bg-emerald-50/20 hover:bg-emerald-50/30';
        const badgeClass = isErro ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
        const badgeText = isErro ? 'Erro Cadastral' : 'Validado TISS';
        const btnHtml = isErro 
            ? `<button id="btnCorrigir-${item.id}" onclick="abrirDrawer(${item.id})" class="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold py-1.5 px-4 rounded-xl shadow-sm text-xs transition-all flex items-center gap-1.5 ml-auto hover:scale-105 active:scale-95"><i class="ph ph-wrench text-sm"></i> Corrigir</button>`
            : `<span id="btnCorrigir-${item.id}" class="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-lg text-xs font-semibold flex items-center justify-end gap-1.5 w-max ml-auto shadow-xs"><i class="ph ph-check-circle-bold text-emerald-600"></i> Aprovado (${formatCurrency(item.valor)})</span>`;

        html += `
            <tr id="linhaGuiaErro-${item.id}" class="border-b border-slate-100 transition-colors duration-300 ${rowClass}">
                <td class="p-5 text-slate-500 font-mono text-xs">${item.data}</td>
                <td class="p-5 font-bold font-heading text-slate-800">${item.paciente}</td>
                <td class="p-5"><span class="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold shadow-xs">${item.convenio}</span></td>
                <td class="p-5">
                    <span id="badgeStatusErro-${item.id}" class="px-3 py-1.5 rounded-md text-xs font-bold border shadow-xs flex items-center gap-1.5 w-max ${badgeClass}">
                        <i class="ph ${isErro ? 'ph-warning-circle' : 'ph-check-circle'}"></i> 
                        ${badgeText}
                    </span>
                </td>
                <td class="p-5 text-right">${btnHtml}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// --- MODALS & DRAWERS ---

function abrirDrawer(id) {
    activeAuditoriaId = id;
    const item = state.auditorias.find(a => a.id === id);
    if (!item) return;
    
    const drawerContent = document.getElementById('drawerContent');
    if (!drawerContent) return;

    let formFieldsHtml = '';

    if (item.tipoErro === 'cbo_matricula' || item.id === 1) {
        formFieldsHtml = `
            <form id="formCorrecaoGlosa" class="space-y-5" onsubmit="event.preventDefault(); salvarCorrecao();">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Conselho do Executante (CBO)</label>
                    <div class="relative">
                        <select id="inputConselho" class="w-full border border-slate-200 rounded-xl shadow-xs p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-slate-800">
                            <option value="CREFITO" selected>CREFITO - Conselho Reg. de Fisioterapia (Correto)</option>
                            <option value="CRM">CRM - Conselho Regional de Medicina</option>
                            <option value="COREN">COREN - Conselho Reg. de Enfermagem</option>
                            <option value="CRP">CRP - Conselho Reg. de Psicologia</option>
                        </select>
                    </div>
                    <p class="text-[11px] text-brand-600 mt-1.5 flex items-center gap-1 font-medium">
                        <i class="ph ph-check-circle"></i> O procedimento 50000250 requer registro no CREFITO.
                    </p>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Matrícula do Beneficiário (${item.convenio})</label>
                    <div class="relative">
                        <input type="text" id="inputMatricula" value="00012345678901" maxlength="14" class="w-full border border-brand-400 bg-brand-50/30 text-brand-900 rounded-xl shadow-xs p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500 font-mono tracking-wider font-semibold" onkeyup="validarMatriculaDrawer(this)">
                        <span id="badgeDigitos" class="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-100 text-brand-800 font-bold text-[10px] px-2 py-0.5 rounded-full">14 / 14</span>
                    </div>
                    <p id="msgMatricula" class="mt-2 text-xs font-semibold text-brand-600 flex items-center gap-1">
                        <i class="ph ph-check-circle text-sm"></i> Matrícula válida com 14 dígitos conforme padrão CASSI.
                    </p>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Justificativa da Correção</label>
                    <textarea class="w-full border border-slate-200 rounded-xl shadow-xs p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-700 resize-none h-20">Ajuste de CBO executante para CREFITO e inclusão dos dígitos de prefixo da carteira.</textarea>
                </div>
            </form>
        `;
    } else if (item.tipoErro === 'senha_autorizacao' || item.id === 2) {
        formFieldsHtml = `
            <form id="formCorrecaoGlosa" class="space-y-5" onsubmit="event.preventDefault(); salvarCorrecao();">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Senha / Token de Autorização</label>
                    <div class="relative">
                        <input type="text" id="inputSenhaAuth" value="BRAD-2026-98124" placeholder="Ex: BRAD-2026-XXXX" class="w-full border border-brand-400 bg-brand-50/30 text-brand-900 rounded-xl shadow-xs p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500 font-mono tracking-wider font-semibold">
                    </div>
                    <p class="mt-1.5 text-xs font-semibold text-brand-600 flex items-center gap-1">
                        <i class="ph ph-check-circle text-sm"></i> Senha obtida via portal Bradesco Saúde.
                    </p>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Data de Liberação da Senha</label>
                    <input type="date" id="inputDataAuth" value="2026-06-02" class="w-full border border-slate-200 rounded-xl shadow-xs p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium">
                </div>
            </form>
        `;
    } else {
        formFieldsHtml = `
            <form id="formCorrecaoGlosa" class="space-y-5" onsubmit="event.preventDefault(); salvarCorrecao();">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nova Data de Validade da Carteira</label>
                    <input type="date" id="inputNovaValidade" value="2027-12-31" class="w-full border border-brand-400 bg-brand-50/30 text-brand-900 rounded-xl shadow-xs p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500 font-semibold">
                    <p class="mt-1.5 text-xs font-semibold text-brand-600 flex items-center gap-1">
                        <i class="ph ph-check-circle text-sm"></i> Carteira renovada no portal SulAmérica.
                    </p>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Via da Carteira</label>
                    <input type="text" value="Segunda Via (Atualizada)" class="w-full border border-slate-200 rounded-xl shadow-xs p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                </div>
            </form>
        `;
    }

    drawerContent.innerHTML = `
        <div class="mb-6 pb-6 border-b border-slate-100">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase tracking-wider">${item.convenio}</span>
                <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full font-mono">${formatCurrency(item.valor)}</span>
            </div>
            <h3 class="text-xl font-bold font-heading text-slate-900 mt-3">${item.paciente}</h3>
            <p class="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span class="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">${item.data}</span> 
                Proc: <strong class="text-slate-700">${item.proc}</strong>
            </p>
        </div>

        <div class="bg-red-50/80 border border-red-200 rounded-2xl p-5 mb-6 shadow-xs">
            <div class="flex items-start gap-3">
                <div class="bg-red-100 p-2 rounded-xl text-red-600 shrink-0"><i class="ph ph-warning-circle text-xl"></i></div>
                <div>
                    <h3 class="text-xs font-bold text-red-800 uppercase tracking-wider">Rejeição Prevista Orizon / Glosa</h3>
                    <p class="mt-1 text-xs text-red-700 leading-relaxed font-medium">${item.mensagem}</p>
                </div>
            </div>
        </div>

        ${formFieldsHtml}
    `;

    const overlay = document.getElementById('drawerOverlay');
    const panel = document.getElementById('drawerPanel');
    if (overlay) overlay.classList.remove('opacity-0', 'pointer-events-none');
    if (panel) panel.classList.remove('translate-x-full');
}

function fecharDrawer() {
    const overlay = document.getElementById('drawerOverlay');
    const panel = document.getElementById('drawerPanel');
    if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');
    if (panel) panel.classList.add('translate-x-full');
    activeAuditoriaId = null;
}

function validarMatriculaDrawer(input) {
    const msg = document.getElementById('msgMatricula');
    const badge = document.getElementById('badgeDigitos');
    const len = input.value.trim().length;

    if (badge) {
        badge.textContent = `${len} / 14`;
        badge.className = len === 14 ? 'absolute right-3 top-1/2 -translate-y-1/2 bg-brand-100 text-brand-800 font-bold text-[10px] px-2 py-0.5 rounded-full' : 'absolute right-3 top-1/2 -translate-y-1/2 bg-red-100 text-red-800 font-bold text-[10px] px-2 py-0.5 rounded-full';
    }

    if (len === 14) {
        input.className = "w-full border rounded-xl shadow-xs p-3 text-sm outline-none transition-all border-brand-400 focus:ring-2 focus:ring-brand-500 bg-brand-50/30 text-brand-900 font-mono tracking-wider font-semibold";
        if (msg) {
            msg.innerHTML = '<i class="ph ph-check-circle text-sm"></i> Matrícula válida com 14 dígitos.';
            msg.className = "mt-2 text-xs font-semibold text-brand-600 flex items-center gap-1";
        }
    } else {
        input.className = "w-full border rounded-xl shadow-xs p-3 text-sm outline-none transition-all border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50/50 font-mono tracking-wider";
        if (msg) {
            msg.innerHTML = `<i class="ph ph-warning-circle text-sm"></i> Possui ${len} dígitos. A CASSI exige exatamente 14.`;
            msg.className = "mt-2 text-xs font-semibold text-red-600 flex items-center gap-1";
        }
    }
}

async function salvarCorrecao() {
    const currentId = activeAuditoriaId;
    if (!currentId) return;

    const item = state.auditorias.find(a => a.id === currentId);
    if (!item) {
        fecharDrawer();
        return;
    }

    try {
        const inputConselho = document.getElementById('inputConselho');
        const inputMatricula = document.getElementById('inputMatricula');
        const inputSenhaAuth = document.getElementById('inputSenhaAuth');
        const inputNovaValidade = document.getElementById('inputNovaValidade');

        const payload = {
            id: currentId,
            conselhoProfissional: inputConselho ? inputConselho.value : '',
            matricula: inputMatricula ? inputMatricula.value.trim() : '',
            senhaAuth: inputSenhaAuth ? inputSenhaAuth.value.trim() : '',
            novaValidade: inputNovaValidade ? inputNovaValidade.value : ''
        };

        const { data, error } = await supabaseClient.rpc('auditar_guia_completa', { payload: payload });

        if (error) {
            throw error;
        }

        if (data && data.aprovado === false) {
            const mensagens = (data.criticas && data.criticas.length > 0) ? data.criticas.map(c => c.mensagem).join(', ') : 'Rejeição na validação.';
            mostrarToast('Falha na Validação', mensagens, 'error');
            return;
        }

        if (data && data.aprovado === true) {
            fecharDrawer();

            // Atualização visual otimista
            const linha = document.getElementById(`linhaGuiaErro-${currentId}`);
            if (linha) {
                linha.className = "border-b border-slate-100 transition-colors duration-300 bg-green-50";
            }

            const badge = document.getElementById(`badgeStatusErro-${currentId}`);
            if (badge) {
                badge.className = "px-3 py-1.5 rounded-md text-xs font-bold border shadow-xs flex items-center gap-1.5 w-max bg-green-100 text-green-700 border-green-200";
                badge.innerHTML = '<i class="ph ph-check-circle"></i> Validado (Orizon OK)';
            }

            const btn = document.getElementById(`btnCorrigir-${currentId}`);
            if (btn) {
                btn.outerHTML = `<span id="btnCorrigir-${currentId}" class="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-lg text-xs font-semibold flex items-center justify-end gap-1.5 w-max ml-auto shadow-xs"><i class="ph ph-check-circle-bold text-emerald-600"></i> Aprovado</span>`;
            }

            const dashRetido = document.getElementById('dash-retido');
            const dashAprovado = document.getElementById('dash-aprovado');
            if (dashRetido && dashAprovado) {
                dashRetido.classList.add('scale-105');
                dashAprovado.classList.add('scale-105');
                setTimeout(() => {
                    dashRetido.classList.remove('scale-105');
                    dashAprovado.classList.remove('scale-105');
                }, 300);
            }

            // Recarrega o estado real do banco de dados silenciosamente
            await loadStateFromSupabase();

            mostrarToast(
                'Glosa Resolvida com Sucesso!', 
                `A guia de ${item.paciente} (${item.convenio}) foi validada e liberada.`, 
                'success'
            );
        }

    } catch (err) {
        console.error('Erro de API:', err);
        mostrarToast('Erro de Conexão', 'Não foi possível validar a guia. Interface continua operando normalmente.', 'error');
    }
}

// --- CHARTS CONFIG ---
function renderCharts() {
    if (typeof Chart === 'undefined') return;
    
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#727d89'; // ink-400
    
    // 1. Bar Chart: Volume por Convênio
    const ctxConv = document.getElementById('convenioChart');
    if (ctxConv && state.chartsData.convenios.length > 0) {
        if (charts.convenio) charts.convenio.destroy();
        
        const convenioLabels = state.chartsData.convenios.map(c => c.convenio);
        const convenioValues = state.chartsData.convenios.map(c => c.valor_faturado);

        charts.convenio = new Chart(ctxConv, {
            type: 'bar',
            data: {
                labels: convenioLabels,
                datasets: [{
                    data: convenioValues,
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
                        callbacks: { label: (ctx) => `R$ ${ctx.parsed.y} mil` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#727d89', font: { family: 'Inter', size: 12 } } },
                    y: { grid: { color: '#eceef0' }, border: { display: false }, ticks: { color: '#a9b1ba', font: { family: 'Inter', size: 11 } } }
                }
            }
        });
    }

    // 2. Doughnut Chart: Glosas Evitadas
    const ctxGlosa = document.getElementById('glosaChart');
    if (ctxGlosa && state.chartsData.glosas.length > 0) {
        if (charts.glosa) charts.glosa.destroy();
        
        // Se houver auditorias pendentes, deduzimos dinamicamente das glosas corrigidas
        const errosPendentes = state.auditorias.filter(a => a.status === 'erro').length;
        
        // Deep copy para manipular valores sem afetar o array original
        const glosaData = JSON.parse(JSON.stringify(state.chartsData.glosas));
        
        // Ajuste dinâmico (opcional) se o label 2 for "Corrigidas antes do envio"
        if (glosaData[1] && glosaData[2]) {
             const resolvidasAgora = (3 - errosPendentes); 
             glosaData[1].quantidade = Number(glosaData[1].quantidade) + (resolvidasAgora * 2);
             glosaData[2].quantidade = Math.max(1, Number(glosaData[2].quantidade) - resolvidasAgora);
        }
        
        charts.glosa = new Chart(ctxGlosa, {
            type: 'doughnut',
            data: {
                labels: glosaData.map(d => d.label),
                datasets: [{
                    data: glosaData.map(d => d.quantidade),
                    backgroundColor: glosaData.map(d => d.cor),
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
                        callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` }
                    }
                }
            }
        });

        const centerEl = document.getElementById('glosa-center');
        if (centerEl) {
            const sumEvitadas = glosaData[0].quantidade + (glosaData[1] ? glosaData[1].quantidade : 0);
            const total = glosaData.reduce((acc, val) => acc + Number(val.quantidade), 0);
            const pct = Math.round((sumEvitadas / total) * 100);
            
            centerEl.innerHTML = `
                <span class="text-[32px] font-bold font-heading text-ink-900 leading-none">${pct}%</span>
                <span class="text-[10px] font-semibold text-brand-500 uppercase tracking-widest mt-1">Recuperado</span>
            `;
        }

        const legendEl = document.getElementById('glosa-legend');
        if (legendEl) {
            const total = glosaData.reduce((acc, val) => acc + Number(val.quantidade), 0);
            legendEl.innerHTML = glosaData.map(d => `
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2.5">
                        <span class="w-2.5 h-2.5 rounded-full" style="background:${d.cor}"></span>
                        <span class="text-ink-500">${d.label}</span>
                    </div>
                    <span class="font-medium text-ink-800">${Math.round((d.quantidade/total)*100)}%</span>
                </div>
            `).join('');
        }
    }
}

// --- FATURAMENTO E RELATÓRIOS ---
function fetchAndRenderFaturamento() {
    const tbody = document.getElementById('tbodyFaturamento');
    if (!tbody) return;

    // Para o faturamento, vamos listar as auditorias (pode ser as resolvidas/validadas ou todas para gerar XML)
    // Para ter volume na tela, vamos pegar as que estão no estado e simular uma carteirinha aleatoria se não tiver matricula
    const guiasFaturamento = state.auditorias;

    if (guiasFaturamento.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-ink-400">Nenhum lote de guias encontrado para o período.</td></tr>';
        return;
    }

    let html = '';
    guiasFaturamento.forEach(guia => {
        // Usa a matriculaAtual se existir, senao inventa uma pro demonstrativo baseado no id
        const matricula = guia.matriculaAtual || (16500000000 + (guia.id * 13)).toString();
        
        html += `
            <tr class="hover:bg-ink-50/50 transition-colors group cursor-pointer">
                <td class="p-4 whitespace-nowrap text-ink-500 group-hover:text-brand-700 transition-colors">${guia.data || '01/06/2026'}</td>
                <td class="p-4 font-medium text-ink-900">${guia.paciente}</td>
                <td class="p-4"><span class="bg-ink-100 text-ink-600 px-2.5 py-1 rounded-md text-[11px] font-semibold">${guia.convenio}</span></td>
                <td class="p-4 text-ink-400 font-mono text-xs">${matricula}</td>
                <td class="p-4 text-right font-semibold text-ink-900">${formatCurrency(Number(guia.valor))}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Atualiza badge de quantidade
    const badge = document.getElementById('resultado-filtragem-badge');
    if (badge) {
        badge.innerText = `${guiasFaturamento.length} registro${guiasFaturamento.length !== 1 ? 's' : ''}`;
    }
}

// --- ATENDIMENTOS (PAGINAÇÃO E FILTROS) ---
let pageAtendimentos = 1;
const ITEMS_PER_PAGE = 4;

async function fetchAtendimentosKPIs() {
    if (!document.getElementById('kpi-para-hoje')) return;
    
    const filterDate = document.getElementById('filter-date')?.value;
    if (!filterDate) return;

    try {
        // KPI Para Hoje
        const { count: countHoje } = await supabaseClient
            .from('atendimentos')
            .select('*', { count: 'exact', head: true })
            .eq('data_registro', filterDate);
        
        // KPI Em Consultório
        const { count: countCons } = await supabaseClient
            .from('atendimentos')
            .select('*', { count: 'exact', head: true })
            .eq('data_registro', filterDate)
            .eq('status', 'em_atendimento');
            
        // KPI Alertas
        const { count: countAlertas } = await supabaseClient
            .from('atendimentos')
            .select('*', { count: 'exact', head: true })
            .eq('data_registro', filterDate)
            .eq('alerta', true);

        document.getElementById('kpi-para-hoje').innerHTML = `${countHoje || 0} <span class="text-sm font-medium text-ink-400 font-sans">pacientes</span>`;
        document.getElementById('kpi-em-consultorio').innerHTML = `${countCons || 0} <span class="text-sm font-medium text-ink-400 font-sans">agora</span>`;
        document.getElementById('kpi-alertas').innerHTML = `${countAlertas || 0} <span class="text-sm font-medium text-red-500 font-sans">alertas</span>`;
        
    } catch (e) {
        console.error('Erro ao buscar KPIs', e);
    }
}

async function fetchAndRenderAtendimentos(page = 1) {
    pageAtendimentos = page;
    const tbody = document.getElementById('tbodyAtendimentos');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-ink-400"><i class="ph ph-spinner animate-spin text-2xl"></i> Carregando atendimentos...</td></tr>';

    const filterSearch = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const filterDate = document.getElementById('filter-date')?.value;
    const filterStatus = document.getElementById('filter-status')?.value;
    const filterProf = document.getElementById('filter-prof')?.value;

    try {
        let query = supabaseClient.from('atendimentos').select('*', { count: 'exact' });
        
        if (filterDate) query = query.eq('data_registro', filterDate);
        if (filterStatus) query = query.eq('status', filterStatus);
        if (filterProf) query = query.eq('profissional', filterProf);
        if (filterSearch) {
            query = query.or(`paciente.ilike.%${filterSearch}%,guia_info.ilike.%${filterSearch}%`);
        }

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE - 1;

        query = query.range(start, end).order('id', { ascending: true });

        const { data, count, error } = await query;
        if (error) throw error;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-ink-400">Nenhum atendimento encontrado.</td></tr>';
        } else {
            let html = '';
            data.forEach(item => {
                let badgeStatus = '';
                if (item.status === 'aguardando') {
                    badgeStatus = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-gold-50 text-gold-700 border border-gold-100/50"><span class="w-1.5 h-1.5 rounded-full bg-gold-500"></span> Aguardando Recepção</span>`;
                } else if (item.status === 'em_atendimento') {
                    badgeStatus = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Em Atendimento</span>`;
                } else if (item.status === 'realizado') {
                    badgeStatus = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/60"><i class="ph-fill ph-check-circle text-green-500"></i> Realizado</span>`;
                } else if (item.status === 'cancelado') {
                    badgeStatus = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-ink-100 text-ink-600 border border-ink-200"><i class="ph-fill ph-x-circle text-ink-400"></i> Cancelado</span>`;
                }

                html += `
                <tr class="hover:bg-ink-50/50 transition-colors group ${item.status === 'cancelado' ? 'opacity-75' : ''}">
                    <td class="py-4 px-6">
                        <p class="text-ink-900 font-semibold font-heading text-base ${item.status === 'cancelado' ? 'line-through text-ink-400' : ''}">${item.paciente}</p>
                        <p class="text-[11px] ${item.alerta ? 'text-red-500 font-bold' : 'text-ink-400 font-mono'} mt-0.5">${item.guia_info}</p>
                    </td>
                    <td class="py-4 px-6">
                        <p class="text-ink-900 font-medium">${item.horario}</p>
                        <p class="text-[11px] text-ink-400 mt-0.5">${item.data_registro.split('-').reverse().join('/')}</p>
                    </td>
                    <td class="py-4 px-6">
                        <p class="text-ink-900 font-medium">${item.profissional}</p>
                        <p class="text-[11px] text-ink-400 mt-0.5">${item.local_atendimento}</p>
                    </td>
                    <td class="py-4 px-6">
                        <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-ink-50 text-ink-700 text-[11px] font-medium border border-ink-100">
                            ${item.convenio}
                        </span>
                    </td>
                    <td class="py-4 px-6">${badgeStatus}</td>
                    <td class="py-4 px-6 text-right">
                        <button class="p-2 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors"><i class="ph ph-dots-three-bold text-lg"></i></button>
                    </td>
                </tr>
                `;
            });
            tbody.innerHTML = html;
        }

        renderPagination(count, page);

    } catch (e) {
        console.error('Erro ao buscar atendimentos', e);
        tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-red-500">Erro ao carregar atendimentos do banco.</td></tr>';
    }
}

function renderPagination(totalItens, paginaAtual) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    const startItem = totalItens === 0 ? 0 : ((paginaAtual - 1) * ITEMS_PER_PAGE) + 1;
    const endItem = Math.min(paginaAtual * ITEMS_PER_PAGE, totalItens);
    const totalPages = Math.ceil(totalItens / ITEMS_PER_PAGE);

    let botoes = '';
    
    // Anterior
    if (paginaAtual > 1) {
        botoes += `<button onclick="fetchAndRenderAtendimentos(${paginaAtual - 1})" class="px-3 py-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors shadow-sm">Anterior</button>`;
    } else {
        botoes += `<button class="px-3 py-1.5 rounded-lg border border-ink-200 text-ink-400 cursor-not-allowed bg-ink-50">Anterior</button>`;
    }

    // Números
    for (let i = 1; i <= totalPages; i++) {
        if (i === paginaAtual) {
            botoes += `<button class="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium shadow-sm">${i}</button>`;
        } else {
            botoes += `<button onclick="fetchAndRenderAtendimentos(${i})" class="px-3 py-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors shadow-sm">${i}</button>`;
        }
    }

    // Próxima
    if (paginaAtual < totalPages) {
        botoes += `<button onclick="fetchAndRenderAtendimentos(${paginaAtual + 1})" class="px-3 py-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors shadow-sm">Próxima</button>`;
    } else {
        botoes += `<button class="px-3 py-1.5 rounded-lg border border-ink-200 text-ink-400 cursor-not-allowed bg-ink-50">Próxima</button>`;
    }

    container.innerHTML = `
        <p class="text-ink-500">Mostrando <span class="font-semibold text-ink-900">${startItem}</span> a <span class="font-semibold text-ink-900">${endItem}</span> de <span class="font-semibold text-ink-900">${totalItens}</span> resultados.</p>
        <div class="flex items-center gap-2">${botoes}</div>
    `;
}

function initFiltrosAtendimentos() {
    const filters = ['filter-search', 'filter-date', 'filter-status', 'filter-prof'];
    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                fetchAndRenderAtendimentos(1);
                fetchAtendimentosKPIs();
            });
            if (id === 'filter-search') {
                el.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        fetchAndRenderAtendimentos(1);
                    }
                });
            }
        }
    });
}

// --- INIT GLOBAL ---
window.addEventListener('DOMContentLoaded', () => {
    // Agora aguardamos o load inicial dos dados do Supabase
    loadStateFromSupabase();
});

