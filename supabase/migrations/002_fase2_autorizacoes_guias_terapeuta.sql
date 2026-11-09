-- ============================================================================
-- CLÍNICA ELMAN - FASE 2 (MODELAGEM 3FN)
-- Tabelas: public.terapeutas, public.autorizacoes, public.guias_tiss, public.guias_tiss_sessoes
-- ============================================================================

-- 1. Garantir chave primária e termos base em public.procedimentos_tuss
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'procedimentos_tuss'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'public.procedimentos_tuss'::regclass AND contype = 'p'
        ) THEN
            ALTER TABLE public.procedimentos_tuss ADD PRIMARY KEY (codigo_tuss);
        END IF;

        INSERT INTO public.procedimentos_tuss (codigo_tuss, descricao, tabela_dominio, conselho_obrigatorio, cbo_prefixo, exige_senha)
        VALUES
            ('50000470', 'Sessão de Psicoterapia / Terapia ABA Individual', '22', 'CRP', '251510', true),
            ('50000615', 'Sessão de Fonoaudiologia Individual', '22', 'CRFa', '223810', true),
            ('50000054', 'Sessão de Terapia Ocupacional Individual', '22', 'CREFITO', '223905', true),
            ('20103471', 'Fisioterapia para Distúrbios Osteomioarticulares', '22', 'CREFITO', '223605', true),
            ('50000560', 'Atendimento Psicopedagógico / Neuropsicologia', '22', 'CRP', '251540', true),
            ('10101012', 'Consulta em Consultório (no horário normal)', '22', 'CRM', '225125', false)
        ON CONFLICT (codigo_tuss) DO NOTHING;
    END IF;
END $$;

-- 2. Tabela de Terapeutas / Profissionais Executantes (vinculável a public.profiles)
CREATE TABLE IF NOT EXISTS public.terapeutas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    nome text NOT NULL,
    email text,
    conselho text NOT NULL DEFAULT 'CREFITO',
    numero_conselho text NOT NULL,
    uf_conselho char(2) NOT NULL DEFAULT 'RJ',
    cbo text NOT NULL DEFAULT '223605',
    especialidade text NOT NULL DEFAULT 'Fisioterapia',
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sincronizar perfis com role 'medico' de public.profiles para public.terapeutas caso ainda não existam
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        INSERT INTO public.terapeutas (profile_id, nome, email, conselho, numero_conselho, uf_conselho, cbo, especialidade)
        SELECT
            p.id,
            p.nome,
            p.email,
            'CRP',
            '44556',
            'RJ',
            '251510',
            'Terapia Multidisciplinar'
        FROM public.profiles p
        WHERE p.role::text = 'medico'
          AND NOT EXISTS (
              SELECT 1 FROM public.terapeutas t
              WHERE t.profile_id = p.id OR LOWER(t.nome) = LOWER(p.nome)
          );
    END IF;
END $$;

-- Inserir terapeutas iniciais da Clínica Elman caso a tabela esteja vazia
INSERT INTO public.terapeutas (nome, email, conselho, numero_conselho, uf_conselho, cbo, especialidade)
SELECT * FROM (
    VALUES
        ('Dra. Luciana Silva', 'luciana.silva@clinicaelman.com.br', 'CRP', '05/68412', 'RJ', '251510', 'Psicologia / Terapia ABA'),
        ('Dr. Carlos Mendes', 'carlos.mendes@clinicaelman.com.br', 'CREFITO', '2/149820-F', 'RJ', '223605', 'Fisioterapia Neurofuncional'),
        ('Dra. Fernanda Rocha', 'fernanda.rocha@clinicaelman.com.br', 'CRFa', '1-14892', 'RJ', '223810', 'Fonoaudiologia Infantil'),
        ('Dr. Roberto Almeida', 'roberto.almeida@clinicaelman.com.br', 'CREFITO', '2/088310-TO', 'RJ', '223905', 'Terapia Ocupacional')
) AS v(nome, email, conselho, numero_conselho, uf_conselho, cbo, especialidade)
WHERE NOT EXISTS (
    SELECT 1 FROM public.terapeutas t WHERE LOWER(t.nome) = LOWER(v.nome)
);

