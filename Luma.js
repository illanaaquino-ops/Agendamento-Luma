let tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];
let dataCalendario = new Date();
dataCalendario.setDate(1);

const avataresPorCategoria = {
    Trabalho: '💼',
    Pessoal: '👤',
    Estudo: '📚',
    Escola: '🏫',
    Faculdade: '🎓',
    Saúde: '❤️',
    Casa: '🏠',
    Finanças: '💰',
    Mercado: '🛒',
    Compras: '🛍️',
    Família: '👨‍👩‍👧‍👦',
    Amigos: '👥',
    Lazer: '🎮',
    Viagem: '✈️',
    Projetos: '🧩',
    Carro: '🚗',
    Pets: '🐾',
    Religião: '⛪',
    Pagamento: '💳',
    Outros: '📌'
};

const temaSalvo = localStorage.getItem('temaEscuro');
if (temaSalvo !== null) {
    document.body.classList.toggle('dark', temaSalvo === 'true');
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('selectMes') && document.getElementById('selectAno')) {
        atualizarControlesCalendario();
    }

    if (document.getElementById('calendarGrid')) {
        renderizarCalendario();
    }

    const selectCategoria = document.getElementById('categoria');
    if (selectCategoria) {
        selectCategoria.addEventListener('change', atualizarPreviewCategoria);
        atualizarPreviewCategoria();
    }

    renderizarTarefas();
    verificarNotificacoesPermissao();
    setInterval(verificarPrazosNotificacoes, 60000);
});

function salvarNoStorage() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

let temporizadorNotificacao;

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const notificacao = document.getElementById('taskToast');
    if (!notificacao) return;

    const icone = tipo === 'sucesso' ? '✓' : '⚠';
    const iconeEl = document.createElement('span');
    const mensagemEl = document.createElement('span');
    iconeEl.className = 'toast-icon';
    iconeEl.textContent = icone;
    mensagemEl.textContent = mensagem;
    notificacao.replaceChildren(iconeEl, mensagemEl);
    notificacao.classList.add('show');
    notificacao.dataset.tipo = tipo;
    clearTimeout(temporizadorNotificacao);
    temporizadorNotificacao = setTimeout(() => notificacao.classList.remove('show'), 5000);
}

function atualizarControlesCalendario() {
    const selectMes = document.getElementById('selectMes');
    const selectAno = document.getElementById('selectAno');

    if (!selectMes || !selectAno) return;

    selectMes.value = dataCalendario.getMonth();
    selectAno.value = dataCalendario.getFullYear();
}

function mudarMesDropdown() {
    const mes = parseInt(document.getElementById('selectMes').value);
    dataCalendario.setDate(1);
    dataCalendario.setMonth(mes);
    renderizarCalendario();
}

function mudarAnoInput() {
    const ano = parseInt(document.getElementById('selectAno').value);
    if (ano >= 1900 && ano <= 2100) {
        dataCalendario.setDate(1);
        dataCalendario.setFullYear(ano);
        renderizarCalendario();
    }
}

function mudarMes(direcao) {
    dataCalendario.setDate(1);
    dataCalendario.setMonth(dataCalendario.getMonth() + direcao);
    atualizarControlesCalendario();
    renderizarCalendario();
}

// Cálculo dos feriados nacionais do Brasil (fixos e móveis para qualquer ano)
function obterFeriadosNacionais(ano) {
    let feriados = {
        [`${ano}-01-01`]: "Confraternização Universal",
        [`${ano}-04-21`]: "Tiradentes",
        [`${ano}-05-01`]: "Dia do Trabalho",
        [`${ano}-09-07`]: "Independência do Brasil",
        [`${ano}-10-12`]: "Nossa Sra. Aparecida",
        [`${ano}-11-02`]: "Finados",
        [`${ano}-11-15`]: "Proclamação da República",
        [`${ano}-11-20`]: "Consciência Negra",
        [`${ano}-12-25`]: "Natal"
    };

    // Páscoa e feriados móveis
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31);
    const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;

    let dataPascoa = new Date(ano, mesPascoa - 1, diaPascoa);

    let sextaSanta = new Date(dataPascoa);
    sextaSanta.setDate(dataPascoa.getDate() - 2);
    feriados[formatarDataIso(sextaSanta)] = "Sexta-feira Santa";

    let carnaval = new Date(dataPascoa);
    carnaval.setDate(dataPascoa.getDate() - 48);
    feriados[formatarDataIso(carnaval)] = "Carnaval (ponto facultativo)";
    carnaval.setDate(carnaval.getDate() + 1);
    feriados[formatarDataIso(carnaval)] = "Carnaval (ponto facultativo)";

    let corpusChristi = new Date(dataPascoa);
    corpusChristi.setDate(dataPascoa.getDate() + 60);
    feriados[formatarDataIso(corpusChristi)] = "Corpus Christi (ponto facultativo)";

    return feriados;
}

