-- =====================================================
-- SCRIPT DE LIMPEZA DO BANCO DE DADOS BBT CONNECT
-- Remove documentos e submissions de teste/órfãos
-- 
-- COMO EXECUTAR VIA SSH:
-- 1. Conectar ao servidor: ssh root@192.168.0.149
-- 2. cd /opt/bbt-connect
-- 3. docker compose -f docker-compose.simple.yml exec postgres psql -U bbt_user -d bbt_connect
-- 4. Copiar e colar o conteúdo abaixo
-- =====================================================
-- Iniciar transação
BEGIN;
-- Mostrar contagem ANTES da limpeza
SELECT 'ANTES DA LIMPEZA' as etapa;
SELECT 'submissions' as tabela,
    COUNT(*) as registros
FROM submissions
UNION ALL
SELECT 'documents',
    COUNT(*)
FROM documents;
-- 1. Deletar documentos sem submission válida (órfãos)
DELETE FROM documents
WHERE submission_id NOT IN (
        SELECT id
        FROM submissions
    );
-- 2. Deletar checklists órfãos
DELETE FROM checklists
WHERE submission_id NOT IN (
        SELECT id
        FROM submissions
    );
-- 3. Deletar delays órfãos
DELETE FROM submission_delays
WHERE submission_id NOT IN (
        SELECT id
        FROM submissions
    );
-- 4. Limpar submissions vazias (sem documentos) que estão pendentes há mais de 1 hora
DELETE FROM submissions
WHERE status = 'pendente'
    AND id NOT IN (
        SELECT DISTINCT submission_id
        FROM documents
        WHERE submission_id IS NOT NULL
    )
    AND created_at < NOW() - INTERVAL '1 hour';
-- Mostrar contagem DEPOIS da limpeza
SELECT 'DEPOIS DA LIMPEZA' as etapa;
SELECT 'submissions' as tabela,
    COUNT(*) as registros
FROM submissions
UNION ALL
SELECT 'documents',
    COUNT(*)
FROM documents;
-- Mostrar distribuição por status
SELECT 'DISTRIBUICAO POR STATUS' as etapa;
SELECT status,
    COUNT(*) as total
FROM submissions
GROUP BY status
ORDER BY total DESC;
-- Confirmar transação
COMMIT;
-- Sucesso
SELECT 'LIMPEZA CONCLUIDA COM SUCESSO' as resultado;