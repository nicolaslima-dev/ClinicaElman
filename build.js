const fs = require('fs');

console.log('Iniciando o build no Vercel...');

// O Vercel injeta as variáveis de ambiente cadastradas no painel em process.env
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ AVISO: SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas no Vercel Environment Variables!');
}

const envContent = `
SUPABASE_URL = '${supabaseUrl}';
SUPABASE_ANON_KEY = '${supabaseKey}';
`;

// Escreve o arquivo env.js que foi ignorado no git
fs.writeFileSync('env.js', envContent.trim());
console.log('✅ env.js gerado com sucesso!');
