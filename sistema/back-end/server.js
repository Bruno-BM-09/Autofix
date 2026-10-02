require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const path = require('path');

const { db } = require('./database');

const auth = require('./auth');
const clientes = require('./cliente');
const veiculos = require('./veiculo');
const ordens = require('./os');

const app = express();

const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.use(
    helmet({
        hsts: false
    })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

/*
 * Limitação das tentativas de login.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        erro: 'Muitas tentativas de login. Aguarde alguns minutos.'
    }
});

/*
 * Sessão.
 *
 * 30 minutos.
 */
app.use(
    session({
        name: 'sid',

        secret:
            process.env.SESSION_SECRET ||
            'chave-apenas-para-desenvolvimento',

        resave: false,
        saveUninitialized: false,
        rolling: true,

        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 60 * 1000
        }
    })
);

/*
 * Login
 */
app.use('/api/login', loginLimiter);

/*
 * APIs
 */
app.use('/api', auth.router);
app.use('/api/clientes', clientes);
app.use('/api/veiculos', veiculos);
app.use('/api/os', ordens);

/*
 * Dashboard
 */
const { requireAuth } = require('./auth');

app.get('/api/dashboard', requireAuth, (req, res) => {
    try {
        const clientesCount = db
            .prepare(`SELECT COUNT(*) AS total FROM clientes`)
            .get().total;

        const veiculosCount = db
            .prepare(`SELECT COUNT(*) AS total FROM veiculos`)
            .get().total;

        const osCount = db
            .prepare(`SELECT COUNT(*) AS total FROM ordens_servico`)
            .get().total;

        const osAbertas = db
            .prepare(
                `
                SELECT COUNT(*) AS total
                FROM ordens_servico
                WHERE status IN ('ABERTA', 'EM_ANDAMENTO')
                `
            )
            .get().total;

        res.json({
            usuario: req.session.usuario,
            totais: {
                clientes: clientesCount,
                veiculos: veiculosCount,
                ordens: osCount,
                os_abertas: osAbertas
            }
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao carregar dashboard.'
        });
    }
});

/*
 * Front-end
 */
app.use(
    express.static(
        path.join(__dirname, '..', 'front-end')
    )
);

/*
 * Tratamento de erros
 */
app.use((erro, req, res, next) => {
    console.error(erro);

    if (res.headersSent) {
        return next(erro);
    }

    res.status(500).json({
        erro: 'Erro interno do servidor.'
    });
});

app.listen(PORT, () => {
    console.log('');
    console.log('======================================');
    console.log(' Sistema de Gestão iniciado');
    console.log('======================================');
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log('');
});
