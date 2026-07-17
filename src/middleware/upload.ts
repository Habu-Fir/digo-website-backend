// src/middleware/upload.ts

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';

// ===============================
// UPLOAD DIRECTORY
// ===============================
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

// ===============================
// STORAGE CONFIGURATION
// ===============================
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },

    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(12).toString('hex');

        const ext = path.extname(file.originalname).toLowerCase();

        const fileName =
            path
                .basename(file.originalname, ext)
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '')
                .toLowerCase() || 'image';

        cb(null, `${fileName}-${Date.now()}-${uniqueSuffix}${ext}`);
    },
});

// ===============================
// ALLOWED FILE TYPES
// ===============================
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
]);

// ===============================
// FILE FILTER
// ===============================
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
        ALLOWED_MIME_TYPES.has(file.mimetype) &&
        ALLOWED_EXTENSIONS.has(ext)
    ) {
        cb(null, true);
        return;
    }

    cb(
        new Error(
            `Only image files are allowed. Received: ${file.mimetype} (${ext})`
        )
    );
};

// ===============================
// MULTER INSTANCE
// ===============================
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

// ===============================
// EXPORTS
// ===============================
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);

export default upload;

// ===============================
// DELETE FILE UTILITY
// ===============================
export const deleteFile = async (filePath: string): Promise<void> => {
    if (!filePath) return;

    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`🗑️ Deleted file: ${filePath}`);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};