// Script de mapeamento completo das VIEWS do ERP SSW
// As views contêm os dados operacionais consolidados do ERP

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
        requestTimeout: 120000,
        connectTimeout: 30000
    }
};

async function mapViews() {
    console.log('🔌 Conectando ao SQL Server ERP SSW...\n');

    try {
        const pool = await sql.connect(config);
        console.log('✅ Conectado!\n');

        // 1. Listar todas as VIEWS com detalhes
        console.log('👁️ MAPEAMENTO COMPLETO DAS VIEWS');
        console.log('='.repeat(60));

        const viewsResult = await pool.request().query(`
      SELECT v.name AS viewName
      FROM sys.views v
      ORDER BY v.name
    `);

        console.log(`\nTotal de views: ${viewsResult.recordset.length}\n`);

        // Mapear cada view importante
        const importantViews = [
            'cteTravelItems6Meses',
            'ctrcsPorTipoDoDocumentoUltimos6Meses',
            'flex_motoristas',
            'flex_proprietarios',
            'flex_veiculos',
            'flex_viagens',
            'freight_dre',
            'operatorsDRE',
            'operatorsMargin',
            'faturamento_total',
            'vw_guardiao_base_pagamentos',
            'vw_guardiao_duplicidades',
            'vw_guardiao_duplicidades_score',
            'vw_guardiao_dashboard',
            'vw_guardiao_top_fornecedores',
            'vw_guardiao_alertas_pendentes_v4'
        ];

        for (const viewName of importantViews) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📊 VIEW: ${viewName}`);
            console.log('='.repeat(60));

            // Estrutura da view
            try {
                const structResult = await pool.request().query(`
          SELECT 
            c.name AS colName,
            ty.name AS dataType
          FROM sys.columns c
          INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          WHERE c.object_id = OBJECT_ID('${viewName}')
          ORDER BY c.column_id
        `);

                console.log(`\n📋 Colunas (${structResult.recordset.length}):`);
                for (const col of structResult.recordset) {
                    console.log(`   - ${col.colName.padEnd(35)} ${col.dataType}`);
                }

                // Amostra de dados
                const sampleResult = await pool.request().query(`SELECT TOP 3 * FROM ${viewName}`);
                console.log(`\n📄 Amostra de dados (${sampleResult.recordset.length} registros):`);
                if (sampleResult.recordset.length > 0) {
                    console.log(JSON.stringify(sampleResult.recordset[0], null, 2).substring(0, 500) + '...');
                }

                // Contagem
                try {
                    const countResult = await pool.request().query(`SELECT COUNT(*) as cnt FROM ${viewName}`);
                    console.log(`\n📈 Total de registros: ${countResult.recordset[0].cnt.toLocaleString()}`);
                } catch (e) {
                    console.log(`\n⚠️ Não foi possível contar registros`);
                }

            } catch (e) {
                console.log(`   ❌ Erro: ${e.message}`);
            }
        }

        // 2. Explorar tabelas principais com dados
        console.log('\n\n' + '='.repeat(60));
        console.log('📦 TABELAS OPERACIONAIS COM DADOS');
        console.log('='.repeat(60));

        const mainTables = [
            'CteTravelItems',
            'ClientNotification',
            'ClientsOccurrence',
            'CompanyGroup',
            'OperatorsBBT',
            'VehiclesBBT',
            'BranchCNPJ',
            'CodigoOcorrencia',
            'PandurataShippingCenter',
            'GuardianReportLogs'
        ];

        for (const tableName of mainTables) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📄 TABELA: ${tableName}`);
            console.log('='.repeat(60));

            try {
                // Estrutura
                const structResult = await pool.request().query(`
          SELECT 
            c.name AS colName,
            ty.name AS dataType,
            c.is_nullable AS nullable
          FROM sys.columns c
          INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          WHERE c.object_id = OBJECT_ID('${tableName}')
          ORDER BY c.column_id
        `);

                console.log(`\n📋 Colunas (${structResult.recordset.length}):`);
                for (const col of structResult.recordset) {
                    const null_str = col.nullable ? 'NULL' : 'NOT NULL';
                    console.log(`   - ${col.colName.padEnd(35)} ${col.dataType.padEnd(15)} ${null_str}`);
                }

                // Contagem e amostra
                const countResult = await pool.request().query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
                console.log(`\n📈 Total de registros: ${countResult.recordset[0].cnt.toLocaleString()}`);

                const sampleResult = await pool.request().query(`SELECT TOP 2 * FROM ${tableName}`);
                if (sampleResult.recordset.length > 0) {
                    console.log(`\n📄 Exemplo de registro:`);
                    console.log(JSON.stringify(sampleResult.recordset[0], null, 2));
                }

            } catch (e) {
                console.log(`   ❌ Erro: ${e.message}`);
            }
        }

        // 3. Buscar tabelas que parecem ser do ERP (não guardião)
        console.log('\n\n' + '='.repeat(60));
        console.log('🔍 BUSCANDO TABELAS DO ERP (não Guardião)');
        console.log('='.repeat(60));

        const erpTablesResult = await pool.request().query(`
      SELECT 
        t.name AS tableName,
        ISNULL(p.rows, 0) AS cnt
      FROM sys.tables t
      LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
      WHERE t.name NOT LIKE 'guardiao%' 
        AND t.name NOT LIKE 'cerebro%'
        AND t.name NOT LIKE 'ml_%'
        AND t.name NOT LIKE 'duplicidades%'
        AND t.name NOT LIKE 'vw_%'
        AND t.name NOT LIKE 'tb_guardiao%'
        AND t.name NOT LIKE 'Guardian%'
      ORDER BY p.rows DESC
    `);

        console.log(`\nTabelas do ERP encontradas: ${erpTablesResult.recordset.length}\n`);

        for (const t of erpTablesResult.recordset) {
            console.log(`${t.tableName.padEnd(45)} ${t.cnt.toLocaleString().padStart(12)} registros`);
        }

        await pool.close();
        console.log('\n\n✅ Mapeamento das VIEWS concluído!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

mapViews();
