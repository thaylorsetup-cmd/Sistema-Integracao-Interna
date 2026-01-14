/**
 * Teste do fluxo completo do frontend
 * Simula exatamente o que o CPFSearchInput.tsx faz
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987'; // CPF da imagem

console.log('🧪 Teste do Fluxo Frontend → SSW-HELPER\n');

async function testAuthStatus() {
    console.log('1️⃣  Verificando status de autenticação...');
    try {
        const response = await fetch(`${SSW_HELPER_URL}/api/auth/status`);
        const data = await response.json();

        if (data.success && data.data.isAuthenticated) {
            console.log('✅ SSW já está autenticado');
            console.log(`   Usuário: ${data.data.usuario}`);
            console.log(`   Empresa: ${data.data.empresa}`);
            return true;
        }
        return false;
    } catch (error) {
        console.log('❌ Erro ao verificar status:', error.message);
        return false;
    }
}

async function testAuthenticate() {
    console.log('\n2️⃣  Testando autenticação (SEM Content-Type)...');
    try {
        const response = await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, {
            method: 'POST'
            // SEM headers - igual ao código corrigido
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Autenticação bem-sucedida');
            return true;
        } else {
            console.log('❌ Falha na autenticação:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro na autenticação:', error.message);
        return false;
    }
}

async function testDriverSearch(cpf) {
    console.log(`\n3️⃣  Buscando motorista CPF: ${cpf}...`);
    try {
        const cleanedCPF = cpf.replace(/\D/g, '');

        const response = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: 'ssw0028',
                params: {
                    act: 'LST',
                    cpf: cleanedCPF,
                    filial: 'MTZ'
                },
                method: 'POST'
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Busca realizada com sucesso');
            console.log(`   Tempo de resposta: ${data.responseTimeMs}ms`);
            console.log(`   Dados retornados: ${data.data ? 'Sim' : 'Não'}`);

            if (data.data) {
                console.log('\n📄 Resposta HTML do SSW:');
                console.log(data.data.substring(0, 500) + '...');
            }

            return true;
        } else {
            console.log('⚠️  Erro na busca:', data.error);
            console.log(`   Tempo de resposta: ${data.responseTimeMs}ms`);

            if (data.error?.includes('404')) {
                console.log('   → Endpoint ou parâmetros podem estar incorretos');
            }

            return false;
        }
    } catch (error) {
        console.log('❌ Erro na busca:', error.message);
        return false;
    }
}

async function runTest() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║        TESTE DE FLUXO FRONTEND → SSW-HELPER                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Passo 1: Verificar status
    const hasAuth = await testAuthStatus();

    // Passo 2: Autenticar se necessário
    if (!hasAuth) {
        const authOk = await testAuthenticate();
        if (!authOk) {
            console.log('\n❌ Não foi possível autenticar. Abortando teste.');
            process.exit(1);
        }
    }

    // Passo 3: Buscar motorista
    await testDriverSearch(TEST_CPF);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      TESTE CONCLUÍDO                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('💡 Agora teste no navegador:');
    console.log('   1. Acesse http://localhost:5173');
    console.log('   2. Vá para a página com busca de motorista');
    console.log('   3. Digite o CPF: 612.007.789-87');
    console.log('   4. Observe o console do navegador (F12)');
    console.log('');
}

runTest().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
