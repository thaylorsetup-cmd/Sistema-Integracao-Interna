// src/services/database.ts
// Serviço de conexão com o SQL Server do ERP SSW

import sql from 'mssql';
import type { 
  TableInfo, 
  ColumnInfo, 
  ForeignKeyInfo, 
  IndexInfo, 
  TableStructure,
  QueryResult,
  DatabaseStats,
  RelationshipMap 
} from '../types.js';

// Configuração do banco de dados
const config: sql.config = {
  server: process.env.MSSQL_HOST || '177.136.206.200',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE || 'DBExpress',
  user: process.env.MSSQL_USER || 'mcp_readonly',
  password: process.env.MSSQL_PASSWORD || 'Cdq13xJqsl2t21DTUbbqol',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 60000,
    connectTimeout: 30000
  },
  pool: {
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

/**
 * Obtém uma conexão com o pool do SQL Server
 */
async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    pool = await sql.connect(config);
  }
  return pool;
}

/**
 * Executa uma query e retorna os resultados
 */
export async function executeQuery(query: string, params?: Record<string, unknown>): Promise<QueryResult> {
  const startTime = Date.now();
  const dbPool = await getPool();
  const request = dbPool.request();
  
  // Adicionar parâmetros se fornecidos
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }
  
  const result = await request.query(query);
  const executionTime = Date.now() - startTime;
  
  return {
    columns: result.recordset.columns ? Object.keys(result.recordset.columns) : [],
    rows: result.recordset || [],
    rowCount: result.recordset?.length || 0,
    executionTime
  };
}

/**
 * Lista todas as tabelas do banco de dados
 */
