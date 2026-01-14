// src/services/formatters.ts
// Utilitários de formatação de respostas

import type { 
  TableInfo, 
  TableStructure, 
  QueryResult, 
  DatabaseStats,
  RelationshipMap 
} from '../types.js';
import { CHARACTER_LIMIT } from '../constants.js';

/**
 * Formata lista de tabelas em Markdown
 */
export function formatTablesAsMarkdown(
  tables: TableInfo[], 
  total: number,
  offset: number,
  limit: number
): string {
  const lines: string[] = [];
  
  lines.push(`# 📊 Tabelas do Banco de Dados`);
  lines.push('');
  lines.push(`**Total encontrado:** ${total} tabelas/views`);
  lines.push(`**Exibindo:** ${offset + 1} a ${Math.min(offset + tables.length, total)}`);
  lines.push('');
  lines.push('| Schema | Nome | Tipo | Linhas |');
  lines.push('|--------|------|------|--------|');
  
  for (const table of tables) {
    const rowCount = table.rowCount > 0 ? table.rowCount.toLocaleString() : '-';
    lines.push(`| ${table.schema} | \`${table.name}\` | ${table.type} | ${rowCount} |`);
  }
  
  if (total > offset + tables.length) {
    lines.push('');
    lines.push(`> 💡 Use \`offset: ${offset + limit}\` para ver mais tabelas.`);
  }
  
  return truncateIfNeeded(lines.join('\n'));
}

/**
 * Formata estrutura de tabela em Markdown
 */
export function formatTableStructureAsMarkdown(structure: TableStructure): string {
  const lines: string[] = [];
  
  lines.push(`# 📋 Estrutura da Tabela: \`${structure.fullName}\``);
  lines.push('');
  lines.push(`**Linhas:** ${structure.rowCount.toLocaleString()}`);
  lines.push('');
  
  // Colunas
  lines.push('## Colunas');
  lines.push('');
  lines.push('| Coluna | Tipo | Null | PK | FK | Descrição |');
  lines.push('|--------|------|------|----|----|-----------|');
  
  for (const col of structure.columns) {
    const pk = col.isPrimaryKey ? '🔑' : '';
    const fk = col.isForeignKey ? '🔗' : '';
    const nullable = col.isNullable ? 'Sim' : 'Não';
    const type = col.maxLength ? `${col.dataType}(${col.maxLength})` : col.dataType;
    const desc = col.description || '-';
    lines.push(`| \`${col.name}\` | ${type} | ${nullable} | ${pk} | ${fk} | ${desc} |`);
  }
  
  // Foreign Keys
  if (structure.foreignKeys.length > 0) {
    lines.push('');
    lines.push('## 🔗 Chaves Estrangeiras');
    lines.push('');
    lines.push('| Constraint | Coluna | → Tabela | → Coluna |');
    lines.push('|------------|--------|----------|----------|');
    
    for (const fk of structure.foreignKeys) {
      lines.push(`| ${fk.constraintName} | \`${fk.columnName}\` | \`${fk.referencedTable}\` | \`${fk.referencedColumn}\` |`);
    }
  }
  
  // Índices
  if (structure.indexes.length > 0) {
    lines.push('');
    lines.push('## 📑 Índices');
    lines.push('');
    lines.push('| Nome | Tipo | Colunas | Único | PK |');
    lines.push('|------|------|---------|-------|-----|');
    
    for (const idx of structure.indexes) {
      const unique = idx.isUnique ? '✓' : '';
      const pk = idx.isPrimaryKey ? '🔑' : '';
      lines.push(`| ${idx.name} | ${idx.type} | ${idx.columns.join(', ')} | ${unique} | ${pk} |`);
    }
  }
  
  // Dados de exemplo
  if (structure.sampleData.length > 0) {
    lines.push('');
    lines.push('## 📝 Dados de Exemplo (5 primeiras linhas)');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(structure.sampleData, null, 2).substring(0, 3000));
    lines.push('```');
  }
  
  return truncateIfNeeded(lines.join('\n'));
}

/**
 * Formata resultado de query em Markdown
 */
