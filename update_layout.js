const fs = require('fs');
const glob = require('fs').readdirSync('.');

const htmlFiles = glob.filter(f => f.endsWith('.html') && f !== 'index.html');

const MOBILE_NAVBAR_TEMPLATE = (dashClass, atenClass, fatuClass, audiClass) => `
    <!-- MOBILE TOP NAVIGATION -->
    <nav class="lg:hidden glass-sidebar relative z-40 border-b border-white/10 shrink-0">
        <div class="px-4">
            <div class="relative flex h-16 items-center justify-between">
                
                <!-- Profile and Notifications (Mobile Left) -->
                <div class="flex items-center">
                    <button type="button" class="relative p-2 text-brand-100/50 hover:text-white transition-colors rounded-full hover:bg-white/5">
                        <span class="absolute -inset-1.5"></span>
                        <span class="sr-only">View notifications</span>
                        <i class="ph ph-bell text-xl"></i>
                        <span class="absolute top-2 right-2.5 w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                    </button>

                    <!-- Profile dropdown -->
                    <el-dropdown class="relative ml-1">
                        <button class="relative flex rounded-full bg-ink-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-ink-900 transition-shadow">
                            <span class="absolute -inset-1.5"></span>
                            <span class="sr-only">Open user menu</span>
                            <div class="h-8 w-8 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-brand-100 font-semibold text-xs">IC</div>
                        </button>

                        <el-menu anchor="bottom start" popover class="w-48 origin-top-left rounded-xl bg-white shadow-premium py-1 ring-1 ring-black/5 focus:outline-none transition-all duration-200 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in z-50 mt-2">
                            <a href="#" class="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors">Seu perfil</a>
                            <a href="#" class="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors">Configurações</a>
                            <a href="#" class="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors">Sair</a>
                        </el-menu>
                    </el-dropdown>
                </div>
                
                <!-- Logo -->
                <div class="flex flex-1 items-center justify-center">
                    <img src="logo-elman.png" alt="Clínica Elman" class="h-8 w-auto object-contain"
                        onerror="this.outerHTML='<div class=\\'text-xl font-semibold font-heading tracking-tight text-white\\'>CLÍNICA <span class=\\'text-brand-200 font-light\\'>elman</span></div>'">
                </div>

                <!-- Hamburger (Mobile Right) -->
                <div class="flex items-center">
                    <button type="button" command="--toggle" commandfor="mobile-menu" aria-expanded="false" class="group relative inline-flex items-center justify-center rounded-md p-2 text-brand-100/50 hover:bg-white/5 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-400 h-10 w-10 overflow-hidden">
                        <span class="absolute -inset-0.5"></span>
                        <span class="sr-only">Open main menu</span>
                        <!-- Hamburger Icon -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="absolute size-6 transition-all duration-300 transform group-aria-[expanded=true]:rotate-90 group-aria-[expanded=true]:scale-0 group-aria-[expanded=true]:opacity-0">
                            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <!-- Close Icon -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="absolute size-6 transition-all duration-300 transform -rotate-90 scale-0 opacity-0 group-aria-[expanded=true]:rotate-0 group-aria-[expanded=true]:scale-100 group-aria-[expanded=true]:opacity-100">
                            <path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile menu dropdown -->
        <el-disclosure id="mobile-menu" hidden class="block lg:hidden transition-all duration-300 ease-out data-closed:opacity-0 data-closed:-translate-y-2 origin-top relative z-50">
            <div class="space-y-1 px-4 pt-2 pb-4 bg-ink-900/95 backdrop-blur-md border-t border-white/10 shadow-premium absolute w-full left-0">
                <a href="index.html" class="block rounded-md ${dashClass} px-3 py-2.5 text-base font-medium transition-all">Dashboard</a>
                <a href="atendimento.html" class="block rounded-md ${atenClass} px-3 py-2.5 text-base font-medium transition-all">Atendimento</a>
                <a href="faturamento.html" class="block rounded-md ${fatuClass} px-3 py-2.5 text-base font-medium transition-all">Faturamento TISS</a>
                <a href="auditoria.html" class="block rounded-md ${audiClass} px-3 py-2.5 text-base font-medium transition-all flex justify-between items-center">
                    Auditoria
                    <span class="bg-gold-500 text-ink-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full" id="mobile-badge-erros">3</span>
                </a>
                <div class="mt-4 pt-4 border-t border-white/10">
                    <p class="text-[11px] font-medium text-brand-200/40 tracking-wide mb-2 px-3">Mais relatórios</p>
                    <a href="#" class="block rounded-md px-3 py-2 text-sm font-medium text-brand-100/50 hover:bg-white/5 hover:text-white transition-all">Repasse médico</a>
                    <a href="#" class="block rounded-md px-3 py-2 text-sm font-medium text-brand-100/50 hover:bg-white/5 hover:text-white transition-all">Programação</a>
                    <a href="#" class="block rounded-md px-3 py-2 text-sm font-medium text-brand-100/50 hover:bg-white/5 hover:text-white transition-all">Autorizações</a>
                </div>
            </div>
        </el-disclosure>
    </nav>`;

