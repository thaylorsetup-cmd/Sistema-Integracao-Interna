// =====================================================
// TIPOS PARA SISTEMA DE SUBMISSIONS (FILA DE CADASTROS)
// =====================================================

// Tipos de Cadastro disponíveis
export type TipoCadastro = 'novo_cadastro' | 'atualizacao' | 'agregado' | 'bens_rodando';

// Status da Submission (incluindo 'devolvido' para workflow bidirecional)
export type SubmissionStatus = 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'devolvido';

// Prioridade
export type SubmissionPriority = 'normal' | 'alta' | 'urgente';

// Tipos de documento
export type DocumentType =
    | 'crlv'
    | 'antt'
    | 'cnh'
    | 'endereco'
    | 'bancario'
    | 'pamcard'
    | 'gr'
    | 'rcv'
    | 'flex'
    | 'cte'
    | 'contrato' // DEPRECATED - manter por compatibilidade
    | 'outros';

// Categoria de rejeição
export type CategoriaRejeicao =
    | 'documento_ilegivel'
    | 'documento_incompleto'
    | 'dados_incorretos'
    | 'falta_documento'
    | 'outros';

// Interface para coordenadas de rastreamento
export interface CoordenadasRastreamento {
    latitude: number;
    longitude: number;
    endereco?: string;
}

// Interface principal de Submission
export interface Submission {
    id: string;

    // Tipo de cadastro
    tipo_cadastro: TipoCadastro;

    // Dados básicos do motorista
    nome_motorista: string;
    cpf: string;
    telefone?: string;
    email?: string;

    // Dados do veículo
    placa?: string;
    tipo_veiculo?: string;

    // Status e controle
    status: SubmissionStatus;
    prioridade: SubmissionPriority;

    // Rastreamento
    requer_rastreamento: boolean;
    coordenadas_rastreamento?: CoordenadasRastreamento;

    // Novos campos obrigatórios (Cadastro Novo)
    tel_proprietario?: string;
    endereco_residencial?: string;
    numero_pis?: string;
    origem?: string;
    destino?: string;
    valor_mercadoria?: number;
    tipo_mercadoria?: string;
    tel_motorista?: string;
    referencia_comercial_1?: string;
    referencia_comercial_2?: string;
    referencia_pessoal_1?: string;
    referencia_pessoal_2?: string;
    referencia_pessoal_3?: string;

    // Relacionamentos
    operador_id?: string;
    operador_nome?: string;
    analista_id?: string;
    analista_nome?: string;

    // Timestamps de workflow
    data_envio?: Date;
    data_inicio_analise?: Date;
    data_conclusao?: Date;

    // Feedback
    observacoes?: string;
    motivo_rejeicao?: string;
    categoria_rejeicao?: CategoriaRejeicao;

    // Auditoria
    created_at: Date;
    updated_at: Date;
}

// Interface para criação de submission
export interface SubmissionCreate {
    tipo_cadastro: TipoCadastro;
    nome_motorista: string;
    cpf: string;
    telefone?: string;
    email?: string;
    placa?: string;
    tipo_veiculo?: string;
    prioridade?: SubmissionPriority;
    requer_rastreamento?: boolean;
    coordenadas_rastreamento?: CoordenadasRastreamento;

    // Campos específicos para novo_cadastro
    tel_proprietario?: string;
    endereco_residencial?: string;
    numero_pis?: string;
    origem?: string;
    destino?: string;
    valor_mercadoria?: number;
    tipo_mercadoria?: string;
    tel_motorista?: string;
    referencia_comercial_1?: string;
    referencia_comercial_2?: string;
    referencia_pessoal_1?: string;
    referencia_pessoal_2?: string;
    referencia_pessoal_3?: string;

    observacoes?: string;
}

// Interface para update de submission
export interface SubmissionUpdate {
    nome_motorista?: string;
    telefone?: string;
    email?: string;
    placa?: string;
    tipo_veiculo?: string;
    prioridade?: SubmissionPriority;
    observacoes?: string;
    status?: SubmissionStatus;
    motivo_rejeicao?: string;
    categoria_rejeicao?: CategoriaRejeicao;
}

// Interface para item de checklist
export interface ChecklistItem {
    id: string;
    submission_id: string;
    item_nome: string;
    completado: boolean;
    completado_por?: string;
    completado_por_nome?: string;
    completado_em?: Date;
    observacao?: string;
    created_at: Date;
}

// Interface para template de checklist
export interface ChecklistTemplate {
    id: string;
    tipo_cadastro: TipoCadastro;
    item_nome: string;
    ordem: number;
    obrigatorio: boolean;
    created_at: Date;
}