export function formatQueryResultAsMarkdown(result: QueryResult): string {
  const lines: string[] = [];
  
  lines.push(`# 🔍 Resultado da Query`);
  lines.push('');
  lines.push(`**Linhas retornadas:** ${result.rowCount}`);
  lines.push(`**Tempo de execução:** ${result.executionTime}ms`);
  lines.push('');
  
  if (result.rows.length === 0) {
    lines.push('> ℹ️ Nenhum resultado encontrado.');
    return lines.join('\n');
  }
  
  // Criar tabela markdown
  const columns = Object.keys(result.rows[0]);
  lines.push('| ' + columns.join(' | ') + ' |');
  lines.push('|' + columns.map(() => '---').join('|') + '|');
  
  for (const row of result.rows.slice(0, 50)) { // Limitar a 50 linhas no markdown
    const values = columns.map(col => {
      const val = row[col];
      if (val === null) return 'NULL';
      if (typeof val === 'object') return JSON.stringify(val).substring(0, 50);
      return String(val).substring(0, 100);
    });
    lines.push('| ' + values.join(' | ') + ' |');
  }
  
  if (result.rows.length > 50) {
    lines.push('');
    lines.push(`> ⚠️ Exibindo 50 de ${result.rows.length} linhas. Use formato JSON para ver todos.`);
  }
  
  return truncateIfNeeded(lines.join('\n'));
}

/**
 * Formata estatísticas do banco em Markdown
 */
export function formatDatabaseStatsAsMarkdown(stats: DatabaseStats): string {
  const lines: string[] = [];
  
  lines.push('# 📊 Estatísticas do Banco de Dados');
  lines.push('');
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---------|-------|`);
  lines.push(`| Tabelas | ${stats.totalTables} |`);
  lines.push(`| Views | ${stats.totalViews} |`);
  lines.push(`| Stored Procedures | ${stats.totalStoredProcedures} |`);
  lines.push(`| Functions | ${stats.totalFunctions} |`);
  lines.push(`| Tamanho | ${stats.databaseSize} |`);
  
  return lines.join('\n');
}

/**
 * Formata relacionamentos em Markdown
 */
export function formatRelationshipsAsMarkdown(relationships: RelationshipMap): string {
  const lines: string[] = [];
  
  lines.push(`# 🔗 Relacionamentos: \`${relationships.table}\``);
  lines.push('');
  
  if (relationships.relatedTables.length === 0) {
    lines.push('> ℹ️ Nenhum relacionamento encontrado para esta tabela.');
    return lines.join('\n');
  }
  
  const parents = relationships.relatedTables.filter(r => r.relationship === 'parent');
  const children = relationships.relatedTables.filter(r => r.relationship === 'child');
  
  if (parents.length > 0) {
    lines.push('## ⬆️ Esta tabela referencia (pai):');
    lines.push('');
    lines.push('| Tabela | FK (local) | → Coluna (remota) |');
    lines.push('|--------|------------|-------------------|');
    for (const rel of parents) {
      lines.push(`| \`${rel.table}\` | ${rel.foreignKey} | ${rel.referencedColumn} |`);
    }
    lines.push('');
  }
  
  if (children.length > 0) {
    lines.push('## ⬇️ Tabelas que referenciam esta (filhos):');
    lines.push('');
    lines.push('| Tabela | FK (remota) | → Coluna (local) |');
    lines.push('|--------|-------------|------------------|');
    for (const rel of children) {
      lines.push(`| \`${rel.table}\` | ${rel.foreignKey} | ${rel.referencedColumn} |`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Formata valores distintos em Markdown
 */
export function formatDistinctValuesAsMarkdown(
  tableName: string,
  columnName: string,
  values: { value: unknown; count: number }[],
  total: number
): string {
  const lines: string[] = [];
  
  lines.push(`# 📋 Valores Distintos: \`${tableName}.${columnName}\``);
  lines.push('');
  lines.push(`**Total de valores únicos:** ${total}`);
  lines.push('');
  lines.push('| Valor | Ocorrências |');
  lines.push('|-------|-------------|');
  
  for (const item of values) {
    const val = item.value === null ? 'NULL' : String(item.value).substring(0, 100);
    lines.push(`| \`${val}\` | ${item.count.toLocaleString()} |`);
  }
  
  return truncateIfNeeded(lines.join('\n'));
}

/**
 * Trunca texto se exceder o limite
 */
function truncateIfNeeded(text: string): string {
  if (text.length > CHARACTER_LIMIT) {
    return text.substring(0, CHARACTER_LIMIT - 100) + '\n\n> ⚠️ Resposta truncada. Use filtros ou formato JSON para dados completos.';
  }
  return text;
}
