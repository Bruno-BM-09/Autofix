const express = require('express');
const router = express.Router();

const { db } = require('./database');
const { requireAuth } = require('./auth');

/*
 * LISTAR OS
 *
 * Ordenação:
 * mais recente primeiro.
 *
 * Também retorna dados consolidados do cliente e veículo.
 */
router.get('/', requireAuth, (req, res) => {
    try {
        const ordens = db
            .prepare(
                `
                SELECT
                    os.id,
                    os.cliente_id,
                    os.veiculo_id,
                    os.descricao,
                    os.status,
                    os.valor,
                    os.aberta_em,
                    os.concluida_em,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email,

                    v.placa AS veiculo_placa,
                    v.marca AS veiculo_marca,
                    v.modelo AS veiculo_modelo,
                    v.ano AS veiculo_ano

                FROM ordens_servico os

                INNER JOIN clientes c
                    ON c.id = os.cliente_id

                INNER JOIN veiculos v
                    ON v.id = os.veiculo_id

                ORDER BY
                    datetime(os.aberta_em) DESC
                `
            )
            .all();

        res.json(ordens);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao listar ordens de serviço.'
        });
    }
});

/*
 * CADASTRAR OS
 */
router.post('/', requireAuth, (req, res) => {
    try {
        const {
            cliente_id,
            veiculo_id,
            descricao,
            status,
            valor,
            aberta_em
        } = req.body;

        const clienteId = Number(cliente_id);
        const veiculoId = Number(veiculo_id);
        const valorNumero = Number(valor || 0);

        if (!clienteId || !veiculoId || !descricao) {
            return res.status(400).json({
                erro: 'Cliente, veículo e descrição são obrigatórios.'
            });
        }

        if (valorNumero < 0 || Number.isNaN(valorNumero)) {
            return res.status(400).json({
                erro: 'Valor inválido.'
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

        /*
         * MUITO IMPORTANTE:
         * verifica se o veículo realmente pertence
         * ao cliente selecionado.
         */
        const veiculo = db
            .prepare(
                `
                SELECT id, cliente_id
                FROM veiculos
                WHERE id = ?
                `
            )
            .get(veiculoId);

        if (!veiculo) {
            return res.status(400).json({
                erro: 'Veículo não encontrado.'
            });
        }

        if (veiculo.cliente_id !== clienteId) {
            return res.status(400).json({
                erro: 'O veículo selecionado não pertence ao cliente informado.'
            });
        }

        const statusPermitidos = [
            'ABERTA',
            'EM_ANDAMENTO',
            'CONCLUIDA',
            'CANCELADA'
        ];

        const statusFinal = statusPermitidos.includes(status)
            ? status
            : 'ABERTA';

        let dataAbertura = aberta_em || null;

        if (dataAbertura) {
            dataAbertura = dataAbertura.replace('T', ' ') + ':00';
        }

        const resultado = db
            .prepare(
                `
                INSERT INTO ordens_servico
                    (
                        cliente_id,
                        veiculo_id,
                        descricao,
                        status,
                        valor,
                        aberta_em
                    )
                VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        COALESCE(?, CURRENT_TIMESTAMP)
                    )
                `
            )
            .run(
                clienteId,
                veiculoId,
                descricao.trim(),
                statusFinal,
                valorNumero,
                dataAbertura
            );

        res.status(201).json({
            mensagem: 'Ordem de serviço cadastrada com sucesso.',
            id: resultado.lastInsertRowid
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar ordem de serviço.'
        });
    }
});

module.exports = router;
