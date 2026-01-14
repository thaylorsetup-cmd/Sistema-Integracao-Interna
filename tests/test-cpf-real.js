/**
 * Teste com CPF real cadastrado no SSW
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987'; // CPF da imagem - EXISTE no SSW

async function testarCPFReal() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       TESTE COM CPF REAL CADASTRADO NO SSW                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`CPF testado: ${TEST_CPF}\n`);

    try {
        // 1. Verificar autenticação
        console.log('1️⃣  Verificando autenticação...');
        const authStatus = await fetch(`${SSW_HELPER_URL}/api/auth/status`);
        const authData = await authStatus.json();

        if (!authData.success || !authData.data.isAuthenticated) {
            console.log('⚠️  Não autenticado. Autenticando...');
            await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, { method: 'POST' });
        } else {
            console.log(`✅ Autenticado como ${authData.data.usuario}\n`);
        }

        // 2. Buscar motorista
        console.log('2️⃣  Buscando motorista no SSW...');
        const response = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: 'ssw0028',
                params: {
                    act: 'LST',
                    cpf: TEST_CPF,
                    filial: 'MTZ'
                },
                method: 'POST'
            })
        });

        const data = await response.json();

        console.log('\n📊 Resposta da API:');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`Success: ${data.success}`);
        console.log(`Erro: ${data.error || 'Nenhum'}`);
        console.log(`Tempo de resposta: ${data.responseTimeMs}ms`);
        console.log(`Tem dados: ${data.data ? 'Sim' : 'Não'}`);

        if (data.success && data.data) {
            console.log('\n✅ RESPOSTA HTML DO SSW RECEBIDA!\n');
            console.log('📄 Primeiros 1000 caracteres:');
            console.log('─────────────────────────────────────────────────────────────');
            console.log(data.data.substring(0, 1000));
            console.log('─────────────────────────────────────────────────────────────\n');

            // Salvar resposta completa em arquivo
            const fs = require('fs');
            const filename = 'ssw-response-debug.html';
            fs.writeFileSync(filename, data.data, 'utf8');
            console.log(`💾 Resposta completa salva em: ${filename}\n`);

            // Tentar encontrar padrões
            console.log('🔍 Analisando estrutura:');
            console.log(`   - Contém <table>: ${data.data.includes('<table>') ? 'Sim' : 'Não'}`);
            console.log(`   - Contém <tr>: ${data.data.includes('<tr>') ? 'Sim' : 'Não'}`);
            console.log(`   - Contém <td>: ${data.data.includes('<td>') ? 'Sim' : 'Não'}`);
            console.log(`   - Contém CPF: ${data.data.includes(TEST_CPF) ? 'Sim' : 'Não'}`);

            // Contar tabelas
            const tableMatches = data.data.match(/<table/gi);
            console.log(`   - Número de tabelas: ${tableMatches ? tableMatches.length : 0}`);

            // Contar linhas
            const trMatches = data.data.match(/<tr/gi);
            console.log(`   - Número de linhas <tr>: ${trMatches ? trMatches.length : 0}\n`);

        } else if (data.error) {
            console.log('\n❌ ERRO NA BUSCA:');
            console.log(`   ${data.error}\n`);

            if (data.error.includes('404')) {
                console.log('⚠️  Erro 404 do SSW - possíveis causas:');
                console.log('   1. Endpoint ssw0028 não existe mais');
                console.log('   2. Parâmetros incorretos');
                console.log('   3. Filial MTZ incorreta\n');
            }
        }

    } catch (error) {
        console.log('\n❌ ERRO DE CONEXÃO:');
        console.log(`   ${error.message}\n`);
    }
}

testarCPFReal();