htmlFiles.forEach(file => {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf-8');
    
    // 1. Update body class and inject script
    if (content.includes('<body class="text-ink-800 flex h-screen overflow-hidden">')) {
        content = content.replace(
            '<body class="text-ink-800 flex h-screen overflow-hidden">',
            '<body class="text-ink-800 flex flex-col lg:flex-row h-screen overflow-hidden bg-[#f5f6f5]">\n    <!-- @tailwindplus/elements for Interactive Navbar -->\n    <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script>'
        );
    }
    
    // 2. Update aside class
    if (content.includes('class="w-72 glass-sidebar flex flex-col')) {
        content = content.replace(
            'class="w-72 glass-sidebar flex flex-col',
            'class="w-72 glass-sidebar hidden lg:flex flex-col'
        );
    }
    
    // 3. Inject Mobile Navbar
    if (!content.includes('<!-- MOBILE TOP NAVIGATION -->')) {
        const dashClass = "text-brand-100/50 hover:bg-white/5 hover:text-white";
        const atenClass = (file === 'atendimento.html' || file === 'novo_atendimento.html') ? "bg-white/10 text-white" : "text-brand-100/50 hover:bg-white/5 hover:text-white";
        const fatuClass = (file === 'faturamento.html') ? "bg-white/10 text-white" : "text-brand-100/50 hover:bg-white/5 hover:text-white";
        const audiClass = (file === 'auditoria.html') ? "bg-white/10 text-white" : "text-brand-100/50 hover:bg-white/5 hover:text-white";
        
        const navbar = MOBILE_NAVBAR_TEMPLATE(dashClass, atenClass, fatuClass, audiClass);
        
        if (content.includes('    </aside>\n\n    <main')) {
            content = content.replace('    </aside>\n\n    <main', `    </aside>\n${navbar}\n    <main`);
        } else if (content.includes('    </aside>\n    <main')) {
            content = content.replace('    </aside>\n    <main', `    </aside>\n${navbar}\n    <main`);
        }
    }
    
    // 4. Update header class
    if (content.includes('class="h-20 px-8 flex items-center justify-end')) {
        content = content.replace(
            'class="h-20 px-8 flex items-center justify-end',
            'class="h-20 px-8 hidden lg:flex items-center justify-end'
        );
    }
    
    // 5. Update views-container padding
    if (content.includes('class="flex-1 overflow-y-auto p-8 relative z-10"')) {
        content = content.replace(
            'class="flex-1 overflow-y-auto p-8 relative z-10"',
            'class="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 w-full"'
        );
    } else if (content.includes('class="flex-1 overflow-y-auto relative p-8 z-10"')) {
        content = content.replace(
            'class="flex-1 overflow-y-auto relative p-8 z-10"',
            'class="flex-1 overflow-y-auto relative p-4 sm:p-8 z-10 w-full"'
        );
    }

    fs.writeFileSync(file, content, 'utf-8');
});
console.log("All layout changes applied!");
