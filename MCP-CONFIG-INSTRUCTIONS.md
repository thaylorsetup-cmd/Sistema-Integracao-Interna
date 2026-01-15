# 🔧 Configuração MCP para Análise do ERP

> Instruções para configurar o Model Context Protocol (MCP) em outro projeto para análise do ERP SSW e criação de novas tabelas.

---

## 📋 O que é o MCP?

O MCP (Model Context Protocol) permite que assistentes de IA (Claude, Gemini, etc.) se conectem diretamente ao banco de dados SQL Server do ERP para consultas em tempo real.

---

## 🔑 Credenciais do ERP

| Campo    | Valor                        |
|----------|------------------------------|
| Host     | `177.136.206.200`            |
| Porta    | `1433`                       |
| Database | `DBExpress`                  |
| Usuário  | `mcp_readonly`               |
| Senha    | `Cdq13xJqsl2t21DTUbbqol`     |

> [!IMPORTANT]
> Este usuário tem **SOMENTE LEITURA**. É seguro para análise e consultas, mas não permite alterações no banco.

---

## 📁 Configuração para Claude Desktop

### Passo 1: Localize o arquivo de configuração

O arquivo de configuração do Claude Desktop está em:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Passo 2: Adicione ou edite o arquivo

Copie o conteúdo abaixo e adicione ao arquivo de configuração:

```json
{
  "mcpServers": {
    "erp-sqlserver": {
      "command": "npx",
      "args": [
        "-y",
        "mssql-mcp-server"
      ],
      "env": {
        "MSSQL_HOST": "177.136.206.200",
        "MSSQL_PORT": "1433",
        "MSSQL_DATABASE": "DBExpress",
        "MSSQL_USER": "mcp_readonly",
        "MSSQL_PASSWORD": "Cdq13xJqsl2t21DTUbbqol"
      },
      "description": "ERP SSW - SQL Server - SOMENTE LEITURA"
    }
  }
}
```

### Passo 3: Reinicie o Claude Desktop

Após salvar o arquivo, reinicie completamente o Claude Desktop para que as mudanças tenham efeito.

---

## 📁 Configuração para Gemini (VS Code Extension)

### Passo 1: Localize o arquivo de configuração

O arquivo de configuração está em:

- **Windows**: `%USERPROFILE%\.gemini\settings.json`
- **Workspace**: `.gemini/settings.json` na raiz do projeto

### Passo 2: Adicione a configuração MCP

Adicione a seção `mcpServers` ao arquivo:

```json
{
  "mcpServers": {
    "erp-sqlserver": {
      "command": "npx",
      "args": [
        "-y",
        "mssql-mcp-server"
      ],
      "env": {
        "MSSQL_HOST": "177.136.206.200",
        "MSSQL_PORT": "1433",
        "MSSQL_DATABASE": "DBExpress",
        "MSSQL_USER": "mcp_readonly",
        "MSSQL_PASSWORD": "Cdq13xJqsl2t21DTUbbqol"
      },
      "description": "ERP SSW - SQL Server - SOMENTE LEITURA"
    }
  }
}
```

---

## 🚀 Usando o MCP para Análise

Uma vez configurado, você pode:

### Consultar tabelas existentes
```
"Liste todas as tabelas do banco DBExpress"
"Mostre a estrutura da tabela XXX"
"Quais colunas existem na tabela de lançamentos?"
```

### Analisar dados
```
"Quantos registros existem na tabela de despesas?"
"Mostre dados de exemplo da tabela financeira"
```

### Planejar novas tabelas
```
"Baseado na estrutura atual, sugira uma nova tabela para XXX"
"Quais são os relacionamentos entre as tabelas existentes?"
```

---

## ✅ Verificar Conexão

Para testar a conexão, peça ao assistente:

```
"Liste os 5 primeiros bancos de dados disponíveis no servidor"
```

ou

```
"Execute: SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES"
```

---

## 📦 Pré-requisitos

- **Node.js** instalado (para o comando `npx`)
- Conexão de rede com o servidor `177.136.206.200`
- Porta `1433` liberada no firewall

---

## ⚠️ Notas de Segurança

1. **Nunca compartilhe** este arquivo publicamente
2. O usuário `mcp_readonly` tem **apenas permissões de leitura**
3. Todas as queries são auditadas pelo DBA
4. Não use estas credenciais em aplicações públicas

---

## 📞 Suporte

Em caso de problemas de conexão, verifique:

1. Se o Node.js está instalado: `node --version`
2. Se há conectividade: `Test-NetConnection 177.136.206.200 -Port 1433`
3. Se o firewall permite a conexão

---

*Documento criado em: 15/01/2026*
*Projeto: Guardião Funcional - BBT Transportes*
