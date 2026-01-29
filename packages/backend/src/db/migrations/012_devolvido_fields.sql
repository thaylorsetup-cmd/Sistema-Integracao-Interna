-- =====================================================
-- MIGRACAO 012: CAMPOS DE DEVOLUCAO
-- Adiciona campos para rastrear devolucoes de documentos
-- =====================================================

-- Campo devolvido_em para rastrear quando foi devolvido
DO $$ BEGIN
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'devolvido_em'
) THEN
    ALTER TABLE submissions
    ADD COLUMN devolvido_em TIMESTAMP WITH TIME ZONE;
END IF;
END $$;

-- Campo devolvido_por para rastrear quem devolveu
DO $$ BEGIN
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'devolvido_por'
) THEN
    ALTER TABLE submissions
    ADD COLUMN devolvido_por UUID REFERENCES users(id);
END IF;
END $$;

-- Indice para busca por devolvidos
CREATE INDEX IF NOT EXISTS idx_submissions_devolvido_em ON submissions(devolvido_em);
CREATE INDEX IF NOT EXISTS idx_submissions_devolvido_por ON submissions(devolvido_por);

-- Indice composto para operador + status (otimiza busca de devolvidos por operador)
CREATE INDEX IF NOT EXISTS idx_submissions_operador_status ON submissions(operador_id, status);

-- Comentarios
COMMENT ON COLUMN submissions.devolvido_em IS 'Data/hora em que o cadastro foi devolvido ao operador';
COMMENT ON COLUMN submissions.devolvido_por IS 'ID do analista que devolveu o cadastro';