-- 3. Tabela de Autorizações (Senhas concedidas pelos Planos de Saúde)
CREATE TABLE IF NOT EXISTS public.autorizacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    terapeuta_id uuid NOT NULL REFERENCES public.terapeutas(id) ON DELETE RESTRICT,
    numero_autorizacao text NOT NULL UNIQUE,
    codigo_tuss text NOT NULL,
    descricao_termo text NOT NULL,
    data_inicio date NOT NULL, -- Corresponde ao Campo "4 - Data de Autorização" na Guia TISS
    data_fim date NOT NULL,
    quantidade_total_sessoes integer NOT NULL CHECK (quantidade_total_sessoes > 0),
    quantidade_sessoes_semanais integer NOT NULL CHECK (quantidade_sessoes_semanais > 0),
    valor_unitario_sessao numeric(10, 2) DEFAULT 0.00,
    status text NOT NULL DEFAULT 'ativa',
    observacoes text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_autorizacao_datas CHECK (data_fim >= data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_autorizacoes_paciente ON public.autorizacoes USING btree (paciente_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_terapeuta ON public.autorizacoes USING btree (terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_numero ON public.autorizacoes USING btree (numero_autorizacao);

-- 4. Tabela de Guias TISS (SP/SADT geradas a partir da Autorização e enviadas ao Terapeuta)
CREATE TABLE IF NOT EXISTS public.guias_tiss (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_guia_prestador text NOT NULL UNIQUE,
    numero_guia_operadora text,
    autorizacao_id uuid NOT NULL REFERENCES public.autorizacoes(id) ON DELETE CASCADE,
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE RESTRICT,
    plano_saude_id uuid NOT NULL REFERENCES public.planos_saude(id) ON DELETE RESTRICT,
    terapeuta_designado_id uuid NOT NULL REFERENCES public.terapeutas(id) ON DELETE RESTRICT,
    versao_tiss text NOT NULL DEFAULT '4.03.00',
    data_autorizacao_campo4 date NOT NULL, -- Campo 4 da Guia TISS (= data_inicio da senha)
    data_validade_senha date NOT NULL,
    numero_senha text NOT NULL,
    codigo_tuss text NOT NULL,
    descricao_termo text NOT NULL,
    qtd_sessoes_previstas integer NOT NULL DEFAULT 10 CHECK (qtd_sessoes_previstas BETWEEN 1 AND 10),
    assinatura_paciente_base64 text,
    nome_assinante text,
    assinado_em timestamptz,
    status_guia text NOT NULL DEFAULT 'enviada_terapeuta',
    enviada_faturamento_em timestamptz,
    numero_lote text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guias_tiss_autorizacao ON public.guias_tiss USING btree (autorizacao_id);
CREATE INDEX IF NOT EXISTS idx_guias_tiss_terapeuta ON public.guias_tiss USING btree (terapeuta_designado_id);
CREATE INDEX IF NOT EXISTS idx_guias_tiss_status ON public.guias_tiss USING btree (status_guia);

-- 5. Tabela de Sessões / Datas Realizadas por Guia TISS (Máximo 10 datas por guia)
CREATE TABLE IF NOT EXISTS public.guias_tiss_sessoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guia_id uuid NOT NULL REFERENCES public.guias_tiss(id) ON DELETE CASCADE,
    ordem_sessao integer NOT NULL CHECK (ordem_sessao BETWEEN 1 AND 10),
    data_realizacao date NOT NULL,
    quantidade integer NOT NULL DEFAULT 1,
    assinatura_confirmada boolean NOT NULL DEFAULT true,
    observacao_sessao text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_guia_data_realizacao UNIQUE (guia_id, data_realizacao)
);

CREATE INDEX IF NOT EXISTS idx_guias_sessoes_guia ON public.guias_tiss_sessoes USING btree (guia_id);

-- 6. Habilitar RLS e Políticas de Acesso
ALTER TABLE public.terapeutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_tiss ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_tiss_sessoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso terapeutas autenticados" ON public.terapeutas;
CREATE POLICY "Acesso terapeutas autenticados" ON public.terapeutas
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso autorizacoes autenticados" ON public.autorizacoes;
CREATE POLICY "Acesso autorizacoes autenticados" ON public.autorizacoes
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso guias_tiss autenticados" ON public.guias_tiss;
CREATE POLICY "Acesso guias_tiss autenticados" ON public.guias_tiss
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso guias_tiss_sessoes autenticados" ON public.guias_tiss_sessoes;
CREATE POLICY "Acesso guias_tiss_sessoes autenticados" ON public.guias_tiss_sessoes
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

