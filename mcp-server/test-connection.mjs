// Script de teste de conexão e mapeamento do banco ERP SSW
// Execute com: node test-connection.mjs

import sql from 'mssql';

const config = {
    server: '177.136.206.200',
    port: 1433,
    database: 'DBExpress',
    user: 'mcp_readonly',
    password: 'Cdq13xJqsl2t21DTUbbqol',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 60000,
        connectTimeout: 30000
    }
};

async function testConnection() {
    console.log('🔌 Conectando ao SQL Server ERP SSW...');
    console.log(`   Host: ${config.server}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);

    try {
        const pool = await sql.connect(config);
        console.log('✅ Conexão estabelecida com sucesso!\n');

        // 1. Estatísticas do banco
        console.log('📊 ESTATÍSTICAS DO BANCO DE DADOS');
        console.log('='.repeat(50));

        const statsResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM sys.tables) as totalTables,
        (SELECT COUNT(*) FROM sys.views) as totalViews,
        (SELECT COUNT(*) FROM sys.procedures) as totalProcedures,
        (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN', 'IF', 'TF')) as totalFunctions
    `);
        const stats = statsResult.recordset[0];
        console.log(`   Tabelas: ${stats.totalTables}`);
        console.log(`   Views: ${stats.totalViews}`);
        console.log(`   Procedures: ${stats.totalProcedures}`);
        console.log(`   Functions: ${stats.totalFunctions}`);

        // Tamanho do banco
        const sizeResult = await pool.request().query(`
      SELECT CAST(SUM(size * 8.0 / 1024) AS DECIMAL(10,2)) as sizeMB
      FROM sys.database_files
    `);
        console.log(`   Tamanho: ${sizeResult.recordset[0].sizeMB} MB\n`);

        // 2. Listar todas as tabelas com quantidade de registros
        console.log('📋 LISTANDO TODAS AS TABELAS');
        console.log('='.repeat(50));

        const tablesResult = await pool.request().query(`
      SELECT 
        s.name AS schemaName,
        t.name AS tableName,
        ISNULL(p.rows, 0) AS cnt
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
      ORDER BY p.rows DESC, t.name
    `);

        console.log(`\nTotal de tabelas encontradas: ${tablesResult.recordset.length}\n`);

        // Agrupar por módulos potenciais
        const modulePatterns = {
            'COLETA': [],
            'CTE': [],
            'MOTORISTA': [],
            'VEICULO': [],
            'CLIENTE': [],
            'FORNECEDOR': [],
            'NFE': [],
            'FATURA': [],
            'PAGAMENTO': [],
            'FILIAL': [],
            'USUARIO': [],
            'MANIFESTO': [],
            'ENTREGA': [],
            'OCORRENCIA': [],
            'AGREGADO': [],
            'OUTROS': []
        };

        for (const table of tablesResult.recordset) {
            const name = table.tableName.toUpperCase();
            let categorized = false;

            for (const [module, tables] of Object.entries(modulePatterns)) {
                if (module !== 'OUTROS' && name.includes(module)) {
                    tables.push(table);
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                modulePatterns['OUTROS'].push(table);
            }
        }

        // Exibir por módulo
        for (const [module, tables] of Object.entries(modulePatterns)) {
            if (tables.length > 0) {
                console.log(`\n📁 Módulo: ${module} (${tables.length} tabelas)`);
                console.log('-'.repeat(40));
                for (const t of tables.slice(0, 10)) {
                    console.log(`   ${t.tableName} (${t.cnt.toLocaleString()} registros)`);
                }
                if (tables.length > 10) {
                    console.log(`   ... e mais ${tables.length - 10} tabelas`);
                }
            }
        }

        // 3. Tabelas principais com mais dados (TOP 30)
        console.log('\n\n📊 TOP 30 TABELAS COM MAIS REGISTROS');
        console.log('='.repeat(50));

        const top30 = tablesResult.recordset.slice(0, 30);
        for (let i = 0; i < top30.length; i++) {
            const t = top30[i];
            console.log(`${(i + 1).toString().padStart(2)}. ${t.tableName.padEnd(40)} ${t.cnt.toLocaleString().padStart(15)} registros`);
        }

        // 4. Listar TODAS as tabelas agrupadas
        console.log('\n\n📋 LISTA COMPLETA DE TABELAS');
        console.log('='.repeat(50));

        for (const t of tablesResult.recordset) {
            console.log(`${t.tableName.padEnd(45)} ${t.cnt.toLocaleString().padStart(12)} registros`);
        }

        // 5. Estrutura das tabelas principais para o projeto
        console.log('\n\n🔍 ESTRUTURA DAS TABELAS RELEVANTES');
        console.log('='.repeat(50));

        // Buscar todas as tabelas relacionadas a coletas
        const coletaTablesResult = await pool.request().query(`
      SELECT t.name
      FROM sys.tables t
      WHERE t.name LIKE '%COLETA%' OR t.name LIKE '%COL_%'
      ORDER BY t.name
    `);

        console.log('\n📦 TABELAS RELACIONADAS A COLETAS:');
        for (const t of coletaTablesResult.recordset) {
            console.log(`   - ${t.name}`);

            // Mostrar estrutura
            const structResult = await pool.request().query(`
        SELECT 
          c.name AS colName,
          ty.name AS dataType,
          c.is_nullable AS nullable
        FROM sys.columns c
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        WHERE c.object_id = OBJECT_ID('${t.name}')
        ORDER BY c.column_id
      `);

            for (const col of structResult.recordset.slice(0, 8)) {
                console.log(`       ${col.colName.padEnd(30)} ${col.dataType}`);
            }
            if (structResult.recordset.length > 8) {
                console.log(`       ... e mais ${structResult.recordset.length - 8} colunas`);
            }
            console.log('');
        }

        // Buscar tabelas de motoristas
        const motTablesResult = await pool.request().query(`
      SELECT t.name
      FROM sys.tables t
      WHERE t.name LIKE '%MOTOR%' OR t.name LIKE '%MOT_%'
      ORDER BY t.name
    `);

        console.log('\n🚚 TABELAS RELACIONADAS A MOTORISTAS:');
        for (const t of motTablesResult.recordset) {
            console.log(`   - ${t.name}`);
        }

        // Buscar tabelas de veículos
        const veiTablesResult = await pool.request().query(`
      SELECT t.name
      FROM sys.tables t
      WHERE t.name LIKE '%VEIC%' OR t.name LIKE '%VEI_%'
      ORDER BY t.name
    `);

        console.log('\n🚛 TABELAS RELACIONADAS A VEÍCULOS:');
        for (const t of veiTablesResult.recordset) {
            console.log(`   - ${t.name}`);
        }

        // Buscar tabelas de CTE/CTe
        const cteTablesResult = await pool.request().query(`
      SELECT t.name
      FROM sys.tables t
      WHERE t.name LIKE '%CTE%' OR t.name LIKE '%CTe%'
      ORDER BY t.name
    `);

        console.log('\n📄 TABELAS RELACIONADAS A CTE:');
        for (const t of cteTablesResult.recordset) {
            console.log(`   - ${t.name}`);
        }

        // Buscar tabelas de clientes
        const cliTablesResult = await pool.request().query(`
      SELECT t.name
      FROM sys.tables t
      WHERE t.name LIKE '%CLIENT%' OR t.name LIKE '%CLI_%'
      ORDER BY t.name
    `);

        console.log('\n👥 TABELAS RELACIONADAS A CLIENTES:');
        for (const t of cliTablesResult.recordset) {
            console.log(`   - ${t.name}`);
        }

        // 6. Views disponíveis
        console.log('\n\n👁️ VIEWS DISPONÍVEIS');
        console.log('='.repeat(50));

        const viewsResult = await pool.request().query(`
      SELECT v.name
      FROM sys.views v
      ORDER BY v.name
    `);

        for (const v of viewsResult.recordset) {
            console.log(`   - ${v.name}`);
        }

        await pool.close();
        console.log('\n\n✅ Mapeamento concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.code === 'ESOCKET') {
            console.error('   Verifique se a VPN está conectada.');
        }
    }
}

testConnection();
