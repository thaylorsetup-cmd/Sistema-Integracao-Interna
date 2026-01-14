// @ts-nocheck
/**
 * SSW Service - Integração com SSW-HELPER API
 * 
 * Este serviço comunica com o SSW-HELPER (middleware) para:
 * - Autenticação automática
 * - Consulta de motoristas por CPF (função ssw0028)
 * - Parse de respostas HTML para dados estruturados
 */

import type {
    DriverData,
    SSWApiResponse,
    SSWAuthStatus,
    VehicleData
} from '@/types/ssw.types';

// URL base do SSW-HELPER (pode ser configurado via env)
const SSW_HELPER_URL = import.meta.env.VITE_SSW_HELPER_URL || 'http://localhost:3000';

// Filial padrão para consultas
const DEFAULT_FILIAL = 'MTZ';

/**
 * Remove formatação do CPF (pontos e traços)
 */
export function cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
}

/**
 * Formata CPF com máscara (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
    const cleaned = cleanCPF(cpf);
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida se o CPF tem formato válido (11 dígitos)
 */
export function isValidCPF(cpf: string): boolean {
    const cleaned = cleanCPF(cpf);
    return cleaned.length === 11 && /^\d{11}$/.test(cleaned);
}

/**
 * Verifica status de autenticação no SSW-HELPER
 */
export async function checkSSWAuthStatus(): Promise<SSWAuthStatus> {
    try {
        const response = await fetch(`${SSW_HELPER_URL}/api/auth/status`);
        const data = await response.json();
        return {
            authenticated: data.authenticated || false,
            user: data.user,
            sessionExpiry: data.sessionExpiry
        };
    } catch (error) {
        console.error('[SSW Service] Erro ao verificar status:', error);
        return { authenticated: false };
    }
}

/**
 * Realiza autenticação automática no SSW-HELPER
 * Usa as credenciais configuradas no .env do SSW-HELPER
 */
export async function authenticateSSW(): Promise<boolean> {
    try {
        const response = await fetch(`${SSW_HELPER_URL}/api/auth/login-auto`, {
            method: 'POST'
            // Removido Content-Type e body - endpoint não requer body
        });

        const data: SSWApiResponse = await response.json();

        if (data.success) {
            console.log('[SSW Service] Autenticação realizada com sucesso');
            return true;
        } else {
            console.error('[SSW Service] Erro na autenticação:', data.error);
            return false;
        }
    } catch (error) {
        console.error('[SSW Service] Erro de conexão na autenticação:', error);
        return false;
    }
}

/**
 * Garante que há uma sessão ativa antes de fazer consultas
 */
async function ensureAuthenticated(): Promise<boolean> {
    const status = await checkSSWAuthStatus();

    if (!status.authenticated) {
        return await authenticateSSW();
    }

    return true;
}

/**
 * Parse do HTML retornado pelo SSW para extrair dados do motorista
 * O SSW retorna HTML/XML que precisa ser parseado
 */
function parseSSWDriverResponse(htmlContent: string): DriverData | null {
    try {
        // Criar parser DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Tentar encontrar tabela de resultados
        const rows = doc.querySelectorAll('table tr');

        if (rows.length <= 1) {
            // Sem resultados ou apenas header
            return null;
        }

        // Extrair dados da primeira linha de resultado (após header)
        const dataRow = rows[1];
        const cells = dataRow.querySelectorAll('td');

        if (cells.length < 3) {
            return null;
        }

        // Mapear células para dados (ajustar conforme estrutura real do SSW)
        const driverData: DriverData = {
            cpf: cells[0]?.textContent?.trim() || '',
            nome: cells[1]?.textContent?.trim() || '',
            situacao: mapSituacao(cells[2]?.textContent?.trim()),
            fonte: 'ssw'
        };

        // Tentar extrair campos adicionais se existirem
        if (cells.length > 3) {
            driverData.telefone = cells[3]?.textContent?.trim();
        }
        if (cells.length > 4) {
            driverData.categoriaCNH = cells[4]?.textContent?.trim();
        }
        if (cells.length > 5) {
            driverData.vencimentoCNH = cells[5]?.textContent?.trim();
            driverData.cnhValida = isDateValid(driverData.vencimentoCNH);
        }

        // Extrair veículos associados se houver
        const vehicleTable = doc.querySelector('table:nth-of-type(2)');
        if (vehicleTable) {
            driverData.veiculosAssociados = parseVehiclesTable(vehicleTable);
        }

        return driverData;

    } catch (error) {
        console.error('[SSW Service] Erro ao parsear resposta:', error);
        return null;
    }
}