export async function listTables(
  schemaFilter?: string, 
  nameFilter?: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ tables: TableInfo[], total: number }> {
  let whereClause = "WHERE t.type IN ('U', 'V')"; // U = User Table, V = View
  
  if (schemaFilter) {
    whereClause += ` AND s.name LIKE '%${schemaFilter.replace(/'/g, "''")}%'`;
  }
  if (nameFilter) {
    whereClause += ` AND t.name LIKE '%${nameFilter.replace(/'/g, "''")}%'`;
  }

  // Contar total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    ${whereClause.replace("t.type IN ('U', 'V')", "1=1")}
  `;
  
  const countResult = await executeQuery(countQuery);
  const total = countResult.rows[0]?.total as number || 0;

  // Buscar tabelas com paginação
  const query = `
    SELECT 
      s.name AS [schema],
      t.name AS [name],
      CASE t.type 
        WHEN 'U' THEN 'TABLE'
        WHEN 'V' THEN 'VIEW'
        ELSE t.type 
      END AS [type],
      ISNULL(p.rows, 0) AS rowCount
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
    ${whereClause.replace("t.type IN ('U', 'V')", "1=1")}
    
    UNION ALL
    
    SELECT 
      s.name AS [schema],
      v.name AS [name],
      'VIEW' AS [type],
      0 AS rowCount
    FROM sys.views v
    INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
    ${schemaFilter ? `WHERE s.name LIKE '%${schemaFilter.replace(/'/g, "''")}%'` : ''}
    ${nameFilter ? `${schemaFilter ? 'AND' : 'WHERE'} v.name LIKE '%${nameFilter.replace(/'/g, "''")}%'` : ''}
    
    ORDER BY [schema], [name]
    OFFSET ${offset} ROWS
    FETCH NEXT ${limit} ROWS ONLY
  `;

  const result = await executeQuery(query);
  
  return {
    tables: result.rows.map(row => ({
      schema: row.schema as string,
      name: row.name as string,
      type: row.type as string,
      rowCount: row.rowCount as number
    })),
    total
  };
}

/**
 * Obtém a estrutura detalhada de uma tabela
 */
export async function getTableStructure(tableName: string, schemaName: string = 'dbo'): Promise<TableStructure> {
  const fullName = `${schemaName}.${tableName}`;
  
  // Buscar colunas
  const columnsQuery = `
    SELECT 
      c.name AS columnName,
      t.name AS dataType,
      c.max_length AS maxLength,
      c.is_nullable AS isNullable,
      ISNULL(pk.is_primary_key, 0) AS isPrimaryKey,
      CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS isForeignKey,
      dc.definition AS defaultValue,
      ep.value AS description
    FROM sys.columns c
    INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
    INNER JOIN sys.tables tbl ON c.object_id = tbl.object_id
    INNER JOIN sys.schemas s ON tbl.schema_id = s.schema_id
    LEFT JOIN (
      SELECT ic.object_id, ic.column_id, 1 as is_primary_key
      FROM sys.index_columns ic
      INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
      WHERE i.is_primary_key = 1
    ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
    LEFT JOIN sys.foreign_key_columns fk ON c.object_id = fk.parent_object_id AND c.column_id = fk.parent_column_id
    LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
    LEFT JOIN sys.extended_properties ep ON c.object_id = ep.major_id AND c.column_id = ep.minor_id AND ep.name = 'MS_Description'
    WHERE tbl.name = '${tableName.replace(/'/g, "''")}'
      AND s.name = '${schemaName.replace(/'/g, "''")}'
    ORDER BY c.column_id
  `;

  const columnsResult = await executeQuery(columnsQuery);
  
  const columns: ColumnInfo[] = columnsResult.rows.map(row => ({
    name: row.columnName as string,
    dataType: row.dataType as string,
    maxLength: row.maxLength as number | null,
    isNullable: row.isNullable as boolean,
    isPrimaryKey: row.isPrimaryKey as boolean,
    isForeignKey: row.isForeignKey as boolean,
    defaultValue: row.defaultValue as string | null,
    description: row.description as string | null
  }));

  // Buscar foreign keys
  const fkQuery = `
    SELECT 
      fk.name AS constraintName,
      COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS columnName,
      OBJECT_NAME(fkc.referenced_object_id) AS referencedTable,
      COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referencedColumn
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = '${tableName.replace(/'/g, "''")}'
      AND s.name = '${schemaName.replace(/'/g, "''")}'
  `;

  const fkResult = await executeQuery(fkQuery);
  
  const foreignKeys: ForeignKeyInfo[] = fkResult.rows.map(row => ({
    constraintName: row.constraintName as string,
    columnName: row.columnName as string,
    referencedTable: row.referencedTable as string,
    referencedColumn: row.referencedColumn as string
  }));

  // Buscar índices
  const indexQuery = `
    SELECT 
      i.name AS indexName,
      i.type_desc AS indexType,
      i.is_unique AS isUnique,
      i.is_primary_key AS isPrimaryKey,
      STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    INNER JOIN sys.tables t ON i.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = '${tableName.replace(/'/g, "''")}'
      AND s.name = '${schemaName.replace(/'/g, "''")}'
      AND i.name IS NOT NULL
    GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key
  `;

  const indexResult = await executeQuery(indexQuery);
  
  const indexes: IndexInfo[] = indexResult.rows.map(row => ({
    name: row.indexName as string,
    type: row.indexType as string,
    columns: (row.columns as string)?.split(', ') || [],
    isUnique: row.isUnique as boolean,
    isPrimaryKey: row.isPrimaryKey as boolean
  }));

  // Contar linhas
  const countQuery = `SELECT COUNT(*) as cnt FROM ${fullName}`;
  let rowCount = 0;
  try {
    const countResult = await executeQuery(countQuery);
    rowCount = countResult.rows[0]?.cnt as number || 0;
  } catch {
    // Se não conseguir contar, deixa 0
  }

  // Buscar dados de exemplo (5 linhas)
  let sampleData: Record<string, unknown>[] = [];
  try {
    const sampleQuery = `SELECT TOP 5 * FROM ${fullName}`;
    const sampleResult = await executeQuery(sampleQuery);
    sampleData = sampleResult.rows;
  } catch {
    // Se não conseguir buscar sample, deixa vazio
  }

  return {
    schema: schemaName,
    name: tableName,
    fullName,
    columns,
    foreignKeys,
    indexes,
    rowCount,
    sampleData
  };
}

/**
 * Busca valores distintos de uma coluna
 */
export async function getDistinctValues(
  tableName: string, 
  columnName: string, 
  schemaName: string = 'dbo',
  limit: number = 50
): Promise<{ values: unknown[], total: number }> {
  const fullName = `${schemaName}.${tableName}`;
  
  // Contar total de valores distintos
  const countQuery = `SELECT COUNT(DISTINCT [${columnName}]) as total FROM ${fullName}`;
  const countResult = await executeQuery(countQuery);
  const total = countResult.rows[0]?.total as number || 0;
  
  // Buscar valores distintos
  const query = `
    SELECT DISTINCT TOP ${limit} [${columnName}] as value, COUNT(*) as occurrences
    FROM ${fullName}
    GROUP BY [${columnName}]
    ORDER BY COUNT(*) DESC
  `;
  
  const result = await executeQuery(query);
  
  return {
    values: result.rows.map(r => ({ value: r.value, count: r.occurrences })),
    total
  };
}

/**
 * Busca estatísticas do banco de dados
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM sys.tables) as totalTables,
      (SELECT COUNT(*) FROM sys.views) as totalViews,
      (SELECT COUNT(*) FROM sys.procedures) as totalProcedures,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN', 'IF', 'TF')) as totalFunctions
  `;
  
  const result = await executeQuery(query);
  const row = result.rows[0] || {};
  
  // Tamanho do banco
  const sizeQuery = `
    SELECT 
      CAST(SUM(size * 8.0 / 1024) AS DECIMAL(10,2)) as sizeMB
    FROM sys.database_files
  `;
  
  const sizeResult = await executeQuery(sizeQuery);
  const sizeMB = sizeResult.rows[0]?.sizeMB || 0;
  
  return {
    totalTables: row.totalTables as number || 0,
    totalViews: row.totalViews as number || 0,
    totalStoredProcedures: row.totalProcedures as number || 0,
    totalFunctions: row.totalFunctions as number || 0,
    databaseSize: `${sizeMB} MB`,
    lastBackup: null
  };
}

