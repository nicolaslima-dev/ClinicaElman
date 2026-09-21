# Clínica Elman - Monorepo

Este repositório contém a estrutura completa para o projeto Clínica Elman, adotando uma arquitetura de monorepo desacoplado para facilitar a migração de um protótipo legado para uma aplicação moderna e escalável.

## Estrutura do Projeto

* `prototypes/`: Contém os protótipos originais em HTML, Tailwind via CDN e JS puro. **[NÃO ALTERAR]**
* `frontend/`: Single Page Application (SPA) em React 18+, TypeScript e Vite. Construída para consumir inicialmente o Supabase.
* `backend/`: API estruturada em MVC com Node.js e TypeScript, pronta para substituir o Supabase no futuro.

## Como Executar

### Frontend
1. Entre na pasta: `cd frontend`
2. Instale as dependências: `npm install`
3. Copie o `.env.example` para `.env` e preencha com as chaves do Supabase.
4. Rode em desenvolvimento: `npm run dev`

### Backend
*(Backend encontra-se na fase de scaffolding e não está conectado ao frontend ainda)*
1. Entre na pasta: `cd backend`
2. Instale as dependências: `npm install`
3. Rode em desenvolvimento: `npm run dev`
