-- ============================================================================
-- CLÍNICA ELMAN - FASE 3 (MODELAGEM 3FN)
-- Tabelas: public.planos_procedimentos_precos, public.lotes_faturamento
-- Evolução de: public.guias_tiss e public.guias_tiss_sessoes
-- ============================================================================

-- 1. Tabela Contratual de Preços por Operadora/Plano + Código TUSS (Fluxo Padrão em 3 Etapas)
--    Etapa 1: Clínica recebe a tabela de códigos e o contrato de valores da operadora
--    Etapa 2: Clínica importa/cadastra os códigos padrão TUSS em public.procedimentos_tuss
--    Etapa 3: Clínica digita ou importa os preços acordados por operadora em public.planos_procedimentos_precos
CREATE TABLE IF NOT EXISTS public.planos_procedimentos_precos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operadora_id uuid NOT NULL REFERENCES public.operadoras(id) ON DELETE CASCADE,
    plano_saude_id uuid REFERENCES public.planos_saude(id) ON DELETE CASCADE,
    codigo_tuss text NOT NULL REFERENCES public.procedimentos_tuss(codigo_tuss) ON DELETE RESTRICT,
    valor_sessao numeric(10, 2) NOT NULL CHECK (valor_sessao >= 0),
    numero_contrato text,
    vigencia_inicio date,
    vigencia_fim date,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_preco_operadora_plano_tuss
    ON public.planos_procedimentos_precos (
        operadora_id,
        COALESCE(plano_saude_id, '00000000-0000-0000-0000-000000000000'::uuid),
        codigo_tuss
    );

CREATE INDEX IF NOT EXISTS idx_precos_operadora ON public.planos_procedimentos_precos USING btree (operadora_id);
CREATE INDEX IF NOT EXISTS idx_precos_tuss ON public.planos_procedimentos_precos USING btree (codigo_tuss);

-- Carga inicial de exemplo (Tabela de Preços Contratuais das Operadoras da Clínica Elman)
INSERT INTO public.planos_procedimentos_precos (operadora_id, codigo_tuss, valor_sessao, numero_contrato, vigencia_inicio)
SELECT
    op.id,
    t.codigo_tuss,
    CASE
        WHEN op.nome = 'BRADESCO' AND t.codigo_tuss = '50000470' THEN 165.00
        WHEN op.nome = 'BRADESCO' AND t.codigo_tuss = '50000615' THEN 150.00
        WHEN op.nome = 'BRADESCO' AND t.codigo_tuss = '50000054' THEN 155.00
        WHEN op.nome = 'BRADESCO' AND t.codigo_tuss = '20103471' THEN 135.00
        WHEN op.nome = 'SULAMERICA' AND t.codigo_tuss = '50000470' THEN 160.00
        WHEN op.nome = 'SULAMERICA' AND t.codigo_tuss = '50000615' THEN 145.00
        WHEN op.nome = 'UNIMED' AND t.codigo_tuss = '50000470' THEN 130.00
        WHEN op.nome = 'UNIMED' AND t.codigo_tuss = '20103471' THEN 115.00
        WHEN op.nome = 'CASSI' AND t.codigo_tuss = '20103471' THEN 110.00
        WHEN op.nome = 'CASSI' AND t.codigo_tuss = '50000470' THEN 125.00
        ELSE 140.00
    END AS valor_sessao,
    'CONTRATO-' || op.nome || '-2026',
    '2026-01-01'::date
FROM public.operadoras op
CROSS JOIN public.procedimentos_tuss t
WHERE NOT EXISTS (
    SELECT 1
    FROM public.planos_procedimentos_precos ppp
    WHERE ppp.operadora_id = op.id
      AND ppp.plano_saude_id IS NULL
      AND ppp.codigo_tuss = t.codigo_tuss
);

-- 2. Tabela de Lotes de Faturamento TISS (numeração controlada / aleatória por Operadora)
CREATE TABLE IF NOT EXISTS public.lotes_faturamento (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_lote text NOT NULL UNIQUE,
    operadora_id uuid NOT NULL REFERENCES public.operadoras(id) ON DELETE RESTRICT,
    versao_tiss text NOT NULL DEFAULT '4.03.00',
    status_lote text NOT NULL DEFAULT 'aberto', -- 'aberto' | 'em_conferencia' | 'fechado' | 'xml_gerado'
    quantidade_guias integer NOT NULL DEFAULT 0,
    valor_total_lote numeric(12, 2) NOT NULL DEFAULT 0.00,
    criado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    observacoes text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lotes_operadora ON public.lotes_faturamento USING btree (operadora_id);
CREATE INDEX IF NOT EXISTS idx_lotes_numero ON public.lotes_faturamento USING btree (numero_lote);

-- 3. Evolução de public.guias_tiss e public.guias_tiss_sessoes para Faturamento & Lotes
ALTER TABLE public.guias_tiss
    ADD COLUMN IF NOT EXISTS lote_id uuid REFERENCES public.lotes_faturamento(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS terapeuta_executante_id uuid REFERENCES public.terapeutas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS valor_unitario_sessao numeric(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS valor_total_guia numeric(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS digitado_faturamento_em timestamptz;

ALTER TABLE public.guias_tiss_sessoes
    ADD COLUMN IF NOT EXISTS valor_unitario numeric(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS valor_total numeric(10, 2) NOT NULL DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_guias_tiss_lote_id ON public.guias_tiss USING btree (lote_id);
CREATE INDEX IF NOT EXISTS idx_guias_tiss_numero_lote ON public.guias_tiss USING btree (numero_lote);

-- 4. Trigger para atualizar automaticamente a quantidade de guias e valor total do Lote
CREATE OR REPLACE FUNCTION public.fn_recalcular_totais_lote()
RETURNS TRIGGER AS $$
DECLARE
    v_lote_id uuid;
BEGIN
    v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
    IF v_lote_id IS NOT NULL THEN
        UPDATE public.lotes_faturamento l
        SET
            quantidade_guias = (
                SELECT COUNT(*)::int FROM public.guias_tiss g WHERE g.lote_id = v_lote_id
            ),
            valor_total_lote = (
                SELECT COALESCE(SUM(g.valor_total_guia), 0.00) FROM public.guias_tiss g WHERE g.lote_id = v_lote_id
            ),
            updated_at = timezone('utc'::text, now())
        WHERE l.id = v_lote_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_totais_lote ON public.guias_tiss;
CREATE TRIGGER trg_recalcular_totais_lote
    AFTER INSERT OR UPDATE OR DELETE ON public.guias_tiss
    FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_totais_lote();

-- 5. Habilitar RLS e Políticas de Acesso
ALTER TABLE public.planos_procedimentos_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_faturamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso precos autenticados" ON public.planos_procedimentos_precos;
CREATE POLICY "Acesso precos autenticados" ON public.planos_procedimentos_precos
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso lotes autenticados" ON public.lotes_faturamento;
CREATE POLICY "Acesso lotes autenticados" ON public.lotes_faturamento
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

