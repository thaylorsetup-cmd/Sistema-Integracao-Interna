/**
 * Buscar endpoint correto para motoristas no menu do SSW
 */

const SSW_HELPER_URL = 'http://localhost:3000';

async function buscarEndpointMotorista() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║    BUSCANDO ENDPOINT CORRETO PARA MOTORISTAS NO SSW         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        // Buscar no menu SSW por "motorista"
        console.log('Buscando "motorista" no menu SSW...\n');

        const response = await fetch(`${SSW_HELPER_URL}/api/menu/buscar?texto=motorista`);
        const data = await response.json();

        if (data.success && data.data) {
            console.log('✅ Resultados encontrados:\n');
            console.log(JSON.stringify(data.data, null, 2));
        } else {
            console.log('❌ Nenhum resultado encontrado');
        }

        // Tentar também "cpf"
        console.log('\n\n───────────────────────────────────────────────────────────────\n');
        console.log('Buscando "cpf" no menu SSW...\n');

        const response2 = await fetch(`${SSW_HELPER_URL}/api/menu/buscar?texto=cpf`);
        const data2 = await response2.json();

        if (data2.success && data2.data) {
            console.log('✅ Resultados encontrados:\n');
            console.log(JSON.stringify(data2.data, null, 2));
        } else {
            console.log('❌ Nenhum resultado encontrado');
        }

        // Tentar também "motoristas"
        console.log('\n\n───────────────────────────────────────────────────────────────\n');
        console.log('Buscando "motoristas" (plural) no menu SSW...\n');

        const response3 = await fetch(`${SSW_HELPER_URL}/api/menu/buscar?texto=motoristas`);
        const data3 = await response3.json();

        if (data3.success && data3.data) {
            console.log('✅ Resultados encontrados:\n');
            console.log(JSON.stringify(data3.data, null, 2));
        } else {
            console.log('❌ Nenhum resultado encontrado');
        }

    } catch (error) {
        console.log('\n❌ ERRO:', error.message);
    }
}

buscarEndpointMotorista();
