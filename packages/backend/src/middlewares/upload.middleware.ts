/**
 * Middleware de Upload com Multer
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';

// Garantir que pasta de uploads existe
const uploadDir = path.resolve(config.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Criar pasta por data
        const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const destPath = path.join(uploadDir, dateFolder);

        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }

        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        // Gerar nome único mantendo extensão original
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        const safeName = `${uniqueId}${ext}`;
        cb(null, safeName);
    },
});

// Filtro de tipos aceitos
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
};

// Configuração principal
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.MAX_FILE_SIZE, // 50MB
        files: 20, // Máximo 20 arquivos por vez
    },
});

// Upload único
export const uploadSingle = upload.single('file');

// Upload múltiplo
export const uploadMultiple = upload.array('files', 20);

// Upload com campos específicos
export const uploadFields = upload.fields([
    { name: 'documents', maxCount: 20 },
    { name: 'avatar', maxCount: 1 },
]);
