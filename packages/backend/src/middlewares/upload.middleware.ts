/**
 * Middleware de Upload
 * Configuracao do Multer para upload de documentos
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Tipos de arquivo permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Extensoes permitidas
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
];

// Garantir que diretorio de uploads existe
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Diretorio de uploads criado: ${uploadDir}`);
}

// Configuracao de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar subdiretorio por data
    const dateDir = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fullPath = path.join(uploadDir, dateDir);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Gerar nome unico: uuid_timestamp_original
    const uuid = randomUUID();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuid}_${timestamp}${ext}`;

    cb(null, safeName);
  },
});

// Filtro de arquivos
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  // Verificar MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Upload rejeitado: MIME type invalido ${file.mimetype}`);
    cb(new Error(`Tipo de arquivo nao permitido: ${file.mimetype}`));
    return;
  }

  // Verificar extensao
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    logger.warn(`Upload rejeitado: extensao invalida ${ext}`);
    cb(new Error(`Extensao de arquivo nao permitida: ${ext}`));
    return;
  }

  cb(null, true);
};

// Instancia do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE, // 50MB padrao
    files: 10, // Maximo de 10 arquivos por vez
  },
});

// Middleware para upload de documento unico
export const uploadSingle = upload.single('file');

// Middleware para upload de multiplos documentos
export const uploadMultiple = upload.array('files', 10);

// Middleware para upload de campos especificos
export const uploadFields = upload.fields([
  { name: 'crlv', maxCount: 1 },
  { name: 'antt', maxCount: 1 },
  { name: 'cnh', maxCount: 1 },
  { name: 'endereco', maxCount: 1 },
  { name: 'bancario', maxCount: 1 },
  { name: 'pamcard', maxCount: 1 },
  { name: 'gr', maxCount: 1 },
  { name: 'rcv', maxCount: 1 },
]);

// Helper para deletar arquivo
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Arquivo deletado: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Erro ao deletar arquivo ${filePath}:`, error);
    return false;
  }
}

// Helper para obter caminho completo
export function getFilePath(relativePath: string): string {
  return path.resolve(uploadDir, relativePath);
}

// Helper para verificar se arquivo existe
export function fileExists(relativePath: string): boolean {
  return fs.existsSync(getFilePath(relativePath));
}
