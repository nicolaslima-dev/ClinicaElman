-- ============================================================================
-- CLÍNICA ELMAN - FASE 4 (MODELAGEM 3FN)
-- Motor de Conferência e Crítica Pré-XML (Auditoria de Lotes e Guias TISS)
-- Tabela: public.auditorias_guias + evolução de public.guias_tiss
-- ============================================================================

-- 1. Evoluir public.guias_tiss com metadados de Auditoria Pré-XML
ALTER TABLE public.guias_tiss
    ADD COLUMN IF NOT EXISTS status_auditoria text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'reprovado' | 'aprovado'
    ADD COLUMN IF NOT EXISTS total_glosas_detectadas integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS auditado_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_guias_tiss_status_auditoria ON public.guias_tiss USING btree (status_auditoria);

-- 2. Tabela Normalizada de Críticas de Auditoria por Guia TISS
--    Registra cada uma das 4 falhas críticas obrigatórias antes da geração do XML:
--    - CRIT_DATA_REPETIDA: Datas repetidas na mesma guia ou em outra guia do mesmo paciente/termo
--    - CRIT_QTD_DIFERENTE_1: Quantidade cobrada diferente de 1 na linha da sessão
--    - CRIT_TERAPEUTA_DIVERGENTE: Profissional executante diferente do Terapeuta designado na guia
--    - CRIT_VALOR_TABELA_PLANO: Valor unitário diferente da tabela contratual do plano de saúde
CREATE TABLE IF NOT EXISTS public.auditorias_guias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guia_id uuid NOT NULL REFERENCES public.guias_tiss(id) ON DELETE CASCADE,
    lote_id uuid REFERENCES public.lotes_faturamento(id) ON DELETE SET NULL,
    codigo_critica text NOT NULL,
    titulo text NOT NULL,
    mensagem_detalhe text NOT NULL,
    valor_esperado text,
    valor_encontrado text,
    bloqueante boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'corrigido'
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    corrigido_em timestamptz
);

CREATE INDEX IF NOT EXISTS idx_auditorias_guias_guia ON public.auditorias_guias USING btree (guia_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_guias_lote ON public.auditorias_guias USING btree (lote_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_guias_status ON public.auditorias_guias USING btree (status);

-- 3. Habilitar RLS e Políticas de Acesso
ALTER TABLE public.auditorias_guias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso auditorias_guias autenticados" ON public.auditorias_guias;
CREATE POLICY "Acesso auditorias_guias autenticados" ON public.auditorias_guias
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

