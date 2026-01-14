// Script final de exploração - foco em dados úteis para o projeto

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

async function exploreForProject() {
    console.log('🔌 Conectando ao SQL Server ERP SSW...\n');

    try {
        const pool = await sql.connect(config);
        console.log('✅ Conectado!\n');

        // 1. Estatísticas de vw_guardiao_base_pagamentos
        console.log('='.repeat(70));
        console.log('📊 vw_guardiao_base_pagamentos - ESTATÍSTICAS COMPLETAS');
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

        // 2. Top eventos
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

        // 3. Top fornecedores
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

        // 4. Distribuição por unidade
        console.log('\n📊 Pagamentos por Unidade:');
        const byUnidade = await pool.request().query(`
      SELECT uni, COUNT(*) as qtd, SUM(vlr_final) as valor
      FROM vw_guardiao_base_pagamentos
      GROUP BY uni
      ORDER BY SUM(vlr_final) DESC
    `);

        for (const u of byUnidade.recordset) {
            console.log(`   ${u.uni?.trim().padEnd(5)}: ${u.qtd} pgtos | R$ ${u.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }

        // 5. Resumo de duplicidades
        console.log('\n\n' + '='.repeat(70));
        console.log('⚠️ vw_guardiao_duplicidades - RESUMO DE DUPLICIDADES');
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

        // Todas as duplicidades
        console.log('\n📋 LISTA COMPLETA DE DUPLICIDADES:');
        const allDups = await pool.request().query(`
      SELECT 
        cnpj_fornecedor, 
        nome_fornecedor, 
        qtd_ocorrencias, 
        valor_total_duplicado,
        criticidade,
        unidade
      FROM vw_guardiao_duplicidades
      ORDER BY valor_total_duplicado DESC
    `);

        for (const d of allDups.recordset) {
            console.log(`   [${d.criticidade?.padEnd(8)}] ${d.nome_fornecedor?.substring(0, 35).padEnd(35)} | CNPJ: ${d.cnpj_fornecedor?.trim()} | ${d.qtd_ocorrencias} oc. | R$ ${d.valor_total_duplicado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${d.unidade}`);
        }

        // 6. Score detalhado (vw_guardiao_duplicidades_score)
        console.log('\n\n' + '='.repeat(70));
        console.log('🎯 vw_guardiao_duplicidades_score - DETALHES DE SCORE');
        console.log('='.repeat(70));

        const scoreStats = await pool.request().query(`
      SELECT 
        COUNT(*) as total_pares,
        AVG(score_total) as score_medio,
        MAX(score_total) as score_maximo,
        MIN(score_total) as score_minimo,
        COUNT(DISTINCT tipo_duplicidade) as tipos_distintos
      FROM vw_guardiao_duplicidades_score
    `);

        const sc = scoreStats.recordset[0];
        console.log(`\n📊 Resumo de Scores:`);
        console.log(`   Total de pares analisados: ${sc.total_pares}`);
        console.log(`   Score médio: ${sc.score_medio?.toFixed(1)}`);
        console.log(`   Score máximo: ${sc.score_maximo}`);
        console.log(`   Score mínimo: ${sc.score_minimo}`);
        console.log(`   Tipos de duplicidade: ${sc.tipos_distintos}`);

        // Top 10 pares com maior score
        console.log('\n📋 Top 10 Pares com Maior Score:');
        const topScores = await pool.request().query(`
      SELECT TOP 10
        nome_fornecedor,
        numlancto_1,
        numlancto_2,
        valor_1,
        valor_2,
        diff_dias,
        score_total,
        tipo_duplicidade
      FROM vw_guardiao_duplicidades_score
      ORDER BY score_total DESC
    `);

        for (const s of topScores.recordset) {
            console.log(`   Score ${s.score_total}: ${s.nome_fornecedor?.substring(0, 25).padEnd(25)} | Lanc: ${s.numlancto_1?.trim()}-${s.numlancto_2?.trim()} | R$ ${s.valor_1?.toLocaleString('pt-BR')} x R$ ${s.valor_2?.toLocaleString('pt-BR')} | ${s.diff_dias}d | ${s.tipo_duplicidade}`);
        }

        // 7. Tipos de duplicidade
        console.log('\n📊 Distribuição por Tipo de Duplicidade:');
        const byTipo = await pool.request().query(`
      SELECT tipo_duplicidade, COUNT(*) as qtd, AVG(score_total) as score_medio
      FROM vw_guardiao_duplicidades_score
      GROUP BY tipo_duplicidade
      ORDER BY COUNT(*) DESC
    `);

        for (const t of byTipo.recordset) {
            console.log(`   ${t.tipo_duplicidade?.padEnd(30)}: ${t.qtd} pares | Score médio: ${t.score_medio?.toFixed(1)}`);
        }

        // 8. CteTravelItems - estrutura
        console.log('\n\n' + '='.repeat(70));
        console.log('📦 CteTravelItems - ESTRUTURA E DADOS');
        console.log('='.repeat(70));

        const cteTypes = await pool.request().query(`
      SELECT item_type, COUNT(*) as qtd
      FROM CteTravelItems
      GROUP BY item_type
      ORDER BY COUNT(*) DESC
    `);

        console.log('\n📊 Tipos de itens em CteTravelItems:');
        for (const t of cteTypes.recordset) {
            console.log(`   ${t.item_type?.trim().padEnd(20)}: ${t.qtd?.toLocaleString()} registros`);
        }

        await pool.close();
        console.log('\n\n✅ Exploração concluída!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    }
}

exploreForProject();
