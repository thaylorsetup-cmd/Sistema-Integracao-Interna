/**
 * Testar diferentes formatos de requisição para ssw0021
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987';

async function testarDiferentesFormatos() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   TESTANDO DIFERENTES FORMATOS PARA ssw0021                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Autenticar
    await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, { method: 'POST' });
    console.log('✅ Autenticado\n');

    const testes = [
        {
            nome: 'Teste 1: POST com act=PES e cpf',
            config: {
                endpoint: 'ssw0021',
                params: { act: 'PES', cpf: TEST_CPF },
                method: 'POST'
            }
        },
        {
            nome: 'Teste 2: POST apenas com cpf',
            config: {
                endpoint: 'ssw0021',
                params: { cpf: TEST_CPF },
                method: 'POST'
            }
        },
        {
            nome: 'Teste 3: GET com act=PES e cpf',
            config: {
                endpoint: 'ssw0021',
                params: { act: 'PES', cpf: TEST_CPF },
                method: 'GET'
            }
        },
        {
            nome: 'Teste 4: GET apenas com cpf',
            config: {
                endpoint: 'ssw0021',
                params: { cpf: TEST_CPF },
                method: 'GET'
            }
        },
        {
            nome: 'Teste 5: POST com act=L (listar)',
            config: {
                endpoint: 'ssw0021',
                params: { act: 'L', cpf: TEST_CPF },
                method: 'POST'
            }
        },
        {
            nome: 'Teste 6: POST vazio (apenas acessar)',
            config: {
                endpoint: 'ssw0021',
                params: {},
                method: 'POST'
            }
        },
        {
            nome: 'Teste 7: GET vazio (apenas acessar)',
            config: {
                endpoint: 'ssw0021',
                params: {},
                method: 'GET'
            }
        }
    ];

    for (const teste of testes) {
        console.log(`\n${teste.nome}`);
        console.log('─'.repeat(60));

        try {
            const response = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teste.config)
            });

            const data = await response.json();

            if (data.success && data.data) {
                console.log('✅ ✅ ✅  SUCESSO!  ✅ ✅ ✅');
                console.log(`Tempo: ${data.responseTimeMs}ms`);
                console.log(`Tamanho: ${data.data.length} caracteres`);

                const fs = require('fs');
                const filename = `ssw-sucesso-${teste.nome.split(':')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
                fs.writeFileSync(filename, data.data, 'utf8');
                console.log(`💾 Salvo em: ${filename}`);

                // Mostrar preview
                console.log('\nPreview:');
                console.log(data.data.substring(0, 500));

                // Se encontrou sucesso, parar aqui
                console.log('\n\n🎉🎉🎉 TESTE PASSOU! Configuração que funcionou:');
                console.log(JSON.stringify(teste.config, null, 2));
                return;

            } else {
                console.log(`❌ Falhou: ${data.error || 'Sem dados'}`);
                console.log(`Tempo: ${data.responseTimeMs}ms`);
            }

        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }
    }

    console.log('\n\n😞 Nenhum teste passou.');
}

testarDiferentesFormatos();
