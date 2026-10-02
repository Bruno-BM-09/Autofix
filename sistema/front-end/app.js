import {
    api
} from './api.js';

import {
    carregarClientes
} from './cliente.js';

import {
    carregarVeiculos
} from './veiculo.js';

import {
    carregarOS
} from './os.js';

const loginScreen = document.getElementById(
    'login-screen'
);

const appScreen = document.getElementById(
    'app-screen'
);

const loginForm = document.getElementById(
    'login-form'
);

const loginMessage = document.getElementById(
    'login-message'
);

const userName = document.getElementById(
    'user-name'
);

const dashboardUser = document.getElementById(
    'dashboard-user'
);

let usuarioAtual = null;

function mostrarLogin() {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

function mostrarAplicacao(usuario) {
    usuarioAtual = usuario;

    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');

    userName.textContent = usuario.nome;
    dashboardUser.textContent = usuario.nome;

    carregarDashboard();
}

async function carregarDashboard() {
    try {
        const dados = await api('/api/dashboard');

        document.getElementById(
            'total-clientes'
        ).textContent = dados.totais.clientes;

        document.getElementById(
            'total-veiculos'
        ).textContent = dados.totais.veiculos;

        document.getElementById(
            'total-os'
        ).textContent = dados.totais.ordens;

        document.getElementById(
            'total-os-abertas'
        ).textContent = dados.totais.os_abertas;
    } catch (erro) {
        if (erro.status === 401) {
            mostrarLogin();
        }
    }
}

function abrirPagina(nome) {
    document
        .querySelectorAll('.page')
        .forEach((pagina) => {
            pagina.classList.add('hidden');
        });

    const pagina = document.getElementById(
        `page-${nome}`
    );

    if (pagina) {
        pagina.classList.remove('hidden');
    }

    document
        .querySelectorAll('.nav-button')
        .forEach((botao) => {
            botao.classList.toggle(
                'active',
                botao.dataset.page === nome
            );
        });

    const titulos = {
        dashboard: [
            'Dashboard',
            'Visão geral do sistema'
        ],

        clientes: [
            'Clientes',
            'Cadastro e gerenciamento de clientes'
        ],

        veiculos: [
            'Veículos',
            'Cadastro de veículos'
        ],

        os: [
            'Ordens de Serviço',
            'Manutenções e serviços'
        ]
    };

    document.getElementById(
        'page-title'
    ).textContent = titulos[nome][0];

    document.getElementById(
        'page-subtitle'
    ).textContent = titulos[nome][1];

    if (nome === 'dashboard') {
        carregarDashboard();
    }

    if (nome === 'clientes') {
        carregarClientes();
    }

    if (nome === 'veiculos') {
        carregarVeiculos();
    }

    if (nome === 'os') {
        carregarOS();
    }
}

/*
 * Navegação
 */
document
    .querySelectorAll('.nav-button')
    .forEach((botao) => {
        botao.addEventListener('click', () => {
            abrirPagina(botao.dataset.page);
        });
    });

/*
 * Login
 */
loginForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        loginMessage.textContent = '';
        loginMessage.className = 'message';

        const email = document
            .getElementById('login-email')
            .value;

        const senha = document
            .getElementById('login-senha')
            .value;

        try {
            const dados = await api(
                '/api/login',
                {
                    method: 'POST',

                    body: JSON.stringify({
                        email,
                        senha
                    })
                }
            );

            loginForm.reset();

            mostrarAplicacao(dados.usuario);

        } catch (erro) {
            loginMessage.textContent =
                erro.message;

            loginMessage.classList.add(
                'error'
            );
        }
    }
);

/*
 * Logout
 */
document
    .getElementById('logout-button')
    .addEventListener(
        'click',
        async () => {
            try {
                await api(
                    '/api/logout',
                    {
                        method: 'POST'
                    }
                );
            } finally {
                usuarioAtual = null;
                mostrarLogin();
            }
        }
    );

/*
 * Fechar modais
 */
document
    .querySelectorAll('[data-close]')
    .forEach((botao) => {
        botao.addEventListener(
            'click',
            () => {
                const modal = document.getElementById(
                    botao.dataset.close
                );

                modal.classList.add('hidden');
            }
        );
    });

/*
 * Verifica se já existe sessão.
 */
async function iniciar() {
    try {
        const dados = await api('/api/me');

        mostrarAplicacao(dados.usuario);
    } catch {
        mostrarLogin();
    }
}

iniciar();

export {
    abrirPagina
};
