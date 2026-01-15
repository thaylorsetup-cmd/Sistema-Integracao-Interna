/**
 * Script de Seed - Popula banco com dados iniciais
 * Importa usuários do mock database do frontend
 */

import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import bcrypt from 'bcryptjs';

// Senha padrão para todos os usuários
const SENHA_PADRAO = 'bbt123';
const SALT_ROUNDS = 10;

// Dados dos colaboradores (baseado na planilha Excel do frontend)
const colaboradores = [
    { nome: 'Thaylor', departamento: 'Admin/Desenvolvedor', telefone: '5562999892013', role: 'admin' },
    { nome: 'Wilton', departamento: 'Diretoria', telefone: '5564984342283', role: 'gestor' },
    { nome: 'Renata', departamento: 'Diretoria', telefone: '5562986502283', role: 'admin' },
    { nome: 'Mariana', departamento: 'Diretoria', telefone: '5562986642283', role: 'admin' },
    { nome: 'Miqueias', departamento: 'Operacional', telefone: '5562999407501', role: 'operacional' },
    { nome: 'Sidney', departamento: 'Operacional', telefone: '5564984392283', role: 'operacional' },
    { nome: 'Danubia Oliveira', departamento: 'Operacional', telefone: '5562999000073', role: 'operacional' },
    { nome: 'Leonardo', departamento: 'Operacional', telefone: '5562996498180', role: 'operacional' },
    { nome: 'Raiane', departamento: 'Operacional', telefone: '5562999178992', role: 'operacional' },
    { nome: 'Tainallys', departamento: 'Operacional', telefone: '5562998482639', role: 'operacional' },
    { nome: 'Junior', departamento: 'Frota', telefone: '5562998826714', role: 'operacional' },
    { nome: 'Adelia', departamento: 'Expedição', telefone: '5511912132906', role: 'operacional' },
    { nome: 'Erik', departamento: 'Expedição', telefone: '5562996179116', role: 'operacional' },
    { nome: 'Jordana Alves', departamento: 'GR', telefone: '5564984412283', role: 'cadastro' },
    { nome: 'Mirtes', departamento: 'GR', telefone: '5511934627901', role: 'cadastro' },
    { nome: 'Jullia Pinheiro', departamento: 'GR', telefone: '5562998775408', role: 'cadastro' },
    { nome: 'Talita', departamento: 'Customer Service', telefone: '5562998259423', role: 'cadastro' },
    { nome: 'Regina', departamento: 'Customer Service', telefone: '5562999297151', role: 'cadastro' },
    { nome: 'Ianka', departamento: 'Customer Service', telefone: '5562999067333', role: 'cadastro' },
    { nome: 'Ester Perez', departamento: 'Customer Service', telefone: '5562998790853', role: 'cadastro' },
    { nome: 'Thiessa', departamento: 'Customer Service', telefone: '5562996059829', role: 'cadastro' },
    { nome: 'Eduarda', departamento: 'Customer Service', telefone: '5562996233500', role: 'cadastro' },
    { nome: 'Cleudiane', departamento: 'Customer Service', telefone: '5511937196898', role: 'cadastro' },
    { nome: 'Kannanda', departamento: 'Customer Service', telefone: '5562998782669', role: 'cadastro' },
    { nome: 'Nalanda Vasconcelos', departamento: 'Customer Service', telefone: '5562999259785', role: 'cadastro' },
    { nome: 'Emilly', departamento: 'Faturamento', telefone: '5511910642869', role: 'cadastro' },
    { nome: 'Jessika', departamento: 'Faturamento', telefone: '5562999659192', role: 'cadastro' },
    { nome: 'Karine', departamento: 'Faturamento', telefone: '5562999633586', role: 'cadastro' },
    { nome: 'Marcius', departamento: 'Comercial', telefone: '5562999522283', role: 'comercial' },
    { nome: 'Igor', departamento: 'Comercial', telefone: '5562996122283', role: 'comercial' },
    { nome: 'Edcarlos', departamento: 'Comercial', telefone: '5562996941614', role: 'comercial' },
    { nome: 'Bruno Ribeiro', departamento: 'Comercial', telefone: '5562998231057', role: 'comercial' },
    { nome: 'Maria Paula', departamento: 'Comercial', telefone: '5562999876548', role: 'comercial' },
    { nome: 'Ednilson', departamento: 'B4 Comex', telefone: '5511911635178', role: 'comercial' },
    { nome: 'Sarah', departamento: 'B4 Comex', telefone: '5562999409488', role: 'comercial' },
    { nome: 'Moroni', departamento: 'B4 Comex', telefone: '5562996537789', role: 'comercial' },
    { nome: 'Amanda Danniely', departamento: 'B4 Comex', telefone: '5562996820773', role: 'comercial' },
];

function formatarEmail(nome: string): string {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .trim()
        .split(' ')[0] + '@bbttransportes.com.br';
}

async function seed() {
    const client = await pool.connect();

    try {
        logger.info('🌱 Iniciando seed de usuários...');

        // Hash da senha padrão
        const passwordHash = await bcrypt.hash(SENHA_PADRAO, SALT_ROUNDS);

        for (const colab of colaboradores) {
            const email = formatarEmail(colab.nome);

            // Verificar se já existe
            const existing = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existing.rows.length > 0) {
                logger.debug(`Usuário já existe: ${email}`);
                continue;
            }

            await client.query(
                `INSERT INTO users (name, email, password_hash, telefone, role, departamento, ativo)
         VALUES ($1, $2, $3, $4, $5::user_role, $6, true)`,
                [colab.nome, email, passwordHash, colab.telefone, colab.role, colab.departamento]
            );

            logger.info(`✅ Usuário criado: ${colab.nome} (${email})`);
        }

        logger.info(`🎉 Seed concluído! ${colaboradores.length} usuários processados.`);
        logger.info(`📝 Senha padrão: ${SENHA_PADRAO}`);
    } catch (error) {
        logger.error('❌ Erro no seed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
