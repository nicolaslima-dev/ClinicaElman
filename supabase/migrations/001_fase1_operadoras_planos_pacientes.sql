-- ============================================================================
-- CLÍNICA ELMAN - FASE 1 (MODELAGEM 3FN)
-- Tabelas: public.operadoras, public.planos_saude e public.pacientes
-- ============================================================================

-- 1. Tabela de Operadoras / Convênios (com Versão TISS e regras pré-definidas)
CREATE TABLE IF NOT EXISTS public.operadoras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL UNIQUE,
    registro_ans varchar(6),
    versao_tiss text NOT NULL DEFAULT '4.03.00',
    tamanho_matricula integer,
    dias_validade_autorizacao integer NOT NULL DEFAULT 60,
    codigo_prestador text,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Planos de Saúde (vinculada à Operadora)
CREATE TABLE IF NOT EXISTS public.planos_saude (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operadora_id uuid NOT NULL REFERENCES public.operadoras(id) ON DELETE CASCADE,
    nome_plano text NOT NULL,
    acomodacao text DEFAULT 'Ambulatorial',
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_operadora_nome_plano UNIQUE (operadora_id, nome_plano)
);

-- 3. Migrar dados existentes de public.operadoras_regras (caso a tabela exista) e inserir carga inicial
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'operadoras_regras'
    ) THEN
        INSERT INTO public.operadoras (nome, versao_tiss, tamanho_matricula, dias_validade_autorizacao)
        SELECT
            convenio,
            versao_tiss_obrigatoria,
            tamanho_matricula,
            dias_validade_autorizacao
        FROM public.operadoras_regras
        ON CONFLICT (nome) DO NOTHING;
    END IF;
END $$;

INSERT INTO public.operadoras (nome, registro_ans, versao_tiss, tamanho_matricula, dias_validade_autorizacao)
VALUES
    ('BRADESCO', '005711', '4.03.00', 15, 90),
    ('SULAMERICA', '006246', '4.03.00', 12, 60),
    ('UNIMED', '343889', '4.02.00', 17, 60),
    ('CASSI', '346659', '3.05.00', 14, 90),
    ('AMIL', '326305', '4.03.00', 9, 60),
    ('PORTO SEGURO', '000582', '4.01.00', 12, 60)
ON CONFLICT (nome) DO UPDATE
SET registro_ans = COALESCE(public.operadoras.registro_ans, EXCLUDED.registro_ans);

-- Criar planos iniciais para as operadoras cadastradas
INSERT INTO public.planos_saude (operadora_id, nome_plano, acomodacao)
SELECT id, 'Plano Padrão / Nacional', 'Apartamento'
FROM public.operadoras
ON CONFLICT (operadora_id, nome_plano) DO NOTHING;

INSERT INTO public.planos_saude (operadora_id, nome_plano, acomodacao)
SELECT id, 'Efetivo / Flex', 'Enfermaria'
FROM public.operadoras
WHERE nome IN ('BRADESCO', 'UNIMED', 'AMIL')
ON CONFLICT (operadora_id, nome_plano) DO NOTHING;

-- 4. Tabela de Pacientes (Normalizada: referencia apenas plano_saude_id)
CREATE TABLE IF NOT EXISTS public.pacientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    data_nascimento date NOT NULL,
    cpf varchar(14) NOT NULL UNIQUE,
    cep varchar(9) NOT NULL,
    logradouro text NOT NULL,
    numero text NOT NULL,
    complemento text,
    bairro text NOT NULL,
    cidade text NOT NULL,
    uf char(2) NOT NULL,
    plano_saude_id uuid NOT NULL REFERENCES public.planos_saude(id) ON DELETE RESTRICT,
    carteira_plano text NOT NULL,
    validade_carteira date,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON public.pacientes USING btree (nome);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON public.pacientes USING btree (cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_plano ON public.pacientes USING btree (plano_saude_id);

-- 5. Vincular tabela atendimentos existente ao paciente cadastrado (sem quebrar dados atuais)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'atendimentos'
    ) THEN
        ALTER TABLE public.atendimentos
        ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Habilitar RLS e Políticas de Acesso
ALTER TABLE public.operadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso operadoras autenticados" ON public.operadoras;
CREATE POLICY "Acesso operadoras autenticados" ON public.operadoras
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso planos autenticados" ON public.planos_saude;
CREATE POLICY "Acesso planos autenticados" ON public.planos_saude
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso pacientes autenticados" ON public.pacientes;
CREATE POLICY "Acesso pacientes autenticados" ON public.pacientes
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

