/**
 * Teste com endpoint correto: ssw0021
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987'; // CPF que existe no SSW

async function testarEndpointCorreto() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     TESTE COM ENDPOINT CORRETO: ssw0021                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`CPF: ${TEST_CPF}`);
    console.log(`Endpoint: ssw0021`);
    console.log(`Ação: PES (pesquisar)\n`);

    try {
        // Autenticar
        console.log('1️⃣  Autenticando...');
        await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, { method: 'POST' });
        console.log('✅ Autenticado\n');

        // Buscar motorista
        console.log('2️⃣  Buscando motorista...\n');
        const response = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: 'ssw0021',
                params: {
                    act: 'PES',
                    cpf: TEST_CPF
                },
                method: 'POST'
            })
        });

        const data = await response.json();

        console.log('📊 Resposta:');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`Success: ${data.success}`);
        console.log(`Erro: ${data.error || 'Nenhum'}`);
        console.log(`Tempo: ${data.responseTimeMs}ms`);
        console.log(`Tem dados: ${data.data ? 'SIM!' : 'Não'}\n`);

        if (data.success && data.data) {
            console.log('✅ ✅ ✅  SUCESSO! DADOS RETORNADOS DO SSW!  ✅ ✅ ✅\n');

            // Salvar resposta
            const fs = require('fs');
            fs.writeFileSync('ssw-response-sucesso.html', data.data, 'utf8');
            console.log('💾 Resposta salva em: ssw-response-sucesso.html\n');

            // Mostrar preview
            console.log('📄 Preview da resposta (primeiros 1500 caracteres):');
            console.log('─────────────────────────────────────────────────────────────');
            console.log(data.data.substring(0, 1500));
            console.log('─────────────────────────────────────────────────────────────\n');

            // Verificar se contém dados esperados
            console.log('🔍 Verificação de dados:');
            console.log(`   CPF ${TEST_CPF}: ${data.data.includes(TEST_CPF) ? '✅ Encontrado' : '❌ Não encontrado'}`);
            console.log(`   Nome (VALDEMIR): ${data.data.includes('VALDEMIR') ? '✅ Encontrado' : '❌ Não encontrado'}`);
            console.log(`   Tabelas: ${(data.data.match(/<table/gi) || []).length}`);
            console.log(`   Formulários: ${(data.data.match(/<form/gi) || []).length}\n`);

        } else {
            console.log('❌ Falhou!');
            if (data.error) {
                console.log(`   Erro: ${data.error}\n`);
            }
        }

    } catch (error) {
        console.log('\n❌ ERRO:', error.message);
    }
}

testarEndpointCorreto();
