// src/schemas/index.ts
// Schemas Zod para validação de inputs das ferramentas

import { z } from 'zod';
import { ResponseFormat } from '../types.js';

/**
 * Schema para listar tabelas
 */
export const ListTablesInputSchema = z.object({
  schemaFilter: z.string()
    .optional()
    .describe("Filtrar por nome do schema (ex: 'dbo')"),
  nameFilter: z.string()
    .optional()
    .describe("Filtrar tabelas que contenham este texto no nome (ex: 'coleta', 'motorista')"),
  limit: z.number()
    .int()
    .min(1)
    .max(500)
    .default(100)
    .describe("Número máximo de tabelas a retornar (padrão: 100)"),
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .describe("Número de tabelas a pular para paginação"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type ListTablesInput = z.infer<typeof ListTablesInputSchema>;

/**
 * Schema para descrever estrutura de tabela
 */
export const DescribeTableInputSchema = z.object({
  tableName: z.string()
    .min(1)
    .describe("Nome da tabela a ser descrita (ex: 'CLIENTES', 'MOTORISTAS')"),
  schemaName: z.string()
    .default('dbo')
    .describe("Nome do schema (padrão: 'dbo')"),
  includeSampleData: z.boolean()
    .default(true)
    .describe("Incluir 5 linhas de exemplo dos dados"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type DescribeTableInput = z.infer<typeof DescribeTableInputSchema>;

/**
 * Schema para executar query
 */
export const ExecuteQueryInputSchema = z.object({
  query: z.string()
    .min(1)
    .max(10000)
    .describe("Query SQL a ser executada (SOMENTE SELECT - queries de modificação serão rejeitadas)"),
  limit: z.number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe("Número máximo de linhas a retornar"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type ExecuteQueryInput = z.infer<typeof ExecuteQueryInputSchema>;

/**
 * Schema para buscar valores distintos
 */
export const GetDistinctValuesInputSchema = z.object({
  tableName: z.string()
    .min(1)
    .describe("Nome da tabela"),
  columnName: z.string()
    .min(1)
    .describe("Nome da coluna para buscar valores distintos"),
  schemaName: z.string()
    .default('dbo')
    .describe("Nome do schema (padrão: 'dbo')"),
  limit: z.number()
    .int()
    .min(1)
    .max(200)
    .default(50)
    .describe("Número máximo de valores distintos a retornar"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type GetDistinctValuesInput = z.infer<typeof GetDistinctValuesInputSchema>;

/**
 * Schema para buscar relacionamentos
 */
export const GetRelationshipsInputSchema = z.object({
  tableName: z.string()
    .min(1)
    .describe("Nome da tabela para buscar relacionamentos"),
  schemaName: z.string()
    .default('dbo')
    .describe("Nome do schema (padrão: 'dbo')"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type GetRelationshipsInput = z.infer<typeof GetRelationshipsInputSchema>;

/**
 * Schema para buscar tabelas
 */
export const SearchTablesInputSchema = z.object({
  pattern: z.string()
    .min(1)
    .describe("Padrão de busca para nomes de tabela (ex: 'coleta', 'cte', 'fatura')"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type SearchTablesInput = z.infer<typeof SearchTablesInputSchema>;

/**
 * Schema para estatísticas do banco
 */
export const GetDatabaseStatsInputSchema = z.object({
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type GetDatabaseStatsInput = z.infer<typeof GetDatabaseStatsInputSchema>;

/**
 * Schema para análise completa (múltiplas tabelas)
 */
export const AnalyzeModuleInputSchema = z.object({
  moduleName: z.string()
    .min(1)
    .describe("Nome do módulo/área para analisar (ex: 'coleta', 'motorista', 'fatura', 'cte', 'pagamento')"),
  responseFormat: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de saída: 'markdown' ou 'json'")
}).strict();

export type AnalyzeModuleInput = z.infer<typeof AnalyzeModuleInputSchema>;
