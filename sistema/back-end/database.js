const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DATABASE_DIR = path.join(__dirname, '..', 'database');
const DATABASE_FILE = path.join(DATABASE_DIR, 'sistema.db');
const SCHEMA_FILE = path.join(__dirname, '..', '..', 'schema.sql');

if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

const db = new Database(DATABASE_FILE);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const encryptionKeyHex = process.env.ENCRYPTION_KEY;
const cpfHashKeyHex = process.env.CPF_HASH_KEY;

if (!encryptionKeyHex || !/^[0-9a-fA-F]{64}$/.test(encryptionKeyHex)) {
    throw new Error(
        'ENCRYPTION_KEY deve possuir exatamente 64 caracteres hexadecimais.'
    );
}

if (!cpfHashKeyHex || !/^[0-9a-fA-F]{64}$/.test(cpfHashKeyHex)) {
    throw new Error(
        'CPF_HASH_KEY deve possuir exatamente 64 caracteres hexadecimais.'
    );
}

const ENCRYPTION_KEY = Buffer.from(encryptionKeyHex, 'hex');
const CPF_HASH_KEY = Buffer.from(cpfHashKeyHex, 'hex');

function normalizeCPF(cpf) {
    return String(cpf || '').replace(/\D/g, '');
}

function encryptCPF(cpf) {
    const normalized = normalizeCPF(cpf);

    if (normalized.length !== 11) {
        throw new Error('CPF deve possuir 11 dígitos.');
    }

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        ENCRYPTION_KEY,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(normalized, 'utf8'),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([
        iv,
        tag,
        encrypted
    ]).toString('base64');
}

function decryptCPF(encryptedCPF) {
    try {
        const data = Buffer.from(encryptedCPF, 'base64');

        const iv = data.subarray(0, 12);
        const tag = data.subarray(12, 28);
        const encrypted = data.subarray(28);

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            ENCRYPTION_KEY,
            iv
        );

        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    } catch {
        return null;
    }
}

function hashCPF(cpf) {
    const normalized = normalizeCPF(cpf);

    if (normalized.length !== 11) {
        throw new Error('CPF deve possuir 11 dígitos.');
    }

    return crypto
        .createHmac('sha256', CPF_HASH_KEY)
        .update(normalized)
        .digest('hex');
}

function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

/*
 * Funções disponíveis dentro do schema.sql.
 */
db.function('encrypt_cpf', encryptCPF);
db.function('hash_cpf', hashCPF);
db.function('hash_password', hashPassword);

function initializeDatabase() {
    const table = db
        .prepare(
            `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name = 'usuarios'
            `
        )
        .get();

    if (!table) {
        const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
        db.exec(schema);

        console.log('Banco de dados criado e populado.');
    }
}

function resetDatabase() {
    db.close();

    if (fs.existsSync(DATABASE_FILE)) {
        fs.unlinkSync(DATABASE_FILE);
    }

    console.log('Banco removido. Execute novamente: npm start');
}

initializeDatabase();

module.exports = {
    db,
    encryptCPF,
    decryptCPF,
    hashCPF,
    normalizeCPF,
    hashPassword,
    comparePassword,
    resetDatabase
};
