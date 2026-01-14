/**
 * Teste acessando via opção de menu primeiro
 * Baseado nas imagens: Menu Principal → Opção 28 → ssw0021
 */

const SSW_HELPER_URL = 'http://localhost:3000';
const TEST_CPF = '61200778987';

async function testarViaMenu() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║    TESTE ACESSANDO VIA OPÇÃO DE MENU                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        // Autenticar
        await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, { method: 'POST' });
        console.log('✅ Autenticado\n');

        // Passo 1: Acessar menu principal com opção 28
        console.log('1️⃣  Acessando menu principal com opção 28...\n');
        const menu = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: 'menu01',
                params: {
                    opc: '28'
                },
                method: 'GET'
            })
        });

        const menuData = await menu.json();
        console.log(`   Resultado: ${menuData.success ? '✅ Sucesso' : `❌ ${menuData.error}`}`);
        console.log(`   Tempo: ${menuData.responseTimeMs}ms\n`);

        if (menuData.success && menuData.data) {
            console.log('   📄 Preview da resposta do menu:');
            console.log('   ' + '─'.repeat(56));
            console.log('   ' + menuData.data.substring(0, 500).split('\n').join('\n   '));
            console.log('\n');
        }

        // Passo 2: Agora tentar acessar ssw0021
        console.log('2️⃣  Agora acessando ssw0021 após abrir pelo menu...\n');
        const response = await fetch(`${SSW_HELPER_URL}/api/operacoes/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        console.log(`   Resultado: ${data.success ? '✅✅✅ SUCESSO!' : `❌ ${data.error}`}`);
        console.log(`   Tempo: ${data.responseTimeMs}ms\n`);

        if (data.success && data.data) {
            console.log('🎉🎉🎉  FUNCIONOU!  🎉🎉🎉\n');
            const fs = require('fs');
            fs.writeFileSync('ssw-via-menu-sucesso.html', data.data, 'utf8');
            console.log('💾 Salvo em: ssw-via-menu-sucesso.html\n');
            console.log('Preview:\n');
            console.log(data.data.substring(0, 1000));
        }

    } catch (error) {
        console.log('\n❌ ERRO:', error.message);
    }
}

testarViaMenu();
