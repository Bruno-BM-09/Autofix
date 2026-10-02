import {
    api,
    esc,
    formatarCPF
} from './api.js';

const tbody = document.getElementById(
    'clientes-tbody'
);

const busca = document.getElementById(
    'cliente-busca'
);

const modal = document.getElementById(
    'modal-cliente'
);

const form = document.getElementById(
    'cliente-form'
);

let clientesCache = [];

export async function carregarClientes() {
    try {
        const termo = busca.value.trim();

        clientesCache = await api(
            `/api/clientes?q=${encodeURIComponent(termo)}`
        );

        renderizarClientes();
    } catch (erro) {
        if (erro.status === 401) {
            location.reload();
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    ${esc(erro.message)}
                </td>
            </tr>
        `;
    }
}

function renderizarClientes() {
    if (!clientesCache.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Nenhum cliente encontrado.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = clientesCache
        .map(
            (cliente) => `
            <tr>

                <td>
                    <strong>
                        ${esc(cliente.nome)}
                    </strong>
                </td>

                <td>
                    ${esc(
                        formatarCPF(cliente.cpf)
                    )}
                </td>

                <td>
                    ${esc(cliente.telefone || '-')}
                </td>

                <td>
                    ${esc(cliente.email || '-')}
                </td>

                <td class="actions">

                    <button
                        class="btn btn-small btn-secondary"
                        data-editar-cliente="${cliente.id}"
                    >
                        Editar
                    </button>

                    <button
                        class="btn btn-small btn-danger"
                        data-excluir-cliente="${cliente.id}"
                    >
                        Excluir
                    </button>

                </td>

            </tr>
        `
        )
        .join('');
}

/*
 * Busca
 */
let timer;

busca.addEventListener(
    'input',
    () => {
        clearTimeout(timer);

        timer = setTimeout(
            carregarClientes,
            250
        );
    }
);

/*
 * Novo cliente
 */
document
    .getElementById('btn-novo-cliente')
    .addEventListener(
        'click',
        () => {
            form.reset();

            document.getElementById(
                'cliente-id'
            ).value = '';

            document.getElementById(
                'modal-cliente-title'
            ).textContent = 'Novo cliente';

            document.getElementById(
                'cliente-message'
            ).textContent = '';

            modal.classList.remove('hidden');
        }
    );

/*
 * Editar / excluir
 */
tbody.addEventListener(
    'click',
    async (event) => {
        const editar = event.target.closest(
            '[data-editar-cliente]'
        );

        const excluir = event.target.closest(
            '[data-excluir-cliente]'
        );

        if (editar) {
            const id = Number(
                editar.dataset.editarCliente
            );

            const cliente = clientesCache.find(
                (item) => item.id === id
            );

            if (!cliente) return;

            document.getElementById(
                'cliente-id'
            ).value = cliente.id;

            document.getElementById(
                'cliente-nome'
            ).value = cliente.nome;

            document.getElementById(
                'cliente-cpf'
            ).value = formatarCPF(cliente.cpf);

            document.getElementById(
                'cliente-telefone'
            ).value = cliente.telefone || '';

            document.getElementById(
                'cliente-email'
            ).value = cliente.email || '';

            document.getElementById(
                'cliente-endereco'
            ).value = cliente.endereco || '';

            document.getElementById(
                'modal-cliente-title'
            ).textContent = 'Editar cliente';

            modal.classList.remove('hidden');

            return;
        }

        if (excluir) {
            const id = Number(
                excluir.dataset.excluirCliente
            );

            if (
                !confirm(
                    'Deseja realmente excluir este cliente?'
                )
            ) {
                return;
            }

            try {
                await api(
                    `/api/clientes/${id}`,
                    {
                        method: 'DELETE'
                    }
                );

                carregarClientes();
            } catch (erro) {
                alert(erro.message);
            }
        }
    }
);

/*
 * Salvar cliente
 */
form.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const id = document.getElementById(
            'cliente-id'
        ).value;

        const dados = {
            nome: document.getElementById(
                'cliente-nome'
            ).value,

            cpf: document.getElementById(
                'cliente-cpf'
            ).value,

            telefone: document.getElementById(
                'cliente-telefone'
            ).value,

            email: document.getElementById(
                'cliente-email'
            ).value,

            endereco: document.getElementById(
                'cliente-endereco'
            ).value
        };

        try {
            await api(
                id
                    ? `/api/clientes/${id}`
                    : '/api/clientes',
                {
                    method: id
                        ? 'PUT'
                        : 'POST',

                    body: JSON.stringify(dados)
                }
            );

            modal.classList.add('hidden');

            form.reset();

            carregarClientes();

        } catch (erro) {
            document.getElementById(
                'cliente-message'
            ).textContent = erro.message;

            document.getElementById(
                'cliente-message'
            ).className = 'message error';
        }
    }
);
