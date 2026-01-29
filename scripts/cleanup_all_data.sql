-- =====================================================
-- SCRIPT DE LIMPEZA TOTAL - APAGA TODOS OS DADOS DE TESTE
-- 
-- ATENÇÃO: Este script apaga TODAS as submissions e documentos!
-- NÃO apaga usuários nem estrutura das tabelas.
-- =====================================================
-- Iniciar transação
BEGIN;
-- Mostrar contagem ANTES
SELECT 'ANTES DA LIMPEZA' as etapa;
SELECT 'submissions' as tabela,
    COUNT(*) as registros
FROM submissions
UNION ALL
SELECT 'documents',
    COUNT(*)
FROM documents
UNION ALL
SELECT 'checklists',
    COUNT(*)
FROM checklists;
-- 1. Apagar TODOS os documentos
DELETE FROM documents;
-- 2. Apagar TODOS os checklists
DELETE FROM checklists;
-- 3. Apagar TODAS as submissions
DELETE FROM submissions;
-- Mostrar contagem DEPOIS
SELECT 'DEPOIS DA LIMPEZA' as etapa;
SELECT 'submissions' as tabela,
    COUNT(*) as registros
FROM submissions
UNION ALL
SELECT 'documents',
    COUNT(*)
FROM documents
UNION ALL
SELECT 'checklists',
    COUNT(*)
FROM checklists;
-- Confirmar transação
COMMIT;
SELECT 'LIMPEZA TOTAL CONCLUIDA - Banco zerado para novos testes' as resultado;