/**
 * Teste do novo endpoint /api/drivers/:cpf
 * Verifica se o scraper está funcionando corretamente
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987'; // CPF do motorista que você confirmou existir

async function testarDriverEndpoint() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║    TESTE DO ENDPOINT /api/drivers/:cpf                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        // 1. Autenticar
        console.log('1️⃣  Autenticando no SSW...\n');
        const authResponse = await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, {
            method: 'POST'
        });
        const authData = await authResponse.json();

        if (authData.success) {
            console.log('   ✅ Autenticado com sucesso\n');
        } else {
            console.error('   ❌ Falha na autenticação:', authData.error);
            return;
        }

        // 2. Buscar motorista usando novo endpoint
        console.log(`2️⃣  Buscando motorista CPF: ${TEST_CPF}...\n`);
        const driverResponse = await fetch(`${SSW_HELPER_URL}/api/drivers/${TEST_CPF}`, {
            method: 'GET'
        });

        console.log(`   Status HTTP: ${driverResponse.status}\n`);

        if (!driverResponse.ok) {
            const errorText = await driverResponse.text();
            console.error(`   ❌ Erro HTTP ${driverResponse.status}`);
            console.error(`   Resposta: ${errorText}\n`);
            return;
        }

        const result = await driverResponse.json();

        console.log('   📋 Resposta completa:');
        console.log('   ' + '─'.repeat(56));
        console.log(JSON.stringify(result, null, 2).split('\n').map(line => '   ' + line).join('\n'));
        console.log();

        if (result.success && result.data) {
            console.log('\n✅ ✅ ✅  SUCESSO!  ✅ ✅ ✅\n');
            console.log('📊 Dados do Motorista:');
            console.log('   ' + '─'.repeat(56));
            console.log(`   Nome: ${result.data.nome || 'N/A'}`);
            console.log(`   CPF: ${result.data.cpf || 'N/A'}`);
            console.log(`   Situação: ${result.data.situacao || 'N/A'}`);
            console.log(`   CNH: ${result.data.numeroCNH || 'N/A'}`);
            console.log(`   Categoria: ${result.data.categoriaCNH || 'N/A'}`);
            console.log(`   Vencimento: ${result.data.vencimentoCNH || 'N/A'}`);
            console.log(`   CNH Válida: ${result.data.cnhValida ? '✅ Sim' : '❌ Não'}`);
            console.log(`   Telefone: ${result.data.telefone || 'N/A'}`);
            console.log(`   Cidade: ${result.data.cidade || 'N/A'}`);
            console.log(`   UF: ${result.data.uf || 'N/A'}`);
            console.log(`   Endereço: ${result.data.endereco || 'N/A'}`);

            if (result.data.veiculosAssociados && result.data.veiculosAssociados.length > 0) {
                console.log('\n   🚛 Veículos Associados:');
                result.data.veiculosAssociados.forEach((veiculo, index) => {
                    console.log(`      ${index + 1}. ${veiculo.placa} (${veiculo.tipo}) - ${veiculo.situacao}`);
                });
            }
            console.log('\n   ' + '─'.repeat(56));

            // Validar campos mínimos
            console.log('\n🔍 Validação dos Campos:');
            const validations = [
                { field: 'Nome', value: result.data.nome },
                { field: 'CPF', value: result.data.cpf },
                { field: 'Situação', value: result.data.situacao }
            ];

            validations.forEach(({ field, value }) => {
                const status = value ? '✅' : '❌';
                console.log(`   ${status} ${field}: ${value || 'AUSENTE'}`);
            });

            console.log('\n🎉 O endpoint /api/drivers/:cpf está funcionando!\n');

        } else {
            console.error('\n❌ Motorista não encontrado ou erro no parsing');
            console.error(`   Erro: ${result.error || 'Sem detalhes'}\n`);

            // Se tiver dados HTML na resposta, mostrar
            if (result.data && typeof result.data === 'string') {
                console.log('📄 HTML retornado (preview):');
                console.log('   ' + '─'.repeat(56));
                console.log(result.data.substring(0, 500).split('\n').map(line => '   ' + line).join('\n'));
                console.log('\n   ...(truncado)');
            }
        }

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error('   Stack:', error.stack);
    }
}

// Adicionar teste de comparação com endpoint antigo
async function compararEndpoints() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║    COMPARAÇÃO: Endpoint Antigo vs Novo                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        // Endpoint antigo (ainda retorna 404, mas vamos tentar)
        console.log('📍 Endpoint Antigo: /api/operacoes/request');
        const oldResponse = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: 'ssw0021',
                params: { act: 'PES', cpf: TEST_CPF },
                method: 'POST'
            })
        });
        const oldData = await oldResponse.json();
        console.log(`   Status: ${oldData.success ? '✅ Sucesso' : `❌ ${oldData.error}`}\n`);

        // Endpoint novo
        console.log('📍 Endpoint Novo: /api/drivers/:cpf');
        const newResponse = await fetch(`${SSW_HELPER_URL}/api/drivers/${TEST_CPF}`);
        const newData = await newResponse.json();
        console.log(`   Status: ${newData.success ? '✅ Sucesso' : `❌ ${newData.error}`}\n`);

        if (newData.success && !oldData.success) {
            console.log('✨ Novo endpoint funciona, antigo não! Migração bem-sucedida!\n');
        }

    } catch (error) {
        console.error('❌ Erro na comparação:', error.message);
    }
}

// Executar testes
(async () => {
    await testarDriverEndpoint();
    await compararEndpoints();
})();
