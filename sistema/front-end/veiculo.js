import {
    api,
    esc
} from './api.js';

const tbody = document.getElementById(
    'veiculos-tbody'
);

const modal = document.getElementById(
    'modal-veiculo'
);

const form = document.getElementById(
    'veiculo-form'
);

const selectCliente = document.getElementById(
    'veiculo-cliente'
);

let veiculosCache = [];

export async function carregarVeiculos() {
    try {
        veiculosCache = await api(
            '/api/veiculos'
        );

        renderizarVeiculos();
    } catch (erro) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    ${esc(erro.message)}
                </td>
            </tr>
        `;
    }
}

function renderizarVeiculos() {
    if (!veiculosCache.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Nenhum veículo cadastrado.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = veiculosCache
        .map(
            (veiculo) => `
            <tr>

                <td>
                    ${esc(veiculo.cliente_nome)}
                </td>

                <td>
                    <strong>
                        ${esc(veiculo.placa)}
                    </strong>
                </td>

                <td>
                    ${esc(veiculo.marca)}
                </td>

                <td>
                    ${esc(veiculo.modelo)}
                </td>

                <td>
                    ${esc(veiculo.ano)}
                </td>

                <td class="actions">

                    <button
                        class="btn btn-small btn-secondary"
                        data-editar-veiculo="${veiculo.id}"
                    >
                        Editar
                    </button>

                    <button
                        class="btn btn-small btn-danger"
                        data-excluir-veiculo="${veiculo.id}"
                    >
                        Excluir
                    </button>

                </td>

            </tr>
        `
        )
        .join('');
}

async function carregarSelectClientes() {
    const clientes = await api(
        '/api/clientes'
    );

    selectCliente.innerHTML = `
        <option value="">
            Selecione um cliente
        </option>

        ${clientes
            .map(
                (cliente) => `
                <option value="${cliente.id}">
                    ${esc(cliente.nome)}
                </option>
            `
            )
            .join('')}
    `;
}

document
    .getElementById('btn-novo-veiculo')
    .addEventListener(
        'click',
        async () => {
            form.reset();

            document.getElementById(
                'veiculo-id'
            ).value = '';

            await carregarSelectClientes();

            modal.classList.remove('hidden');
        }
    );

tbody.addEventListener(
    'click',
    async (event) => {
        const editar = event.target.closest(
            '[data-editar-veiculo]'
        );

        const excluir = event.target.closest(
            '[data-excluir-veiculo]'
        );

        if (editar) {
            const id = Number(
                editar.dataset.editarVeiculo
            );

            const veiculo = veiculosCache.find(
                (item) => item.id === id
            );

            if (!veiculo) return;

            await carregarSelectClientes();

            document.getElementById(
                'veiculo-id'
            ).value = veiculo.id;

            selectCliente.value =
                veiculo.cliente_id;

            document.getElementById(
                'veiculo-placa'
            ).value = veiculo.placa;

            document.getElementById(
                'veiculo-marca'
            ).value = veiculo.marca;

            document.getElementById(
                'veiculo-modelo'
            ).value = veiculo.modelo;

            document.getElementById(
                'veiculo-ano'
            ).value = veiculo.ano;

            modal.classList.remove('hidden');

            return;
        }

        if (excluir) {
            const id = Number(
                excluir.dataset.excluirVeiculo
            );

            if (
                !confirm(
                    'Deseja realmente excluir este veículo?'
                )
            ) {
                return;
            }

            try {
                await api(
                    `/api/veiculos/${id}`,
                    {
                        method: 'DELETE'
                    }
                );

                carregarVeiculos();
            } catch (erro) {
                alert(erro.message);
            }
        }
    }
);

form.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const id = document.getElementById(
            'veiculo-id'
        ).value;

        const dados = {
            cliente_id: Number(
                selectCliente.value
            ),

            placa: document.getElementById(
                'veiculo-placa'
            ).value,

            marca: document.getElementById(
                'veiculo-marca'
            ).value,

            modelo: document.getElementById(
                'veiculo-modelo'
            ).value,

            ano: Number(
                document.getElementById(
                    'veiculo-ano'
                ).value
            )
        };

        try {
            await api(
                id
                    ? `/api/veiculos/${id}`
                    : '/api/veiculos',
                {
                    method: id
                        ? 'PUT'
                        : 'POST',

                    body: JSON.stringify(dados)
                }
            );

            modal.classList.add('hidden');

            form.reset();

            carregarVeiculos();

        } catch (erro) {
            document.getElementById(
                'veiculo-message'
            ).textContent = erro.message;

            document.getElementById(
                'veiculo-message'
            ).className = 'message error';
        }
    }
);
