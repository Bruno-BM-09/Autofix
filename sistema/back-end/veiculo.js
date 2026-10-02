const express = require('express');
const router = express.Router();

const { db } = require('./database');
const { requireAuth } = require('./auth');

function normalizarPlaca(placa) {
    return String(placa || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

/*
 * LISTAR VEÍCULOS
 */
router.get('/', requireAuth, (req, res) => {
    try {
        const veiculos = db
            .prepare(
                `
                SELECT
                    v.id,
                    v.cliente_id,
                    v.placa,
                    v.marca,
                    v.modelo,
                    v.ano,
                    c.nome AS cliente_nome
                FROM veiculos v
                INNER JOIN clientes c
                    ON c.id = v.cliente_id
                ORDER BY c.nome ASC, v.modelo ASC
                `
            )
            .all();

        res.json(veiculos);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao listar veículos.'
        });
    }
});

/*
 * CADASTRAR VEÍCULO
 */
router.post('/', requireAuth, (req, res) => {
    try {
        const {
            cliente_id,
            placa,
            marca,
            modelo,
            ano
        } = req.body;

        const clienteId = Number(cliente_id);
        const anoNumero = Number(ano);
        const placaNormalizada = normalizarPlaca(placa);

        if (
            !clienteId ||
            !placaNormalizada ||
            !marca ||
            !modelo ||
            !anoNumero
        ) {
            return res.status(400).json({
                erro: 'Cliente, placa, marca, modelo e ano são obrigatórios.'
            });
        }

        if (placaNormalizada.length !== 7) {
            return res.status(400).json({
                erro: 'Placa inválida.'
            });
        }

        if (anoNumero < 1900 || anoNumero > 2100) {
            return res.status(400).json({
                erro: 'Ano do veículo inválido.'
            });
        }

        const cliente = db
            .prepare(
                `SELECT id FROM clientes WHERE id = ?`
            )
            .get(clienteId);

        if (!cliente) {
            return res.status(400).json({
                erro: 'O cliente informado não existe.'
            });
        }

        const existente = db
            .prepare(
                `
                SELECT id
                FROM veiculos
                WHERE placa = ?
                `
            )
            .get(placaNormalizada);

        if (existente) {
            return res.status(409).json({
                erro: 'Já existe um veículo com esta placa.'
            });
        }

        const resultado = db
            .prepare(
                `
                INSERT INTO veiculos
                    (cliente_id, placa, marca, modelo, ano)
                VALUES
                    (?, ?, ?, ?, ?)
                `
            )
            .run(
                clienteId,
                placaNormalizada,
                marca.trim(),
                modelo.trim(),
                anoNumero
            );

        res.status(201).json({
            mensagem: 'Veículo cadastrado com sucesso.',
            id: resultado.lastInsertRowid
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar veículo.'
        });
    }
});

/*
 * EDITAR VEÍCULO
 */
router.put('/:id', requireAuth, (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            cliente_id,
            placa,
            marca,
            modelo,
            ano
        } = req.body;

        const clienteId = Number(cliente_id);
        const anoNumero = Number(ano);
        const placaNormalizada = normalizarPlaca(placa);

        if (!id || !clienteId || !placaNormalizada || !marca || !modelo) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios.'
            });
        }

        const cliente = db
            .prepare(
                `SELECT id FROM clientes WHERE id = ?`
            )
            .get(clienteId);

        if (!cliente) {
            return res.status(400).json({
                erro: 'Cliente não encontrado.'
            });
        }

        const placaExistente = db
            .prepare(
                `
                SELECT id
                FROM veiculos
                WHERE placa = ?
                AND id <> ?
                `
            )
            .get(placaNormalizada, id);

        if (placaExistente) {
            return res.status(409).json({
                erro: 'Esta placa já está cadastrada em outro veículo.'
            });
        }

        db.prepare(
            `
            UPDATE veiculos
            SET
                cliente_id = ?,
                placa = ?,
                marca = ?,
                modelo = ?,
                ano = ?
            WHERE id = ?
            `
        ).run(
            clienteId,
            placaNormalizada,
            marca.trim(),
            modelo.trim(),
            anoNumero,
            id
        );

        res.json({
            mensagem: 'Veículo atualizado com sucesso.'
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar veículo.'
        });
    }
});

/*
 * EXCLUIR
 */
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const id = Number(req.params.id);

        db.prepare(
            `
            DELETE FROM veiculos
            WHERE id = ?
            `
        ).run(id);

        res.json({
            mensagem: 'Veículo excluído com sucesso.'
        });
    } catch (erro) {
        if (String(erro.message).includes('FOREIGN KEY')) {
            return res.status(409).json({
                erro: 'Este veículo possui ordens de serviço vinculadas.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao excluir veículo.'
        });
    }
});

module.exports = router;
