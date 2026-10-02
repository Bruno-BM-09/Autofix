export async function api(url, options = {}) {
    const resposta = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    let dados = {};

    try {
        dados = await resposta.json();
    } catch {
        dados = {};
    }

    if (!resposta.ok) {
        const erro = new Error(
            dados.erro || 'Erro na requisição.'
        );

        erro.status = resposta.status;

        throw erro;
    }

    return dados;
}

export function esc(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function formatarCPF(cpf) {
    if (!cpf) return '';

    const valor = cpf.replace(/\D/g, '');

    if (valor.length !== 11) {
        return cpf;
    }

    return valor.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
    );
}

export function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}

export function formatarData(data) {
    if (!data) return '-';

    const valor = String(data).replace(' ', 'T');

    const d = new Date(valor);

    if (Number.isNaN(d.getTime())) {
        return data;
    }

    return d.toLocaleString('pt-BR');
}
