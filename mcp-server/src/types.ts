// src/types.ts
// Tipos e interfaces para o MCP do ERP SSW

export interface TableInfo {
  schema: string;
  name: string;
  type: string;
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  maxLength: number | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue: string | null;
  description: string | null;
}

export interface ForeignKeyInfo {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface IndexInfo {
  name: string;
  type: string;
  columns: string[];
  isUnique: boolean;
  isPrimaryKey: boolean;
}

export interface TableStructure {
  schema: string;
  name: string;
  fullName: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  indexes: IndexInfo[];
  rowCount: number;
  sampleData: Record<string, unknown>[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface DatabaseStats {
  totalTables: number;
  totalViews: number;
  totalStoredProcedures: number;
  totalFunctions: number;
  databaseSize: string;
  lastBackup: string | null;
}

export interface RelationshipMap {
  table: string;
  relatedTables: {
    table: string;
    relationship: 'parent' | 'child';
    foreignKey: string;
    referencedColumn: string;
  }[];
}

export enum ResponseFormat {
  JSON = 'json',
  MARKDOWN = 'markdown'
}

export interface PaginationInfo {
  total: number;
  count: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset?: number;
}