function formatarDataIso(data) {
    let ano = data.getFullYear();
    let mes = String(data.getMonth() + 1).padStart(2, '0');
    let dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function renderizarCalendario() {
    const mesAnoTitulo = document.getElementById('mesAnoTitulo');
    const todayDate = document.getElementById('todayDate');
    const gridEl = document.getElementById('calendarGrid');

    if (!mesAnoTitulo || !todayDate || !gridEl) return;

    const ano = dataCalendario.getFullYear();
    const mes = dataCalendario.getMonth();

    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    mesAnoTitulo.innerText = `${nomesMeses[mes]} / ${ano}`;
    todayDate.innerText = `Hoje: ${new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date())}`;

    const primeiroDiaIndex = (new Date(ano, mes, 1).getDay() + 6) % 7;
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const feriadosAno = obterFeriadosNacionais(ano);
    const hojeIso = formatarDataIso(new Date());

    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
   
    let html = diasSemana.map(d => `<div class="calendar-day-name">${d}</div>`).join('');

    for (let i = 0; i < primeiroDiaIndex; i++) {
        html += `<div></div>`;
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {
        let mesStr = String(mes + 1).padStart(2, '0');
        let diaStr = String(dia).padStart(2, '0');
        let dataIso = `${ano}-${mesStr}-${diaStr}`;

        let classes = ['calendar-day'];
        if (dataIso === hojeIso) classes.push('today');

        let tooltip = "";
        if (feriadosAno[dataIso]) {
            classes.push('holiday');
            const tipoData = feriadosAno[dataIso].includes('ponto facultativo') ? 'Ponto facultativo' : 'Feriado nacional';
            tooltip = `title="${tipoData}: ${feriadosAno[dataIso]}"`;
        }

        let temTarefa = tarefas.some(t => t.dataLimite && t.dataLimite.startsWith(dataIso));
        if (temTarefa) classes.push('has-task');

        const descricaoData = new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date(ano, mes, dia));
        html += `<button type="button" class="${classes.join(' ')}" ${tooltip} aria-label="${descricaoData}${feriadosAno[dataIso] ? `, ${feriadosAno[dataIso]}` : ''}" onclick="selecionarData('${dataIso}')">${dia}</button>`;
    }

    gridEl.innerHTML = html;
}

function selecionarData(dataIso) {
    document.getElementById('dataLimite').value = dataIso;
    document.getElementById('horaLimite').value = '';
    mostrarNotificacao(`📅 Data ${dataIso.split('-').reverse().join('/')} selecionada!`, 'sucesso');
}

function atualizarPreviewCategoria() {
    const selectCategoria = document.getElementById('categoria');
    const categoriaAvatar = document.getElementById('categoriaAvatar');
    const categoriaLabel = document.getElementById('categoriaLabel');
    const preview = document.querySelector('.category-spotlight');

    if (!selectCategoria || !categoriaAvatar || !categoriaLabel || !preview) return;

    const categoriaSelecionada = selectCategoria.value || 'Outros';
    const avatar = avataresPorCategoria[categoriaSelecionada] || '📌';
    const estilosCategoria = {
        Trabalho: { cor1: '#0F766E', cor2: '#2DD4BF', glow: 'rgba(15, 118, 110, 0.28)', pele: '#A96542', peleClara: '#D99A72', cabelo: '#241714', cabeloLuz: '#49332F', penteado: 'bun', expressao: 'focused' },
        Pessoal: { cor1: '#2563EB', cor2: '#93C5FD', glow: 'rgba(37, 99, 235, 0.28)', pele: '#F1C7A5', peleClara: '#FFE0C2', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'curly', expressao: 'happy' },
        Estudo: { cor1: '#0F766E', cor2: '#2DD4BF', glow: 'rgba(15, 118, 110, 0.28)', pele: '#8D5524', peleClara: '#B8734F', cabelo: '#1C1716', cabeloLuz: '#49332F', penteado: 'short', expressao: 'focused' },
        Escola: { cor1: '#0E7490', cor2: '#67E8F9', glow: 'rgba(14, 116, 144, 0.28)', pele: '#D99A72', peleClara: '#F1C7A5', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'afro', expressao: 'happy' },
        Faculdade: { cor1: '#2563EB', cor2: '#93C5FD', glow: 'rgba(37, 99, 235, 0.28)', pele: '#B8734F', peleClara: '#D99A72', cabelo: '#241714', cabeloLuz: '#49332F', penteado: 'curly', expressao: 'focused' },
        Saúde: { cor1: '#0E7490', cor2: '#67E8F9', glow: 'rgba(14, 116, 144, 0.28)', pele: '#F1C7A5', peleClara: '#FFE0C2', cabelo: '#4A2C22', cabeloLuz: '#704332', penteado: 'short', expressao: 'happy' },
        Casa: { cor1: '#2D8C89', cor2: '#5CC9C2', glow: 'rgba(45, 140, 137, 0.28)', pele: '#D99A72', peleClara: '#F1C7A5', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'bun', expressao: 'calm' },
        Finanças: { cor1: '#2563EB', cor2: '#93C5FD', glow: 'rgba(37, 99, 235, 0.28)', pele: '#8D5524', peleClara: '#B8734F', cabelo: '#1C1716', cabeloLuz: '#49332F', penteado: 'short', expressao: 'focused' },
        Mercado: { cor1: '#0F766E', cor2: '#2DD4BF', glow: 'rgba(15, 118, 110, 0.28)', pele: '#B8734F', peleClara: '#D99A72', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'curly', expressao: 'happy' },
        Compras: { cor1: '#2563EB', cor2: '#93C5FD', glow: 'rgba(37, 99, 235, 0.28)', pele: '#F1C7A5', peleClara: '#FFE0C2', cabelo: '#4A2C22', cabeloLuz: '#704332', penteado: 'bun', expressao: 'surprised' },
        Família: { cor1: '#0E7490', cor2: '#67E8F9', glow: 'rgba(14, 116, 144, 0.28)', pele: '#D99A72', peleClara: '#F1C7A5', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'afro', expressao: 'happy' },
        Amigos: { cor1: '#2D8C89', cor2: '#5CC9C2', glow: 'rgba(45, 140, 137, 0.28)', pele: '#8D5524', peleClara: '#B8734F', cabelo: '#1C1716', cabeloLuz: '#49332F', penteado: 'curly', expressao: 'happy' },
        Lazer: { cor1: '#4F46E5', cor2: '#A5B4FC', glow: 'rgba(79, 70, 229, 0.28)', pele: '#B8734F', peleClara: '#D99A72', cabelo: '#241714', cabeloLuz: '#49332F', penteado: 'afro', expressao: 'surprised' },
        Viagem: { cor1: '#0E7490', cor2: '#67E8F9', glow: 'rgba(14, 116, 144, 0.28)', pele: '#F1C7A5', peleClara: '#FFE0C2', cabelo: '#4A2C22', cabeloLuz: '#704332', penteado: 'bun', expressao: 'happy' },
        Projetos: { cor1: '#0F766E', cor2: '#2DD4BF', glow: 'rgba(15, 118, 110, 0.28)', pele: '#D99A72', peleClara: '#F1C7A5', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'short', expressao: 'focused' },
        Carro: { cor1: '#475569', cor2: '#94A3B8', glow: 'rgba(71, 85, 105, 0.28)', pele: '#8D5524', peleClara: '#B8734F', cabelo: '#1C1716', cabeloLuz: '#49332F', penteado: 'short', expressao: 'focused' },
        Pets: { cor1: '#2D8C89', cor2: '#5CC9C2', glow: 'rgba(45, 140, 137, 0.28)', pele: '#F1C7A5', peleClara: '#FFE0C2', cabelo: '#4A2C22', cabeloLuz: '#704332', penteado: 'curly', expressao: 'happy' },
        Religião: { cor1: '#4F46E5', cor2: '#A5B4FC', glow: 'rgba(79, 70, 229, 0.28)', pele: '#B8734F', peleClara: '#D99A72', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'bun', expressao: 'calm' },
        Pagamento: { cor1: '#0E7490', cor2: '#67E8F9', glow: 'rgba(14, 116, 144, 0.28)', pele: '#D99A72', peleClara: '#F1C7A5', cabelo: '#241714', cabeloLuz: '#49332F', penteado: 'short', expressao: 'focused' },
        Outros: { cor1: '#2D8C89', cor2: '#5CC9C2', glow: 'rgba(45, 140, 137, 0.28)', pele: '#F1C7A5', peleClara: '#FFE0C2', cabelo: '#302221', cabeloLuz: '#49332F', penteado: 'curly', expressao: 'happy' }
    };

    const estilo = estilosCategoria[categoriaSelecionada] || estilosCategoria.Outros;

    categoriaAvatar.textContent = avatar;
    categoriaLabel.textContent = categoriaSelecionada === 'Outros' ? 'Outros' : categoriaSelecionada;
    preview.dataset.category = categoriaSelecionada;
    preview.style.setProperty('--preview-color', estilo.cor1);
    preview.style.setProperty('--preview-accent', estilo.cor2);
    preview.style.setProperty('--preview-glow', estilo.glow);
    preview.style.setProperty('--preview-skin', estilo.pele);
    preview.style.setProperty('--preview-skin-light', estilo.peleClara);
    preview.style.setProperty('--preview-hair', estilo.cabelo);
    preview.style.setProperty('--preview-hair-light', estilo.cabeloLuz);
    const figura = preview.querySelector('.avatar-figure');
    figura.dataset.hair = estilo.penteado;
    figura.dataset.expression = estilo.expressao;
}

function adicionarTarefa(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const categoria = document.getElementById('categoria').value.trim() || 'Outros';
    const data = document.getElementById('dataLimite').value;
    const hora = document.getElementById('horaLimite').value.trim();

    if (!titulo || !data) {
        mostrarNotificacao('Preencha o título e a data antes de salvar.', 'erro');
        return;
    }

    const dataLimite = hora ? `${data}T${hora}` : `${data}T00:00:00`;

    const novaTarefa = {
        id: Date.now(),
        titulo,
        categoria,
        dataLimite,
        hora: hora || null,
        concluida: false,
        notif10dEnv: false,
        notif2dEnv: false,
        notif24hEnv: false
    };

    tarefas.push(novaTarefa);
    salvarNoStorage();
    renderizarTarefas();
    const dataCalendarioTarefa = new Date(dataLimite);
    dataCalendario = new Date(dataCalendarioTarefa.getFullYear(), dataCalendarioTarefa.getMonth(), 1);
    atualizarControlesCalendario();
    renderizarCalendario();
    document.getElementById('taskForm').reset();
    const prazoFormatado = dataCalendarioTarefa.toLocaleString('pt-BR', hora
        ? { dateStyle: 'short', timeStyle: 'short' }
        : { dateStyle: 'short' });
    mostrarNotificacao(`"${titulo}" salva com sucesso! Prazo: ${prazoFormatado}.`);
}

function alternarConcluida(id) {
    tarefas = tarefas.map(t => t.id === id ? { ...t, concluida: !t.concluida } : t);
    salvarNoStorage();
    renderizarTarefas();
}

function excluirTarefa(id) {
    tarefas = tarefas.filter(t => t.id !== id);
    salvarNoStorage();
    renderizarTarefas();
    renderizarCalendario();
}

function obterAvatarCategoria(categoria) {
    return avataresPorCategoria[categoria] || '📌';
}

function renderizarTarefas() {
    const listEl = document.getElementById('taskList');
    if (tarefas.length === 0) {
        listEl.innerHTML = '<div class="empty-state">Nenhuma tarefa cadastrada. Clique em um dia do calendário ou adicione acima!</div>';
        return;
    }

    const tarefasOrdenadas = [...tarefas].sort((a, b) => {
        if (a.concluida === b.concluida) {
            return new Date(a.dataLimite) - new Date(b.dataLimite);
        }
        return a.concluida ? 1 : -1;
    });

    listEl.innerHTML = tarefasOrdenadas.map(t => {
        const dataObj = new Date(t.dataLimite);
        const temHora = t.hora !== undefined ? !!t.hora : t.dataLimite.includes('T');
        const dataFormatada = temHora
            ? dataObj.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short'
            })
            : dataObj.toLocaleDateString('pt-BR', {
                dateStyle: 'short'
            });

        const avatar = obterAvatarCategoria(t.categoria);

        return `
            <div class="task-item ${t.concluida ? 'completed' : ''}">
                <div class="task-info">
                    <span class="task-title">${t.titulo}</span>
                    <div class="task-meta">
                        <span>📅 ${dataFormatada}</span>
                        <span class="category-pill">
                            <span class="category-avatar" aria-label="Categoria ${t.categoria}">${avatar}</span>
                            <span>${t.categoria}</span>
                        </span>
                        <span class="task-status">${t.concluida ? 'Concluída' : 'Pendente'}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-check" aria-pressed="${t.concluida}" onclick="alternarConcluida(${t.id})">
                        ${t.concluida ? '↩️ Desfazer' : '✔️ Feito'}
                    </button>
                    <button class="btn-delete" onclick="excluirTarefa(${t.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function solicitarPermissaoNotificacao() {
    if (!("Notification" in window)) {
        mostrarNotificacao('Este navegador não oferece suporte a notificações.', 'erro');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            mostrarNotificacao('Alertas de prazo ativados: 10 dias, 2 dias e 24 horas.');
            document.getElementById('btnNotif').style.display = 'none';
        } else if (permission === 'denied') {
            mostrarNotificacao('Permissão negada. Libere as notificações nas configurações do navegador.', 'erro');
        } else {
            mostrarNotificacao('Permissão para notificações não foi concedida.', 'aviso');
        }
    }).catch(() => {
        mostrarNotificacao('Não foi possível solicitar a permissão de notificações.', 'erro');
    });
}

function verificarNotificacoesPermissao() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        document.getElementById('btnNotif').style.display = 'none';
    }
}

function alternarTema() {
    document.body.classList.toggle('dark');
    const temaEscuro = document.body.classList.contains('dark');
    localStorage.setItem('temaEscuro', String(temaEscuro));
}

function verificarPrazosNotificacoes() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const agora = Date.now();

    tarefas.forEach(tarefa => {
        if (tarefa.concluida) return;

        const prazo = new Date(tarefa.dataLimite).getTime();
        const diferencaHoras = (prazo - agora) / (1000 * 60 * 60);

        if (!tarefa.notif10dEnv && diferencaHoras <= 240 && diferencaHoras > 48) {
            new Notification('Lembrete de tarefa', {
                body: `Faltam 10 dias para "${tarefa.titulo}".`
            });
            tarefa.notif10dEnv = true;
        }

        if (!tarefa.notif2dEnv && diferencaHoras <= 48 && diferencaHoras > 24) {
            new Notification('Lembrete de tarefa', {
                body: `Faltam 2 dias para "${tarefa.titulo}".`
            });
            tarefa.notif2dEnv = true;
        }

        if (!tarefa.notif24hEnv && diferencaHoras <= 24 && diferencaHoras > 0) {
            new Notification('Lembrete de tarefa', {
                body: `Falta 24 horas para "${tarefa.titulo}".`
            });
            tarefa.notif24hEnv = true;
        }
    });

    salvarNoStorage();
}
