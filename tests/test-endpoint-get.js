/**
 * Teste com ssw0021 usando GET ao invés de POST
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987';

async function testarComGET() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     TESTE COM GET ao invés de POST                           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        // Autenticar
        await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, { method: 'POST' });
        console.log('✅ Autenticado\n');

        // Testar com GET
        console.log('1️⃣  Tentando com GET + parâmetros...\n');
        const response1 = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: 'ssw0021',
                params: {
                    act: 'PES',
                    cpf: TEST_CPF
                },
                method: 'GET'  // ← GET ao invés de POST
            })
        });

        const data1 = await response1.json();
        console.log(`Resultado GET: ${data1.success ? '✅ SUCESSO!' : `❌ ${data1.error}`}`);
        console.log(`Tempo: ${data1.responseTimeMs}ms\n`);

        if (data1.success && data1.data) {
            console.log('🎉 FUNCIONOU COM GET!\n');
            const fs = require('fs');
            fs.writeFileSync('ssw-response-get.html', data1.data, 'utf8');
            console.log('💾 Salvo em: ssw-response-get.html\n');
            console.log('Preview:\n', data1.data.substring(0, 1000));
            return;
        }

        // Testar sem act, apenas cpf
        console.log('2️⃣  Tentando GET sem "act", apenas cpf...\n');
        const response2 = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: 'ssw0021',
                params: {
                    cpf: TEST_CPF
                },
                method: 'GET'
            })
        });

        const data2 = await response2.json();
        console.log(`Resultado: ${data2.success ? '✅ SUCESSO!' : `❌ ${data2.error}`}`);
        console.log(`Tempo: ${data2.responseTimeMs}ms\n`);

        if (data2.success && data2.data) {
            console.log('🎉 FUNCIONOU SEM ACT!\n');
            const fs = require('fs');
            fs.writeFileSync('ssw-response-noact.html', data2.data, 'utf8');
            console.log('💾 Salvo em: ssw-response-noact.html\n');
            console.log('Preview:\n', data2.data.substring(0, 1000));
        }

    } catch (error) {
        console.log('\n❌ ERRO:', error.message);
    }
}

testarComGET();
