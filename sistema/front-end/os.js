import {
    api,
    esc,
    formatarData,
    formatarMoeda
} from './api.js';

const tbody = document.getElementById(
    'os-tbody'
);

const modal = document.getElementById(
    'modal-os'
);

const form = document.getElementById(
    'os-form'
);

const clienteSelect = document.getElementById(
    'os-cliente'
);

const veiculoSelect = document.getElementById(
    'os-veiculo'
);

let clientes = [];
let veiculos = [];

export async function carregarOS() {
    try {
        const ordens = await api(
            '/api/os'
        );

        renderizarOS(ordens);
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

function renderizarOS(ordens) {
    if (!ordens.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Nenhuma ordem de serviço cadastrada.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = ordens
        .map(
            (os) => `
            <tr>

                <td>
                    ${esc(
                        formatarData(os.aberta_em)
                    )}
                </td>

                <td>
                    <strong>
                        ${esc(os.cliente_nome)}
                    </strong>
                    <br>
                    <small>
                        ${esc(
                            os.cliente_telefone ||
                            ''
                        )}
                    </small>
                </td>

                <td>
                    <strong>
                        ${esc(os.veiculo_placa)}
                    </strong>

                    <br>

                    <small>
                        ${esc(
                            `${os.veiculo_marca} ${os.veiculo_modelo} ${os.veiculo_ano}`
                        )}
                    </small>
                </td>

                <td>
                    ${esc(os.descricao)}
                </td>

                <td>
                    <span
                        class="status status-${os.status.toLowerCase()}"
                    >
                        ${esc(
                            os.status.replace(
                                '_',
                                ' '
                            )
                        )}
                    </span>
                </td>

                <td>
                    ${formatarMoeda(os.valor)}
                </td>

            </tr>
        `
        )
        .join('');
}

async function carregarClientes() {
    clientes = await api(
        '/api/clientes'
    );

    clienteSelect.innerHTML = `
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

async function carregarVeiculos() {
    veiculos = await api(
        '/api/veiculos'
    );
}

function atualizarVeiculosDoCliente() {
    const clienteId = Number(
        clienteSelect.value
    );

    const filtrados = veiculos.filter(
        (veiculo) =>
            veiculo.cliente_id === clienteId
    );

    veiculoSelect.innerHTML = `
        <option value="">
            Selecione um veículo
        </option>

        ${filtrados
            .map(
                (veiculo) => `
                <option value="${veiculo.id}">
                    ${esc(
                        `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`
                    )}
                </option>
            `
            )
            .join('')}
    `;
}

clienteSelect.addEventListener(
    'change',
    atualizarVeiculosDoCliente
);

document
    .getElementById('btn-nova-os')
    .addEventListener(
        'click',
        async () => {
            form.reset();

            await carregarClientes();
            await carregarVeiculos();

            atualizarVeiculosDoCliente();

            modal.classList.remove('hidden');
        }
    );

form.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const dataInput =
            document.getElementById(
                'os-data'
            ).value;

        const dados = {
            cliente_id: Number(
                clienteSelect.value
            ),

            veiculo_id: Number(
                veiculoSelect.value
            ),

            descricao: document.getElementById(
                'os-descricao'
            ).value,

            status: document.getElementById(
                'os-status'
            ).value,

            valor: Number(
                document.getElementById(
                    'os-valor'
                ).value || 0
            ),

            aberta_em: dataInput || null
        };

        try {
            await api(
                '/api/os',
                {
                    method: 'POST',

                    body: JSON.stringify(dados)
                }
            );

            modal.classList.add('hidden');

            form.reset();

            carregarOS();

        } catch (erro) {
            document.getElementById(
                'os-message'
            ).textContent = erro.message;

            document.getElementById(
                'os-message'
            ).className = 'message error';
        }
    }
);
