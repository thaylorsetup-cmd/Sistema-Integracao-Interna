# 🗄️ SSW ERP MCP Server

MCP Server para exploração e análise do banco de dados do **ERP SSW** da **BBT Transportes**.

## 📋 Sobre

Este MCP permite que Claude (ou outros LLMs) explorem a estrutura do banco de dados SQL Server do ERP SSW, facilitando:

- Descoberta de tabelas e relacionamentos
- Análise de estrutura de dados
- Consultas SQL (somente leitura)
- Mapeamento de módulos do sistema

## 🚀 Instalação

```bash
# Clonar/copiar o projeto
cd ssw-erp-mcp-server

# Instalar dependências
npm install

# Build
npm run build

# Rodar (stdio)
npm start

# Rodar (HTTP)
TRANSPORT=http npm start
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` ou configure as variáveis:

```env
MSSQL_HOST=177.136.206.200
MSSQL_PORT=1433
MSSQL_DATABASE=DBExpress
MSSQL_USER=mcp_readonly
MSSQL_PASSWORD=Cdq13xJqsl2t21DTUbbqol

# Para HTTP
PORT=3100
TRANSPORT=http  # ou 'stdio' (padrão)
```

### Configuração no Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ssw-erp": {
      "command": "node",
      "args": ["/caminho/para/ssw-erp-mcp-server/dist/index.js"],
      "env": {
        "MSSQL_HOST": "177.136.206.200",
        "MSSQL_PORT": "1433",
        "MSSQL_DATABASE": "DBExpress",
        "MSSQL_USER": "mcp_readonly",
        "MSSQL_PASSWORD": "Cdq13xJqsl2t21DTUbbqol"
      }
    }
  }
}
```

## 🛠️ Ferramentas Disponíveis

### 1. `ssw_list_tables`
Lista todas as tabelas e views do banco de dados.

```json
{
  "schemaFilter": "dbo",
  "nameFilter": "coleta",
  "limit": 100,
  "offset": 0,
  "responseFormat": "markdown"
}
```

### 2. `ssw_describe_table`
Retorna a estrutura completa de uma tabela.

```json
{
  "tableName": "COLETAS",
  "schemaName": "dbo",
  "includeSampleData": true,
  "responseFormat": "markdown"
}
```

### 3. `ssw_execute_query`
Executa queries SQL SELECT (somente leitura).

```json
{
  "query": "SELECT TOP 10 * FROM COLETAS ORDER BY DATA_COLETA DESC",
  "limit": 100,
  "responseFormat": "markdown"
}
```

### 4. `ssw_get_distinct_values`
Busca valores distintos de uma coluna.

```json
{
  "tableName": "COLETAS",
  "columnName": "STATUS",
  "limit": 50,
  "responseFormat": "markdown"
}
```

### 5. `ssw_get_relationships`
Mostra relacionamentos (FK) de uma tabela.

```json
{
  "tableName": "COLETAS",
  "schemaName": "dbo",
  "responseFormat": "markdown"
}
```

### 6. `ssw_search_tables`
Busca tabelas por padrão de nome.

```json
{
  "pattern": "motor",
  "responseFormat": "markdown"
}
```

### 7. `ssw_get_database_stats`
Estatísticas gerais do banco.

```json
{
  "responseFormat": "markdown"
}
```

### 8. `ssw_analyze_module`
Análise completa de um módulo do ERP.

```json
{
  "moduleName": "coleta",
  "responseFormat": "markdown"
}
```

**Módulos disponíveis:** coleta, motorista, veiculo, cte, nfe, fatura, pagamento, receber, cliente, fornecedor, manifesto, entrega, ocorrencia, usuario, filial, agregado, cadastro

## ⚠️ Segurança

- Este MCP tem **acesso somente leitura** ao banco de dados
- Queries de modificação (INSERT, UPDATE, DELETE, etc.) são **bloqueadas**
- Credenciais devem ser mantidas em variáveis de ambiente
- Nunca compartilhe as credenciais em código versionado

## 📝 Exemplos de Uso

### Descobrir estrutura do módulo de coletas:

1. `ssw_analyze_module({ moduleName: 'coleta' })` - Listar tabelas relacionadas
2. `ssw_describe_table({ tableName: 'COLETAS' })` - Ver estrutura
3. `ssw_get_distinct_values({ tableName: 'COLETAS', columnName: 'STATUS' })` - Ver status possíveis
4. `ssw_get_relationships({ tableName: 'COLETAS' })` - Ver tabelas relacionadas

### Analisar dados de motoristas:

1. `ssw_search_tables({ pattern: 'motor' })` - Encontrar tabelas
2. `ssw_execute_query({ query: "SELECT TOP 5 * FROM MOTORISTAS" })` - Ver dados
3. `ssw_describe_table({ tableName: 'MOTORISTAS' })` - Ver estrutura completa

## 🏗️ Estrutura do Projeto

```
ssw-erp-mcp-server/
├── src/
│   ├── index.ts           # Servidor MCP e registro de ferramentas
│   ├── types.ts           # Tipos TypeScript
│   ├── constants.ts       # Constantes e configurações
│   ├── schemas/
│   │   └── index.ts       # Schemas Zod para validação
│   └── services/
│       ├── database.ts    # Conexão e queries SQL Server
│       └── formatters.ts  # Formatação de respostas
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 Licença

MIT - BBT Transportes 2024
