/**
 * Conexão com ERP SSW (SQL Server)
 * READ-ONLY para consultas de coletas, motoristas, veículos
 */

import sql from 'mssql';
import { config } from './env.js';
import { logger } from './logger.js';

// Configuração de conexão com SQL Server
const sqlConfig: sql.config = {
    server: config.MSSQL_HOST,
    port: config.MSSQL_PORT,
    database: config.MSSQL_DATABASE,
    user: config.MSSQL_USER,
    password: config.MSSQL_PASSWORD,
    options: {
        encrypt: config.MSSQL_ENCRYPT,
        trustServerCertificate: config.MSSQL_TRUST_CERT,
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

/**
 * Conecta ao ERP SQL Server
 */
export async function connectERP(): Promise<sql.ConnectionPool> {
    try {
        if (pool && pool.connected) {
            return pool;
        }

        pool = await sql.connect(sqlConfig);
        logger.info('✅ Conexão ERP SSW (SQL Server) estabelecida');

        pool.on('error', (err: Error) => {
            logger.error('❌ Erro na conexão ERP:', err);
            pool = null;
        });

        return pool;
    } catch (error) {
        logger.error('❌ Falha ao conectar ao ERP SSW:', error);
        throw error;
    }
}

/**
 * Executa query no ERP
 */
export async function queryERP<T>(query: string, params?: Record<string, unknown>): Promise<T[]> {
    const connection = await connectERP();
    const request = connection.request();

    // Adicionar parâmetros se existirem
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
    }

    const result = await request.query(query);
    return result.recordset as T[];
}

/**
 * Busca coletas do ERP
 */
export async function getColetasERP(limit: number = 100) {
    const query = `
    SELECT TOP (@limit)
      COL_ID as id,
      COL_NUMERO as numero,
      CLI_NOME as cliente_nome,
      CLI_CNPJ as cliente_cnpj,
      COL_ORIGEM_CIDADE as origem_cidade,
      COL_ORIGEM_UF as origem_uf,
      COL_DESTINO_CIDADE as destino_cidade,
      COL_DESTINO_UF as destino_uf,
      COL_STATUS as status,
      COL_VALOR_FRETE as valor_frete,
      COL_DATA as data_coleta,
      MOT_NOME as motorista_nome,
      MOT_CPF as motorista_cpf,
      VEI_PLACA as veiculo_placa
    FROM COLETAS
    LEFT JOIN CLIENTES ON COL_CLIENTE_ID = CLI_ID
    LEFT JOIN MOTORISTAS ON COL_MOTORISTA_ID = MOT_ID
    LEFT JOIN VEICULOS ON COL_VEICULO_ID = VEI_ID
    ORDER BY COL_DATA DESC
  `;

    return queryERP(query, { limit });
}

/**
 * Busca motoristas do ERP
 */
export async function getMotoristasERP(search?: string) {
    const query = search
        ? `SELECT * FROM MOTORISTAS WHERE MOT_NOME LIKE @search OR MOT_CPF LIKE @search`
        : `SELECT TOP 100 * FROM MOTORISTAS ORDER BY MOT_NOME`;

    return queryERP(query, search ? { search: `%${search}%` } : undefined);
}

/**
 * Busca veículos do ERP
 */
export async function getVeiculosERP(placa?: string) {
    const query = placa
        ? `SELECT * FROM VEICULOS WHERE VEI_PLACA LIKE @placa`
        : `SELECT TOP 100 * FROM VEICULOS ORDER BY VEI_PLACA`;

    return queryERP(query, placa ? { placa: `%${placa}%` } : undefined);
}

/**
 * Fecha conexão com ERP
 */
export async function closeERP(): Promise<void> {
    if (pool) {
        await pool.close();
        pool = null;
        logger.info('Conexão ERP fechada');
    }
}

export { sql };