/**
 * Mapeia texto de situação para enum
 */
function mapSituacao(text?: string): DriverData['situacao'] {
    const normalized = text?.toLowerCase().trim() || '';

    if (normalized.includes('ativo') || normalized.includes('liberado')) {
        return 'ativo';
    }
    if (normalized.includes('inativo') || normalized.includes('desativado')) {
        return 'inativo';
    }
    if (normalized.includes('bloqueado') || normalized.includes('impedido')) {
        return 'bloqueado';
    }
    return 'pendente';
}

/**
 * Verifica se uma data está no futuro (CNH válida)
 */
function isDateValid(dateStr?: string): boolean {
    if (!dateStr) return false;

    try {
        // Tentar parsear formato DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const date = new Date(
                parseInt(parts[2]),
                parseInt(parts[1]) - 1,
                parseInt(parts[0])
            );
            return date > new Date();
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Parse de tabela de veículos associados
 */
function parseVehiclesTable(table: Element): VehicleData[] {
    const vehicles: VehicleData[] = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach((row, index) => {
        if (index === 0) return; // Pular header

        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            vehicles.push({
                placa: cells[0]?.textContent?.trim() || '',
                tipo: 'outro',
                situacao: mapSituacao(cells[1]?.textContent?.trim()) as VehicleData['situacao']
            });
        }
    });

    return vehicles;
}

/**
 * Busca motorista por CPF no SSW
 *
 * @param cpf CPF do motorista (com ou sem formatação)
 * @param filial Filial para consulta (padrão: MTZ) - DEPRECATED: não usado na nova API
 * @returns Dados do motorista ou null se não encontrado
 */
export async function searchDriverByCPF(
    cpf: string,
    filial: string = DEFAULT_FILIAL
): Promise<DriverData | null> {
    const cleanedCPF = cleanCPF(cpf);

    if (!isValidCPF(cleanedCPF)) {
        console.warn('[SSW Service] CPF inválido:', cpf);
        return null;
    }

    try {
        // Garantir autenticação
        const isAuth = await ensureAuthenticated();
        if (!isAuth) {
            throw new Error('Não foi possível autenticar no SSW - preencha os dados manualmente');
        }

        // Usar nova rota dedicada de drivers
        console.log('[SSW Service] Buscando motorista via /api/drivers:', cleanedCPF);
        const response = await fetch(`${SSW_HELPER_URL}/api/drivers/${cleanedCPF}`, {
            method: 'GET'
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('[SSW Service] Motorista não cadastrado no SSW');
                return null;
            }
            if (response.status === 401) {
                throw new Error('Não foi possível autenticar no SSW - preencha os dados manualmente');
            }
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const result: SSWApiResponse = await response.json();

        if (result.success && result.data) {
            const driverData = result.data as DriverData;

            // Garantir que o CPF está formatado corretamente
            driverData.cpf = formatCPF(cleanedCPF);
            console.log('[SSW Service] Motorista encontrado:', driverData.nome);
            return driverData;
        } else {
            console.warn('[SSW Service] Motorista não encontrado:', result.error);
            return null;
        }

    } catch (error) {
        console.error('[SSW Service] Erro de conexão:', error);
        throw error;
    }
}

/**
 * Busca detalhes completos do motorista (incluindo documentação)
 * Agora é um alias para searchDriverByCPF - mesma funcionalidade
 */
export async function getDriverDetails(
    cpf: string,
    seq?: string
): Promise<DriverData | null> {
    // Nova API não usa 'seq' - retorna todos os detalhes em uma chamada
    return searchDriverByCPF(cpf);
}

/**
 * Verifica se o SSW-HELPER está disponível
 */
export async function isSSWHelperAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${SSW_HELPER_URL}/api/auth/status`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // Timeout de 3 segundos
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Export default para uso simplificado
export default {
    searchDriverByCPF,
    getDriverDetails,
    authenticateSSW,
    checkSSWAuthStatus,
    isSSWHelperAvailable,
    cleanCPF,
    formatCPF,
    isValidCPF
};
