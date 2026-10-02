const express = require('express');
const router = express.Router();

const {
    db,
    comparePassword,
    hashPassword,
    encryptCPF,
    hashCPF,
    decryptCPF,
    normalizeCPF
} = require('./database');

function requireAuth(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            erro: 'Sessão expirada ou usuário não autenticado.'
        });
    }

    next();
}

/*
 * Login
 */
router.post('/login', (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                erro: 'Informe o e-mail e a senha.'
            });
        }

        const usuario = db
            .prepare(
                `
                SELECT id, nome, email, senha_hash, ativo
                FROM usuarios
                WHERE email = ?
                `
            )
            .get(email.trim().toLowerCase());

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos.'
            });
        }

        const senhaValida = comparePassword(
            senha,
            usuario.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos.'
            });
        }

        req.session.regenerate((erro) => {
            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    erro: 'Não foi possível iniciar a sessão.'
                });
            }

            req.session.usuario = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            };

            req.session.save((erroSave) => {
                if (erroSave) {
                    console.error(erroSave);

                    return res.status(500).json({
                        erro: 'Não foi possível salvar a sessão.'
                    });
                }

                res.json({
                    mensagem: 'Login realizado com sucesso.',
                    usuario: req.session.usuario
                });
            });
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro interno durante a autenticação.'
        });
    }
});

/*
 * Usuário atual
 */
router.get('/me', requireAuth, (req, res) => {
    res.json({
        usuario: req.session.usuario
    });
});

/*
 * Logout
 */
router.post('/logout', (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({
                erro: 'Não foi possível encerrar a sessão.'
            });
        }

        res.clearCookie('sid');

        res.json({
            mensagem: 'Logout realizado com sucesso.'
        });
    });
});

module.exports = {
    router,
    requireAuth
};
