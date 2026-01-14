// Script para explorar estruturas detalhadas das tabelas principais

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

async function exploreMainTables() {
    console.log('🔌 Conectando ao SQL Server ERP SSW...\n');

    try {
        const pool = await sql.connect(config);
        console.log('✅ Conectado!\n');

        // 1. Explorar CteTravelItems em detalhe
        console.log('='.repeat(70));
        console.log('📄 EXPLORANDO: CteTravelItems (157.805 registros)');
        console.log('='.repeat(70));

        const cteStructResult = await pool.request().query(`
      SELECT 
        c.name AS colName,
        ty.name AS dataType,
        c.max_length,
        c.is_nullable
      FROM sys.columns c
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE c.object_id = OBJECT_ID('CteTravelItems')
      ORDER BY c.column_id
    `);

        console.log(`\n📋 Estrutura (${cteStructResult.recordset.length} colunas):`);
        for (const col of cteStructResult.recordset) {
            const null_str = col.is_nullable ? 'NULL' : 'NOT NULL';
            console.log(`   ${col.colName.padEnd(35)} ${col.dataType.padEnd(12)} ${null_str}`);
        }

        const cteSampleResult = await pool.request().query(`SELECT TOP 3 * FROM CteTravelItems ORDER BY 1 DESC`);
        console.log('\n📄 Amostra de registro:');
        console.log(JSON.stringify(cteSampleResult.recordset[0], null, 2));

        // 2. Explorar travels
        console.log('\n\n' + '='.repeat(70));
        console.log('📄 EXPLORANDO: travels (15.614 registros)');
        console.log('='.repeat(70));

        const travelsStructResult = await pool.request().query(`
      SELECT 
        c.name AS colName,
        ty.name AS dataType,
        c.is_nullable
      FROM sys.columns c
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE c.object_id = OBJECT_ID('travels')
      ORDER BY c.column_id
    `);

        console.log(`\n📋 Estrutura (${travelsStructResult.recordset.length} colunas):`);
        for (const col of travelsStructResult.recordset) {
            const null_str = col.is_nullable ? 'NULL' : 'NOT NULL';
            console.log(`   ${col.colName.padEnd(35)} ${col.dataType.padEnd(12)} ${null_str}`);
        }

        const travelsSampleResult = await pool.request().query(`SELECT TOP 2 * FROM travels ORDER BY 1 DESC`);
        console.log('\n📄 Amostra de registro:');
        console.log(JSON.stringify(travelsSampleResult.recordset[0], null, 2));

        // 3. Explorar events
        console.log('\n\n' + '='.repeat(70));
        console.log('📄 EXPLORANDO: events (17.917 registros)');
        console.log('='.repeat(70));

        const eventsStructResult = await pool.request().query(`
      SELECT 
        c.name AS colName,
        ty.name AS dataType,
        c.is_nullable
      FROM sys.columns c
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE c.object_id = OBJECT_ID('events')
      ORDER BY c.column_id
    `);

        console.log(`\n📋 Estrutura (${eventsStructResult.recordset.length} colunas):`);
        for (const col of eventsStructResult.recordset) {
            const null_str = col.is_nullable ? 'NULL' : 'NOT NULL';
            console.log(`   ${col.colName.padEnd(35)} ${col.dataType.padEnd(12)} ${null_str}`);
        }

        const eventsSampleResult = await pool.request().query(`SELECT TOP 2 * FROM events ORDER BY 1 DESC`);
        console.log('\n📄 Amostra de registro:');
        console.log(JSON.stringify(eventsSampleResult.recordset[0], null, 2));

        // 4. Explorar dre
        console.log('\n\n' + '='.repeat(70));
        console.log('📄 EXPLORANDO: dre (15.614 registros)');
        console.log('='.repeat(70));

        const dreStructResult = await pool.request().query(`
      SELECT 
        c.name AS colName,
        ty.name AS dataType,
        c.is_nullable
      FROM sys.columns c
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      WHERE c.object_id = OBJECT_ID('dre')
      ORDER BY c.column_id
    `);

        console.log(`\n📋 Estrutura (${dreStructResult.recordset.length} colunas):`);
        for (const col of dreStructResult.recordset) {
            const null_str = col.is_nullable ? 'NULL' : 'NOT NULL';
            console.log(`   ${col.colName.padEnd(35)} ${col.dataType.padEnd(12)} ${null_str}`);
        }

        const dreSampleResult = await pool.request().query(`SELECT TOP 2 * FROM dre ORDER BY 1 DESC`);
        console.log('\n📄 Amostra de registro:');
        console.log(JSON.stringify(dreSampleResult.recordset[0], null, 2));

        // 5. Estatísticas de vw_guardiao_base_pagamentos
        console.log('\n\n' + '='.repeat(70));
        console.log('📊 ESTATÍSTICAS: vw_guardiao_base_pagamentos');
        console.log('='.repeat(70));

        const pgtoStats = await pool.request().query(`
      SELECT 
        COUNT(*) as total_pagamentos,
        COUNT(DISTINCT cnpj_fornecedor_norm) as fornecedores_distintos,
        COUNT(DISTINCT evento) as eventos_distintos,
        COUNT(DISTINCT uni) as unidades_distintas,
        SUM(vlr_final) as valor_total,
        MIN(data_pgto) as primeira_data,
        MAX(data_pgto) as ultima_data
      FROM vw_guardiao_base_pagamentos
    `);

        const stats = pgtoStats.recordset[0];
        console.log(`\n📈 Resumo:`);
        console.log(`   Total de pagamentos: ${stats.total_pagamentos?.toLocaleString()}`);
        console.log(`   Fornecedores distintos: ${stats.fornecedores_distintos?.toLocaleString()}`);
        console.log(`   Eventos distintos: ${stats.eventos_distintos}`);
        console.log(`   Unidades distintas: ${stats.unidades_distintas}`);
        console.log(`   Valor total: R$ ${stats.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Período: ${stats.primeira_data} até ${stats.ultima_data}`);

        // 6. Top eventos
        console.log('\n📊 Top 10 Eventos:');
        const topEventos = await pool.request().query(`
      SELECT TOP 10 evento, descr_evento, COUNT(*) as qtd, SUM(vlr_final) as valor
      FROM vw_guardiao_base_pagamentos
      GROUP BY evento, descr_evento
      ORDER BY COUNT(*) DESC
    `);

        for (const e of topEventos.recordset) {
            console.log(`   ${e.evento}: ${e.descr_evento?.substring(0, 40).padEnd(40)} | ${e.qtd} pgtos | R$ ${e.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }

        // 7. Top fornecedores
        console.log('\n📊 Top 10 Fornecedores por volume:');
        const topFornecedores = await pool.request().query(`
      SELECT TOP 10 cnpj_fornecedor_norm, nome_fornecedor, COUNT(*) as qtd, SUM(vlr_final) as valor
      FROM vw_guardiao_base_pagamentos
      GROUP BY cnpj_fornecedor_norm, nome_fornecedor
      ORDER BY COUNT(*) DESC
    `);

        for (const f of topFornecedores.recordset) {
            console.log(`   ${f.cnpj_fornecedor_norm}: ${f.nome_fornecedor?.substring(0, 30).padEnd(30)} | ${f.qtd} pgtos | R$ ${f.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }

        // 8. Resumo de duplicidades
        console.log('\n\n' + '='.repeat(70));
        console.log('⚠️ RESUMO DE DUPLICIDADES DETECTADAS');
        console.log('='.repeat(70));

        const dupStats = await pool.request().query(`
      SELECT 
        COUNT(*) as total_alertas,
        SUM(qtd_ocorrencias) as total_ocorrencias,
        SUM(valor_total_duplicado) as valor_total_duplicado,
        COUNT(DISTINCT cnpj_fornecedor) as fornecedores_afetados
      FROM vw_guardiao_duplicidades
    `);

        const dup = dupStats.recordset[0];
        console.log(`\n📊 Resumo:`);
        console.log(`   Alertas de duplicidade: ${dup.total_alertas}`);
        console.log(`   Total de ocorrências: ${dup.total_ocorrencias}`);
        console.log(`   Valor total duplicado: R$ ${dup.valor_total_duplicado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Fornecedores afetados: ${dup.fornecedores_afetados}`);

        // Top duplicidades
        console.log('\n📊 Top 5 Duplicidades por valor:');
        const topDups = await pool.request().query(`
      SELECT TOP 5 
        cnpj_fornecedor, 
        nome_fornecedor, 
        qtd_ocorrencias, 
        valor_total_duplicado,
        criticidade
      FROM vw_guardiao_duplicidades
      ORDER BY valor_total_duplicado DESC
    `);

        for (const d of topDups.recordset) {
            console.log(`   [${d.criticidade}] ${d.nome_fornecedor?.substring(0, 30).padEnd(30)} | ${d.qtd_ocorrencias} oc. | R$ ${d.valor_total_duplicado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }

        await pool.close();
        console.log('\n\n✅ Exploração concluída!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

exploreMainTables();