/**
 * Mapeia relacionamentos de uma tabela
 */
export async function getTableRelationships(tableName: string, schemaName: string = 'dbo'): Promise<RelationshipMap> {
  // Tabelas que esta tabela referencia (parent)
  const parentQuery = `
    SELECT 
      OBJECT_NAME(fkc.referenced_object_id) AS relatedTable,
      COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS foreignKey,
      COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referencedColumn
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = '${tableName.replace(/'/g, "''")}'
      AND s.name = '${schemaName.replace(/'/g, "''")}'
  `;
  
  // Tabelas que referenciam esta tabela (child)
  const childQuery = `
    SELECT 
      OBJECT_NAME(fkc.parent_object_id) AS relatedTable,
      COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS foreignKey,
      COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referencedColumn
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables t ON fk.referenced_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = '${tableName.replace(/'/g, "''")}'
      AND s.name = '${schemaName.replace(/'/g, "''")}'
  `;
  
  const parentResult = await executeQuery(parentQuery);
  const childResult = await executeQuery(childQuery);
  
  const relatedTables = [
    ...parentResult.rows.map(row => ({
      table: row.relatedTable as string,
      relationship: 'parent' as const,
      foreignKey: row.foreignKey as string,
      referencedColumn: row.referencedColumn as string
    })),
    ...childResult.rows.map(row => ({
      table: row.relatedTable as string,
      relationship: 'child' as const,
      foreignKey: row.foreignKey as string,
      referencedColumn: row.referencedColumn as string
    }))
  ];
  
  return {
    table: `${schemaName}.${tableName}`,
    relatedTables
  };
}

/**
 * Busca tabelas por padrão de nome (para encontrar tabelas relacionadas)
 */
export async function searchTables(pattern: string): Promise<TableInfo[]> {
  const query = `
    SELECT 
      s.name AS [schema],
      t.name AS [name],
      'TABLE' AS [type],
      ISNULL(p.rows, 0) AS rowCount
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
    WHERE t.name LIKE '%${pattern.replace(/'/g, "''")}%'
    ORDER BY t.name
  `;
  
  const result = await executeQuery(query);
  
  return result.rows.map(row => ({
    schema: row.schema as string,
    name: row.name as string,
    type: row.type as string,
    rowCount: row.rowCount as number
  }));
}

/**
 * Fecha a conexão com o banco
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
