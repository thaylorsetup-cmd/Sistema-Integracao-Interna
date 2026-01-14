// src/index.ts
// MCP Server para exploração do ERP SSW da BBT Transportes

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

import { SERVER_INFO, DANGEROUS_KEYWORDS, MODULE_PATTERNS } from './constants.js';
import { ResponseFormat } from './types.js';
import {
  ListTablesInputSchema,
  DescribeTableInputSchema,
  ExecuteQueryInputSchema,
  GetDistinctValuesInputSchema,
  GetRelationshipsInputSchema,
  SearchTablesInputSchema,
  GetDatabaseStatsInputSchema,
  AnalyzeModuleInputSchema,
  type ListTablesInput,
  type DescribeTableInput,
  type ExecuteQueryInput,
  type GetDistinctValuesInput,
  type GetRelationshipsInput,
  type SearchTablesInput,
  type GetDatabaseStatsInput,
  type AnalyzeModuleInput
} from './schemas/index.js';
import {
  listTables,
  getTableStructure,
  executeQuery,
  getDistinctValues,
  getTableRelationships,
  searchTables,
  getDatabaseStats
} from './services/database.js';
import {
  formatTablesAsMarkdown,
  formatTableStructureAsMarkdown,
  formatQueryResultAsMarkdown,
  formatDatabaseStatsAsMarkdown,
  formatRelationshipsAsMarkdown,
  formatDistinctValuesAsMarkdown
} from './services/formatters.js';

// Criar servidor MCP
const server = new McpServer({
  name: SERVER_INFO.name,
  version: SERVER_INFO.version
});