// =====================================================
// CONFIGURAÇÃO DE DOCUMENTOS POR TIPO DE CADASTRO
// =====================================================

export interface DocumentConfig {
    obrigatorios: DocumentType[];
    opcionais: DocumentType[];
    quantidade_minima?: Partial<Record<DocumentType, number>>;
}

export const DOCUMENTOS_POR_TIPO: Record<TipoCadastro, DocumentConfig> = {
    novo_cadastro: {
        obrigatorios: ['crlv', 'antt', 'cnh'],
        opcionais: ['endereco', 'bancario', 'rcv', 'gr', 'flex', 'cte', 'outros'],
        quantidade_minima: {
            crlv: 3, // CRLV requer 3 documentos
        },
    },
    atualizacao: {
        obrigatorios: ['crlv'],
        opcionais: ['antt', 'cnh', 'endereco', 'bancario', 'outros'],
    },
    agregado: {
        obrigatorios: ['cnh', 'antt'],
        opcionais: ['crlv', 'bancario', 'outros'],
    },
    bens_rodando: {
        obrigatorios: [], // SEM obrigatoriedade documental
        opcionais: ['crlv', 'antt', 'cnh', 'gr', 'rcv', 'flex', 'cte', 'outros'],
    },
};

// =====================================================
// LABELS E NOMES AMIGÁVEIS
// =====================================================

export const TIPO_CADASTRO_LABELS: Record<TipoCadastro, { label: string; icon: string; description: string }> = {
    novo_cadastro: {
        label: 'Novo Cadastro',
        icon: '➕',
        description: 'Cadastro completo de novo motorista/veículo',
    },
    atualizacao: {
        label: 'Atualizar Cadastro',
        icon: '🔄',
        description: 'Atualização de documentos existentes',
    },
    agregado: {
        label: 'Agregado',
        icon: '🤝',
        description: 'Cadastro de motorista agregado',
    },
    bens_rodando: {
        label: 'Bens Rodando',
        icon: '🚛',
        description: 'Cadastro simplificado sem documentos obrigatórios',
    },
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    crlv: 'CRLV',
    antt: 'ANTT',
    cnh: 'CNH',
    endereco: 'Comprovante de Endereço',
    bancario: 'Dados Bancários',
    pamcard: 'Pamcard',
    gr: 'GR',
    rcv: 'RCV',
    flex: 'FLEX',
    cte: 'CTE',
    contrato: 'Contrato (Deprecated)',
    outros: 'Outros',
};

export const STATUS_LABELS: Record<SubmissionStatus, { label: string; color: string; bgColor: string }> = {
    pendente: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    em_analise: { label: 'Em Análise', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    aprovado: { label: 'Aprovado', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejeitado: { label: 'Rejeitado', color: 'text-red-700', bgColor: 'bg-red-100' },
    devolvido: { label: 'Devolvido', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

export const CATEGORIA_REJEICAO_LABELS: Record<CategoriaRejeicao, string> = {
    documento_ilegivel: 'Documento Ilegível',
    documento_incompleto: 'Documento Incompleto',
    dados_incorretos: 'Dados Incorretos',
    falta_documento: 'Falta Documento Obrigatório',
    outros: 'Outros',
};

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Verifica se todos os documentos obrigatórios foram enviados
 */
export function verificarDocumentosObrigatorios(
    tipoCadastro: TipoCadastro,
    documentosEnviados: Record<DocumentType, number>
): { completo: boolean; pendentes: DocumentType[] } {
    const config = DOCUMENTOS_POR_TIPO[tipoCadastro];
    const pendentes: DocumentType[] = [];

    for (const tipo of config.obrigatorios) {
        const minimo = config.quantidade_minima?.[tipo] || 1;
        const enviados = documentosEnviados[tipo] || 0;

        if (enviados < minimo) {
            pendentes.push(tipo);
        }
    }

    return {
        completo: pendentes.length === 0,
        pendentes,
    };
}

/**
 * Determina se uma carga requer rastreamento baseado em valor e tipo
 */
export function verificarNecessidadeRastreamento(
    valorMercadoria: number,
    tipoMercadoria: string
): boolean {
    const valorMinimo = 50000; // R$ 50.000
    const tiposEspeciais = ['eletronicos', 'medicamentos', 'joias', 'eletronico', 'eletrônicos'];

    return (
        valorMercadoria > valorMinimo ||
        tiposEspeciais.includes(tipoMercadoria.toLowerCase())
    );
}
