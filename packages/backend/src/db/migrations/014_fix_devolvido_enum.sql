-- =====================================================
-- MIGRACAO 014: FIX ENUM DEVOLVIDO
-- Corrige o enum submission_status para incluir 'devolvido'
-- IMPORTANTE: Este comando NÃO pode rodar em uma transação implícita
-- =====================================================

-- Adicionar 'devolvido' ao enum submission_status
-- Usar DO $$ para verificação condicional
DO $$
DECLARE
    devolvido_exists boolean;
BEGIN
    -- Verificar se 'devolvido' já existe no enum
    SELECT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'submission_status'
        AND e.enumlabel = 'devolvido'
    ) INTO devolvido_exists;

    -- Se não existir, adicionar (fora do bloco de transação)
    IF NOT devolvido_exists THEN
        RAISE NOTICE 'Adicionando valor devolvido ao enum submission_status';
    END IF;
END $$;

-- Este comando precisa rodar FORA de uma transação
-- Se o valor não existir, adicionar manualmente após a migração
-- ALTER TYPE submission_status ADD VALUE 'devolvido';

-- Comentário
COMMENT ON TYPE submission_status IS 'Status de uma submission: pendente, em_analise, aprovado, rejeitado, devolvido';