// ============================================================
// TOOL 1: Listar Tabelas
// ============================================================
server.registerTool(
  'ssw_list_tables',
  {
    title: 'Listar Tabelas do ERP',
    description: `Lista todas as tabelas e views do banco de dados do ERP SSW.

Use esta ferramenta para:
- Descobrir quais tabelas existem no banco
- Filtrar tabelas por nome ou schema
- Ver quantidade de registros por tabela

Args:
  - schemaFilter (string, opcional): Filtrar por schema
  - nameFilter (string, opcional): Filtrar por nome (busca parcial)
  - limit (number): Máximo de tabelas (padrão: 100)
  - offset (number): Pular N tabelas para paginação
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - Listar todas: ssw_list_tables({})
  - Buscar coletas: ssw_list_tables({ nameFilter: 'coleta' })
  - Ver próximas 100: ssw_list_tables({ offset: 100 })`,
    inputSchema: ListTablesInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: ListTablesInput) => {
    try {
      const { tables, total } = await listTables(
        params.schemaFilter,
        params.nameFilter,
        params.limit,
        params.offset
      );

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ tables, total, offset: params.offset, limit: params.limit }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: formatTablesAsMarkdown(tables, total, params.offset, params.limit)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao listar tabelas: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 2: Descrever Estrutura de Tabela
// ============================================================
server.registerTool(
  'ssw_describe_table',
  {
    title: 'Descrever Estrutura de Tabela',
    description: `Retorna a estrutura completa de uma tabela: colunas, tipos, chaves, índices e dados de exemplo.

Use esta ferramenta para:
- Entender a estrutura de uma tabela específica
- Ver os tipos de dados de cada coluna
- Identificar chaves primárias e estrangeiras
- Ver relacionamentos com outras tabelas
- Obter exemplos de dados reais

Args:
  - tableName (string): Nome da tabela (ex: 'CLIENTES')
  - schemaName (string): Schema (padrão: 'dbo')
  - includeSampleData (boolean): Incluir 5 linhas de exemplo (padrão: true)
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - ssw_describe_table({ tableName: 'COLETAS' })
  - ssw_describe_table({ tableName: 'MOTORISTAS', includeSampleData: false })`,
    inputSchema: DescribeTableInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: DescribeTableInput) => {
    try {
      const structure = await getTableStructure(params.tableName, params.schemaName);

      if (!params.includeSampleData) {
        structure.sampleData = [];
      }

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(structure, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: formatTableStructureAsMarkdown(structure)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao descrever tabela '${params.tableName}': ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 3: Executar Query SQL
// ============================================================
server.registerTool(
  'ssw_execute_query',
  {
    title: 'Executar Query SQL',
    description: `Executa uma query SQL SELECT no banco de dados do ERP.

⚠️ IMPORTANTE: Apenas queries SELECT são permitidas. Queries de modificação (INSERT, UPDATE, DELETE, etc.) serão rejeitadas.

Use esta ferramenta para:
- Buscar dados específicos
- Fazer análises customizadas
- Cruzar informações entre tabelas
- Contar registros com condições

Args:
  - query (string): Query SQL (apenas SELECT)
  - limit (number): Máximo de linhas (padrão: 100, máx: 1000)
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - ssw_execute_query({ query: "SELECT TOP 10 * FROM COLETAS ORDER BY DATA_COLETA DESC" })
  - ssw_execute_query({ query: "SELECT STATUS, COUNT(*) as QTD FROM MOTORISTAS GROUP BY STATUS" })`,
    inputSchema: ExecuteQueryInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: ExecuteQueryInput) => {
    try {
      // Validar query - apenas SELECT
      const upperQuery = params.query.toUpperCase().trim();
      
      for (const keyword of DANGEROUS_KEYWORDS) {
        if (upperQuery.includes(keyword)) {
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `❌ Query rejeitada: Comando '${keyword}' não é permitido. Apenas SELECT é permitido neste MCP (acesso read-only).`
            }]
          };
        }
      }

      if (!upperQuery.startsWith('SELECT')) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: '❌ Query rejeitada: Apenas queries SELECT são permitidas.'
          }]
        };
      }

      // Adicionar TOP se não existir para respeitar o limit
      let finalQuery = params.query;
      if (!upperQuery.includes('TOP ') && !upperQuery.includes('OFFSET')) {
        finalQuery = params.query.replace(/^SELECT/i, `SELECT TOP ${params.limit}`);
      }

      const result = await executeQuery(finalQuery);

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: formatQueryResultAsMarkdown(result)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao executar query: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 4: Buscar Valores Distintos
// ============================================================
server.registerTool(
  'ssw_get_distinct_values',
  {
    title: 'Buscar Valores Distintos de Coluna',
    description: `Retorna os valores distintos de uma coluna específica, ordenados por frequência.

Use esta ferramenta para:
- Descobrir quais valores um campo pode ter (ex: STATUS)
- Entender a distribuição dos dados
- Identificar valores de enumeração

Args:
  - tableName (string): Nome da tabela
  - columnName (string): Nome da coluna
  - schemaName (string): Schema (padrão: 'dbo')
  - limit (number): Máximo de valores (padrão: 50)
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - ssw_get_distinct_values({ tableName: 'COLETAS', columnName: 'STATUS' })
  - ssw_get_distinct_values({ tableName: 'MOTORISTAS', columnName: 'SITUACAO' })`,
    inputSchema: GetDistinctValuesInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: GetDistinctValuesInput) => {
    try {
      const result = await getDistinctValues(
        params.tableName,
        params.columnName,
        params.schemaName,
        params.limit
      );

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: formatDistinctValuesAsMarkdown(
            params.tableName,
            params.columnName,
            result.values as { value: unknown; count: number }[],
            result.total
          )
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao buscar valores: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 5: Buscar Relacionamentos
// ============================================================
server.registerTool(
  'ssw_get_relationships',
  {
    title: 'Buscar Relacionamentos de Tabela',
    description: `Mostra todas as tabelas relacionadas (pai e filho) com uma tabela específica.

Use esta ferramenta para:
- Entender como as tabelas se conectam
- Descobrir tabelas relacionadas
- Mapear o modelo de dados

Args:
  - tableName (string): Nome da tabela
  - schemaName (string): Schema (padrão: 'dbo')
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - ssw_get_relationships({ tableName: 'COLETAS' })
  - ssw_get_relationships({ tableName: 'CTE' })`,
    inputSchema: GetRelationshipsInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: GetRelationshipsInput) => {
    try {
      const relationships = await getTableRelationships(params.tableName, params.schemaName);

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(relationships, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: formatRelationshipsAsMarkdown(relationships)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao buscar relacionamentos: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 6: Buscar Tabelas por Padrão
// ============================================================
server.registerTool(
  'ssw_search_tables',
  {
    title: 'Buscar Tabelas por Nome',
    description: `Busca tabelas cujo nome contenha um padrão específico.

Use esta ferramenta para:
- Encontrar tabelas relacionadas a um módulo
- Descobrir tabelas de um domínio específico

Args:
  - pattern (string): Padrão de busca (ex: 'coleta', 'cte', 'motor')
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - ssw_search_tables({ pattern: 'coleta' })
  - ssw_search_tables({ pattern: 'cte' })
  - ssw_search_tables({ pattern: 'motor' })`,
    inputSchema: SearchTablesInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: SearchTablesInput) => {
    try {
      const tables = await searchTables(params.pattern);

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ pattern: params.pattern, tables, count: tables.length }, null, 2)
          }]
        };
      }

      const lines = [
        `# 🔍 Busca: "${params.pattern}"`,
        '',
        `**Tabelas encontradas:** ${tables.length}`,
        '',
        '| Schema | Nome | Linhas |',
        '|--------|------|--------|',
        ...tables.map(t => `| ${t.schema} | \`${t.name}\` | ${t.rowCount.toLocaleString()} |`)
      ];

      return {
        content: [{
          type: 'text',
          text: lines.join('\n')
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro na busca: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 7: Estatísticas do Banco
// ============================================================
server.registerTool(
  'ssw_get_database_stats',
  {
    title: 'Estatísticas do Banco de Dados',
    description: `Retorna estatísticas gerais do banco de dados: total de tabelas, views, procedures, etc.

Use esta ferramenta para:
- Ter uma visão geral do tamanho do banco
- Entender a complexidade do ERP

Args:
  - responseFormat ('markdown' | 'json'): Formato de saída`,
    inputSchema: GetDatabaseStatsInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: GetDatabaseStatsInput) => {
    try {
      const stats = await getDatabaseStats();

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(stats, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: formatDatabaseStatsAsMarkdown(stats)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao buscar estatísticas: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// TOOL 8: Analisar Módulo Completo
// ============================================================
server.registerTool(
  'ssw_analyze_module',
  {
    title: 'Analisar Módulo do ERP',
    description: `Faz uma análise completa de um módulo/área do ERP, buscando todas as tabelas relacionadas.

Módulos disponíveis: coleta, motorista, veiculo, cte, nfe, fatura, pagamento, receber, cliente, fornecedor, manifesto, entrega, ocorrencia, usuario, filial, agregado, cadastro

Use esta ferramenta para:
- Mapear todas as tabelas de um módulo
- Entender a estrutura de uma área do sistema
- Descobrir tabelas que você não conhecia

Args:
  - moduleName (string): Nome do módulo (ex: 'coleta', 'motorista')
  - responseFormat ('markdown' | 'json'): Formato de saída

Exemplos:
  - ssw_analyze_module({ moduleName: 'coleta' })
  - ssw_analyze_module({ moduleName: 'motorista' })`,
    inputSchema: AnalyzeModuleInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: AnalyzeModuleInput) => {
    try {
      const moduleLower = params.moduleName.toLowerCase();
      const patterns = MODULE_PATTERNS[moduleLower] || [params.moduleName.toUpperCase()];
      
      const allTables: { pattern: string; tables: Awaited<ReturnType<typeof searchTables>> }[] = [];
      
      for (const pattern of patterns) {
        const tables = await searchTables(pattern);
        if (tables.length > 0) {
          allTables.push({ pattern, tables });
        }
      }

      // Remover duplicatas
      const uniqueTables = new Map<string, typeof allTables[0]['tables'][0]>();
      for (const { tables } of allTables) {
        for (const table of tables) {
          uniqueTables.set(table.name, table);
        }
      }

      const finalTables = Array.from(uniqueTables.values());

      if (params.responseFormat === ResponseFormat.JSON) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              module: params.moduleName,
              patterns,
              tables: finalTables,
              totalTables: finalTables.length
            }, null, 2)
          }]
        };
      }

      const lines = [
        `# 📊 Análise do Módulo: ${params.moduleName.toUpperCase()}`,
        '',
        `**Padrões buscados:** ${patterns.join(', ')}`,
        `**Tabelas encontradas:** ${finalTables.length}`,
        '',
        '## Tabelas',
        '',
        '| Schema | Nome | Linhas |',
        '|--------|------|--------|',
        ...finalTables.map(t => `| ${t.schema} | \`${t.name}\` | ${t.rowCount.toLocaleString()} |`),
        '',
        '> 💡 Use `ssw_describe_table` para ver a estrutura detalhada de cada tabela.'
      ];

      return {
        content: [{
          type: 'text',
          text: lines.join('\n')
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Erro ao analisar módulo: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ============================================================
// Inicialização do Servidor
// ============================================================

async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_INFO.name} v${SERVER_INFO.version} rodando via stdio`);
}

async function runHTTP() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: SERVER_INFO.name, version: SERVER_INFO.version });
  });

  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || '3100');
  app.listen(port, () => {
    console.error(`${SERVER_INFO.name} rodando em http://localhost:${port}/mcp`);
  });
}

// Escolher transporte baseado em variável de ambiente
const transport = process.env.TRANSPORT || 'stdio';
if (transport === 'http') {
  runHTTP().catch(error => {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  });
} else {
  runStdio().catch(error => {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  });
}
