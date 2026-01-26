-- =====================================================
-- MIGRACAO 009: ADICIONAR ROLE AUDITOR AO ENUM
-- =====================================================

-- Adicionar 'auditor' ao enum user_role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'auditor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'auditor';
    END IF;
END$$;
