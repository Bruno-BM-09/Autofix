const express = require('express');
const router = express.Router();

const {
    db,
    encryptCPF,
    decryptCPF,
    hashCPF,
    normalizeCPF
} = require('./database');

const { requireAuth } = require('./auth');

/*
 * LISTAR / BUSCAR CLIENTES
 *
 * /api/clientes
 * /api/clientes?q=carlos
 * /api/clientes?q=11111111111
 */
router.get('/', requireAuth, (req, res) => {
    try {
        const busca = String(req.query.q || '').trim();

        let clientes;

        if (!busca) {
            clientes = db
                .prepare(
                    `
                    SELECT
                        id,
                        nome,
                        cpf_encrypted,
                        telefone,
                        email,
                        endereco,
                        criado_em
                    FROM clientes
                    ORDER BY nome ASC
                    `
                )
                .all();
        } else {
            const cpfHashBusca = /^[0-9.\-\s]+$/.test(busca)
                ? hashCPF(normalizeCPF(busca))
                : null;

            clientes = db
                .prepare(
                    `
                    SELECT
                        id,
                        nome,
                        cpf_encrypted,
                        telefone,
                        email,
                        endereco,
                        criado_em
                    FROM clientes
                    WHERE nome LIKE ?
                       OR (? IS NOT NULL AND cpf_hash = ?)
                    ORDER BY nome ASC
                    `
                )
                .all(`%${busca}%`, cpfHashBusca, cpfHashBusca);
        }

        clientes = clientes.map((cliente) => ({
            ...cliente,
            cpf: decryptCPF(cliente.cpf_encrypted)
        }));

        clientes.forEach((cliente) => {
            delete cliente.cpf_encrypted;
        });

        res.json(clientes);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao listar clientes.'
        });
    }
});

/*
 * CADASTRAR CLIENTE
 */
router.post('/', requireAuth, (req, res) => {
    try {
        const {
            nome,
            cpf,
            telefone,
            email,
            endereco
        } = req.body;

        const cpfNormalizado = normalizeCPF(cpf);

        if (!nome || !cpfNormalizado) {
            return res.status(400).json({
                erro: 'Nome e CPF são obrigatórios.'
            });
        }

        if (cpfNormalizado.length !== 11) {
            return res.status(400).json({
                erro: 'CPF deve possuir 11 dígitos.'
            });
        }

        const cpfHash = hashCPF(cpfNormalizado);
        const cpfEncrypted = encryptCPF(cpfNormalizado);

        const existente = db
            .prepare(
                `
                SELECT id
                FROM clientes
                WHERE cpf_hash = ?
                `
            )
            .get(cpfHash);

        if (existente) {
            return res.status(409).json({
                erro: 'Já existe um cliente cadastrado com este CPF.'
            });
        }

        const resultado = db
            .prepare(
                `
                INSERT INTO clientes
                    (nome, cpf_encrypted, cpf_hash, telefone, email, endereco)
                VALUES
                    (?, ?, ?, ?, ?, ?)
                `
            )
            .run(
                nome.trim(),
                cpfEncrypted,
                cpfHash,
                telefone || null,
                email || null,
                endereco || null
            );

        res.status(201).json({
            mensagem: 'Cliente cadastrado com sucesso.',
            id: resultado.lastInsertRowid
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar cliente.'
        });
    }
});

/*
 * EDITAR CLIENTE
 */
router.put('/:id', requireAuth, (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            nome,
            cpf,
            telefone,
            email,
            endereco
        } = req.body;

        if (!id || !nome || !cpf) {
            return res.status(400).json({
                erro: 'Dados obrigatórios não informados.'
            });
        }

        const cpfNormalizado = normalizeCPF(cpf);

        if (cpfNormalizado.length !== 11) {
            return res.status(400).json({
                erro: 'CPF deve possuir 11 dígitos.'
            });
        }

        const outroCliente = db
            .prepare(
                `
                SELECT id
                FROM clientes
                WHERE cpf_hash = ?
                AND id <> ?
                `
            )
            .get(hashCPF(cpfNormalizado), id);

        if (outroCliente) {
            return res.status(409).json({
                erro: 'Este CPF já pertence a outro cliente.'
            });
        }

        db.prepare(
            `
            UPDATE clientes
            SET
                nome = ?,
                cpf_encrypted = ?,
                cpf_hash = ?,
                telefone = ?,
                email = ?,
                endereco = ?
            WHERE id = ?
            `
        ).run(
            nome.trim(),
            encryptCPF(cpfNormalizado),
            hashCPF(cpfNormalizado),
            telefone || null,
            email || null,
            endereco || null,
            id
        );

        res.json({
            mensagem: 'Cliente atualizado com sucesso.'
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar cliente.'
        });
    }
});

/*
 * EXCLUIR CLIENTE
 */
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const id = Number(req.params.id);

        const cliente = db
            .prepare(
                `SELECT id FROM clientes WHERE id = ?`
            )
            .get(id);

        if (!cliente) {
            return res.status(404).json({
                erro: 'Cliente não encontrado.'
            });
        }

        db.prepare(
            `
            DELETE FROM clientes
            WHERE id = ?
            `
        ).run(id);

        res.json({
            mensagem: 'Cliente excluído com sucesso.'
        });
    } catch (erro) {
        if (String(erro.message).includes('FOREIGN KEY')) {
            return res.status(409).json({
                erro: 'Este cliente possui veículos ou ordens de serviço vinculados e não pode ser excluído.'
            });
        }

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao excluir cliente.'
        });
    }
});

module.exports = router;
