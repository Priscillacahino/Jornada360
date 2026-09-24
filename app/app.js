const STORAGE_KEY = 'jornada360_mvp_v2';
const STORAGE_VERSION = 5;

const stages = [
  'Necessidade',
  'Primeiro atendimento',
  'Diagnóstico',
  'Documentação',
  'Análise',
  'Retorno da instituição',
  'Preparação para contrato',
  'Contratação',
  'Pós-atendimento'
];

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function safeText(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}

function documentStatusLabel(status) {
  return ({
    pending: 'Pendente',
    received: 'Recebido',
    review: 'Em conferência',
    resolved: 'Concluído'
  })[status] || status;
}

function getJourneyProgress(c) {
  const currentIndex = Math.max(0, stages.indexOf(c.stage));
  const step = currentIndex + 1;
  const total = stages.length;
  const percent = Math.round((step / total) * 100);
  return { currentIndex, step, total, percent };
}

function normalizeTimelineEvent(event) {
  const item = { ...event };

  if (
    item.type === 'stage' &&
    typeof item.title === 'string' &&
    item.title.startsWith('Etapa atual:')
  ) {
    item.title = item.title.replace('Etapa atual:', 'Etapa registrada:');
    item.detail = 'Registro histórico da posição da jornada na massa demonstrativa.';
  }

  if (
    item.type === 'stage' &&
    typeof item.title === 'string' &&
    item.title.startsWith('Etapa alterada para ') &&
    typeof item.detail === 'string'
  ) {
    const newStage = item.title.replace('Etapa alterada para ', '').trim();
    const oldMatch = item.detail.match(/^Etapa anterior:\s*(.+?)\.?$/);
    const oldStage = oldMatch ? oldMatch[1].replace(/\.$/, '').trim() : '';
    const oldIndex = stages.indexOf(oldStage);
    const newIndex = stages.indexOf(newStage);

    if (oldIndex >= 0 && newIndex >= 0) {
      if (newIndex < oldIndex) {
        item.type = 'stage-back';
        item.title = `Retorno de etapa: ${oldStage} → ${newStage}`;
        item.detail = 'A jornada retornou para uma etapa anterior. O histórico anterior foi preservado.';
      } else if (newIndex > oldIndex) {
        item.type = 'stage-forward';
        item.title = `Avanço de etapa: ${oldStage} → ${newStage}`;
        item.detail = 'A jornada avançou para uma nova etapa.';
      }
    }
  }

  return item;
}

function timelineKindLabel(type) {
  return ({
    'stage': 'Histórico de etapa',
    'stage-forward': 'Avanço de etapa',
    'stage-back': 'Retorno de etapa',
    'interaction': 'Interação',
    'document': 'Documento',
    'note': 'Observação'
  })[type] || 'Evento';
}

function createSeedClient(data, index) {
  const id = `cliente-${index + 1}`;
  const stageIndex = Math.max(0, stages.indexOf(data.stage));
  const interactions = [{
    id: uid('int'),
    channel: 'Acompanhamento',
    summary: `Último acompanhamento demonstrativo de ${data.name}.`,
    occurredAt: daysAgoISO(data.last)
  }];

  const documents = data.pending === 'Nenhuma'
    ? [
        {
          id: uid('doc'),
          label: 'Documentação principal',
          status: 'resolved',
          requestedAt: daysAgoISO(Math.max(data.last + 5, 6)),
          updatedAt: daysAgoISO(Math.max(data.last, 1)),
          guidance: 'Documentação demonstrativa concluída.'
        }
      ]
    : [
        {
          id: uid('doc'),
          label: data.pending.includes('Documento') ? 'Documento solicitado' : 'Comprovante complementar',
          status: data.stage === 'Documentação' ? 'pending' : 'review',
          requestedAt: daysAgoISO(Math.max(data.last + 2, 4)),
          updatedAt: daysAgoISO(Math.max(data.last, 1)),
          guidance: data.next
        }
      ];

  const timeline = [];
  for (let i = 0; i <= stageIndex; i += 1) {
    timeline.push({
      id: uid('evt'),
      type: 'stage',
      title: i === stageIndex ? `Etapa registrada: ${stages[i]}` : `Etapa concluída: ${stages[i]}`,
      detail: i === stageIndex
        ? 'Posição inicial da jornada na massa demonstrativa.'
        : 'Avanço registrado na jornada demonstrativa.',
      occurredAt: daysAgoISO(Math.max((stageIndex - i) * 5 + data.last, data.last))
    });
  }
  timeline.push({
    id: uid('evt'),
    type: 'interaction',
    title: 'Interação registrada',
    detail: interactions[0].summary,
    occurredAt: interactions[0].occurredAt
  });

  return {
    id,
    name: data.name,
    stage: data.stage,
    score: data.score,
    status: data.status,
    pending: data.pending,
    next: data.next,
    interactions,
    documents,
    notes: [],
    timeline
  };
}

const seedClients = [
  {name:'Mariana Costa',stage:'Documentação',score:68,status:'attention',last:3,pending:'Comprovante complementar',next:'Confirmar recebimento do documento'},
  {name:'Carlos Mendes',stage:'Documentação',score:42,status:'high',last:11,pending:'Documento pendente há 11 dias',next:'Confirmar dificuldade no envio'},
  {name:'Fernanda Lima',stage:'Análise',score:47,status:'high',last:15,pending:'Sem interação há 15 dias',next:'Realizar contato de acompanhamento'},
  {name:'Pedro Alves',stage:'Diagnóstico',score:73,status:'attention',last:2,pending:'Nova solicitação documental',next:'Orientar sobre documento solicitado'},
  {name:'Ana Ribeiro',stage:'Análise',score:76,status:'attention',last:8,pending:'Etapa sem atualização há 8 dias',next:'Verificar andamento e atualizar status'},
  {name:'Luiza Rocha',stage:'Preparação para contrato',score:91,status:'healthy',last:1,pending:'Nenhuma',next:'Orientar etapa final'},
  {name:'Rafael Souza',stage:'Pós-atendimento',score:95,status:'healthy',last:0,pending:'Nenhuma',next:'Coletar NPS'}
].map(createSeedClient);

function normalizeClient(client, index = 0) {
  return {
    id: client.id || `cliente-${index + 1}`,
    name: client.name || 'Cliente fictício',
    stage: stages.includes(client.stage) ? client.stage : 'Necessidade',
    score: Number.isFinite(client.score) ? client.score : 70,
    status: ['healthy', 'attention', 'high'].includes(client.status) ? client.status : 'attention',
    pending: client.pending || 'Nenhuma',
    next: client.next || 'Definir próxima ação',
    interactions: Array.isArray(client.interactions) ? client.interactions : [],
    documents: Array.isArray(client.documents) ? client.documents : [],
    notes: Array.isArray(client.notes) ? client.notes : [],
    surveys: Array.isArray(client.surveys) ? client.surveys : [],
    timeline: Array.isArray(client.timeline) ? client.timeline.map(normalizeTimelineEvent) : []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: STORAGE_VERSION, clients: seedClients };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.clients)) throw new Error('Estrutura inválida');
    return {
      version: STORAGE_VERSION,
      clients: parsed.clients.map(normalizeClient)
    };
  } catch (error) {
    console.warn('Não foi possível carregar a persistência local. A massa fictícia foi restaurada.', error);
    return { version: STORAGE_VERSION, clients: seedClients };
  }
}

let state = loadState();
let clients = state.clients;
let view = 'dashboard';
let currentClientId = null;
const app = document.querySelector('#app');

function recalculateClientHealth(c) {
  const health = JornadaHealth.calculateHealthScore(c, stages);
  c.score = health.total;
  c.status = health.status;
  c.healthCalculatedAt = health.calculatedAt;
  return health;
}

function recalculateAllHealth() {
  clients.forEach(recalculateClientHealth);
}

recalculateAllHealth();

function saveState() {
  recalculateAllHealth();
  state = { version: STORAGE_VERSION, clients };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const indicator = document.querySelector('#save-indicator');
  if (indicator) {
    indicator.textContent = 'Salvo neste navegador';
    indicator.classList.add('saved');
    window.setTimeout(() => indicator.classList.remove('saved'), 900);
  }
}

function resetDemoData() {
  const ok = window.confirm('Restaurar os dados fictícios iniciais do Jornada360 neste navegador?');
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  clients = [
    {name:'Mariana Costa',stage:'Documentação',score:68,status:'attention',last:3,pending:'Comprovante complementar',next:'Confirmar recebimento do documento'},
    {name:'Carlos Mendes',stage:'Documentação',score:42,status:'high',last:11,pending:'Documento pendente há 11 dias',next:'Confirmar dificuldade no envio'},
    {name:'Fernanda Lima',stage:'Análise',score:47,status:'high',last:15,pending:'Sem interação há 15 dias',next:'Realizar contato de acompanhamento'},
    {name:'Pedro Alves',stage:'Diagnóstico',score:73,status:'attention',last:2,pending:'Nova solicitação documental',next:'Orientar sobre documento solicitado'},
    {name:'Ana Ribeiro',stage:'Análise',score:76,status:'attention',last:8,pending:'Etapa sem atualização há 8 dias',next:'Verificar andamento e atualizar status'},
    {name:'Luiza Rocha',stage:'Preparação para contrato',score:91,status:'healthy',last:1,pending:'Nenhuma',next:'Orientar etapa final'},
    {name:'Rafael Souza',stage:'Pós-atendimento',score:95,status:'healthy',last:0,pending:'Nenhuma',next:'Coletar NPS'}
  ].map(createSeedClient);
  saveState();
  view = 'dashboard';
  currentClientId = null;
  render();
}

function badge(c) {
  return `<span class="badge ${c.status}">${
    c.status === 'healthy' ? 'Saudável' : c.status === 'attention' ? 'Atenção' : 'Acompanhamento'
  }</span>`;
}

function getClient(id) {
  return clients.find(c => c.id === id);
}

function getDaysSinceLastInteraction(c) {
  if (!c.interactions.length) return null;
  const latest = [...c.interactions]
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0];
  const diff = Date.now() - new Date(latest.occurredAt).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function activeDocumentCount(c) {
  return c.documents.filter(d => !['resolved'].includes(d.status)).length;
}

function healthBreakdownMarkup(health) {
  const factorRows = health.factors.map(item => `
    <div class="health-factor ${item.severity}">
      <div class="health-factor-head">
        <b>${safeText(item.label)}</b>
        <strong>${item.points}/${item.max}</strong>
      </div>
      <p>${safeText(item.message)}</p>
    </div>
  `).join('');

  const alerts = health.alerts.length
    ? `<div class="health-alerts">
        <b>Fatores que pedem atenção</b>
        <ul>${health.alerts.map(item => `<li>${safeText(item.label)}: ${safeText(item.message)}</li>`).join('')}</ul>
      </div>`
    : `<div class="health-ok">Nenhum fator crítico identificado neste momento.</div>`;

  return `${factorRows}${alerts}`;
}

function getPriorityList() {
  recalculateAllHealth();
  return JornadaPriorities.buildPriorityList(clients, stages);
}

function priorityLevelBadge(item) {
  return `<span class="priority-level ${safeText(item.status)}">${safeText(item.levelLabel)}</span>`;
}

function priorityReasonsMarkup(item) {
  if (!item.reasons.length) {
    return '<p class="small">Nenhum fator de atenção identificado.</p>';
  }

  return `
    <ul class="priority-reasons">
      ${item.reasons.map(reason => `
        <li>
          <b>${safeText(reason.label)}</b>
          <span>${safeText(reason.message)}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function priorityCardMarkup(item, compact = false) {
  const interactionText = item.daysWithoutInteraction === null
    ? 'Sem interação registrada'
    : `${item.daysWithoutInteraction} dia(s) desde a última interação`;

  if (compact) {
    return `
      <div class="priority-row">
        <div>
          <div class="priority-name-line">
            <b>${safeText(item.name)}</b>
            ${priorityLevelBadge(item)}
          </div>
          <div class="small">${safeText(item.stage)} • Health ${item.score}/100</div>
        </div>
        <div>
          <b>${safeText(item.primaryFactor)}</b>
          <div class="small">${safeText(item.primaryReason)}</div>
        </div>
        <div>
          <div class="small">Próxima ação</div>
          <b>${safeText(item.nextAction)}</b>
        </div>
        <button class="btn priority-open" data-priority-client="${item.clientId}">Abrir</button>
      </div>
    `;
  }

  return `
    <article class="priority-card ${safeText(item.status)}">
      <div class="priority-card-head">
        <div>
          <div class="priority-name-line">
            <h3>${safeText(item.name)}</h3>
            ${priorityLevelBadge(item)}
          </div>
          <p class="small">${safeText(item.stage)} • Health ${item.score}/100 • ${safeText(interactionText)}</p>
        </div>
        <button class="btn priority-open" data-priority-client="${item.clientId}">Abrir Cliente 360º</button>
      </div>

      <div class="priority-grid">
        <div>
          <span class="priority-label">Motivo principal</span>
          <b>${safeText(item.primaryFactor)}</b>
          <p>${safeText(item.primaryReason)}</p>
        </div>
        <div>
          <span class="priority-label">Próxima ação</span>
          <b>${safeText(item.nextAction)}</b>
          <p>${item.activeDocuments} item(ns) documental(is) ativo(s)</p>
        </div>
      </div>

      <details class="priority-details">
        <summary>Ver fatores que explicam a prioridade</summary>
        ${priorityReasonsMarkup(item)}
      </details>
    </article>
  `;
}

function bindPriorityButtons() {
  document.querySelectorAll('[data-priority-client]').forEach(button => {
    button.onclick = () => detail(button.dataset.priorityClient);
  });
}

function refreshPendingSummary(c) {
  const active = c.documents.filter(d => d.status !== 'resolved');
  if (!active.length) {
    c.pending = 'Nenhuma';
    return;
  }
  const first = active[0];
  c.pending = `${first.label} — ${documentStatusLabel(first.status)}`;
}

function addTimeline(c, type, title, detail) {
  c.timeline.push({
    id: uid('evt'),
    type,
    title,
    detail,
    occurredAt: new Date().toISOString()
  });
}

function layout(content) {
  app.innerHTML = `
    <div class="shell">
      <aside class="side">
        <div class="brand">Jornada360</div>
        <div class="tag">CX • Customer Success</div>
        <nav class="nav">
          ${[
            ['dashboard', 'Visão geral'],
            ['clients', 'Clientes'],
            ['priorities', 'Prioridades'],
            ['cx', 'Voz do Cliente'],
            ['customer', 'Visão do cliente']
          ].map(([v, l]) => `<button data-v="${v}" class="${view === v ? 'active' : ''}">${l}</button>`).join('')}
        </nav>
        <div class="side-footer">
          <span id="save-indicator">Dados fictícios salvos localmente</span>
          <button class="reset-btn" id="reset-demo">Restaurar demonstração</button>
        </div>
      </aside>
      <main class="main">${content}</main>
    </div>`;

  document.querySelectorAll('[data-v]').forEach(button => {
    button.onclick = () => {
      view = button.dataset.v;
      currentClientId = null;
      render();
    };
  });

  const reset = document.querySelector('#reset-demo');
  if (reset) reset.onclick = resetDemoData;
}

function dashboard() {
  recalculateAllHealth();
  layout(`
    <div class="top">
      <div>
        <h1>Visão geral da carteira</h1>
        <p class="sub">Quem precisa de atenção e quais atritos estão afetando a jornada?</p>
      </div>
      <span class="pill">Ambiente demonstrativo • dados fictícios</span>
    </div>

    <section class="grid4">
      ${[
        ['38', 'Clientes ativos'],
        ['22', 'Jornadas saudáveis'],
        ['11', 'Em atenção'],
        ['5', 'Necessitam acompanhamento']
      ].map(x => `<div class="card metric"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}
    </section>

    <section class="cols">
      <div class="card">
        <div class="section-head">
          <div>
            <h2>Prioridades de hoje</h2>
            <p class="small">Ordenadas automaticamente pela saúde da jornada e pelos fatores de atenção.</p>
          </div>
        </div>
        ${getPriorityList()
          .filter(item => item.status !== 'healthy')
          .slice(0, 4)
          .map(item => priorityCardMarkup(item, true))
          .join('') || '<div class="empty">Nenhuma jornada exige acompanhamento agora.</div>'}
      </div>
      <div class="card">
        <h2>Insight CX</h2>
        <p>Documentação é o principal ponto de atrito desta carteira demonstrativa.</p>
        <p class="small">Ação sugerida: revisar orientações e acompanhar pendências antigas. A sugestão apoia o profissional; não toma decisões financeiras.</p>
      </div>
    </section>
  `);
  bindPriorityButtons();
}

function clientList() {
  layout(`
    <div class="top">
      <div>
        <h1>Carteira de clientes</h1>
        <p class="sub">Acompanhamento organizado por jornada e necessidade de ação.</p>
      </div>
      <span class="pill">Alterações ficam salvas neste navegador</span>
    </div>

    <div class="toolbar">
      <input id="q" placeholder="Buscar cliente" aria-label="Buscar cliente">
      <select id="filter" aria-label="Filtrar situação">
        <option value="all">Todos</option>
        <option value="high">Acompanhamento</option>
        <option value="attention">Atenção</option>
        <option value="healthy">Saudável</option>
      </select>
    </div>
    <div class="card" id="list"></div>
  `);

  const draw = () => {
    recalculateAllHealth();
    const q = document.querySelector('#q').value.toLowerCase();
    const f = document.querySelector('#filter').value;
    const filtered = clients.filter(c =>
      c.name.toLowerCase().includes(q) && (f === 'all' || c.status === f)
    );

    document.querySelector('#list').innerHTML = filtered.length
      ? filtered.map(c => {
          const days = getDaysSinceLastInteraction(c);
          return `
            <div class="row">
              <div><b>${safeText(c.name)}</b><div class="small">${safeText(c.stage)}</div></div>
              <div>
                Health ${c.score}/100
                <div class="small">${safeText(c.pending)} • ${days === null ? 'sem interação' : `${days} dia(s) desde a última interação`}</div>
              </div>
              <div>${badge(c)} <button class="btn" data-client="${c.id}">Abrir</button></div>
            </div>`;
        }).join('')
      : '<div class="empty">Nenhum cliente encontrado.</div>';

    document.querySelectorAll('[data-client]').forEach(button => {
      button.onclick = () => detail(button.dataset.client);
    });
  };

  document.querySelector('#q').oninput = draw;
  document.querySelector('#filter').onchange = draw;
  draw();
}

function journeyMarkup(c) {
  const { currentIndex } = getJourneyProgress(c);
  return stages.map((s, n) => {
    const stateClass = n < currentIndex ? 'done' : n === currentIndex ? 'current' : 'upcoming';
    const stateLabel = n < currentIndex ? 'Concluída' : n === currentIndex ? 'Atual' : 'Próxima';
    return `
      <div class="stage ${stateClass}" ${n === currentIndex ? 'aria-current="step"' : ''}>
        <div class="stage-top">
          <span class="stage-number">${n + 1}</span>
          <span class="stage-state">${stateLabel}</span>
        </div>
        <b>${safeText(s)}</b>
      </div>`;
  }).join('');
}

function timelineMarkup(c) {
  const sorted = [...c.timeline].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  if (!sorted.length) return '<div class="empty">Nenhum evento registrado.</div>';

  return sorted.map(event => `
    <div class="timeline-item">
      <div class="timeline-dot ${safeText(event.type)}"></div>
      <div>
        <span class="timeline-kind ${safeText(event.type)}">${safeText(timelineKindLabel(event.type))}</span>
        <b class="timeline-title">${safeText(event.title)}</b>
        <p>${safeText(event.detail || '')}</p>
        <span class="small">${formatDate(event.occurredAt)}</span>
      </div>
    </div>
  `).join('');
}

function documentMarkup(c) {
  if (!c.documents.length) return '<div class="empty">Nenhum item documental cadastrado.</div>';

  return c.documents.map(doc => `
    <div class="document-item">
      <div class="document-head">
        <div>
          <b>${safeText(doc.label)}</b>
          <div class="small">Solicitado em ${formatDate(doc.requestedAt)} • atualizado em ${formatDate(doc.updatedAt)}</div>
        </div>
        <span class="doc-status ${safeText(doc.status)}">${documentStatusLabel(doc.status)}</span>
      </div>

      <div class="form-grid compact">
        <label>
          Status
          <select data-doc-status="${doc.id}">
            ${[
              ['pending', 'Pendente'],
              ['received', 'Recebido'],
              ['review', 'Em conferência'],
              ['resolved', 'Concluído']
            ].map(([value, label]) => `<option value="${value}" ${doc.status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>

        <label class="span-2">
          Orientação ao cliente
          <input data-doc-guidance="${doc.id}" value="${safeText(doc.guidance || '')}" placeholder="Orientação demonstrativa">
        </label>

        <button class="btn alt align-end" data-save-doc="${doc.id}">Salvar item</button>
      </div>
    </div>
  `).join('');
}

function bindClientDetail(c) {
  const interactionForm = document.querySelector('#interaction-form');
  interactionForm.onsubmit = event => {
    event.preventDefault();
    const channel = document.querySelector('#interaction-channel').value;
    const summary = document.querySelector('#interaction-summary').value.trim();
    if (!summary) return;

    const occurredAt = new Date().toISOString();
    c.interactions.push({
      id: uid('int'),
      channel,
      summary,
      occurredAt
    });
    addTimeline(c, 'interaction', `Interação — ${channel}`, summary);
    saveState();
    detail(c.id);
  };

  const noteForm = document.querySelector('#note-form');
  noteForm.onsubmit = event => {
    event.preventDefault();
    const text = document.querySelector('#note-text').value.trim();
    if (!text) return;
    c.notes.push({ id: uid('note'), text, createdAt: new Date().toISOString() });
    addTimeline(c, 'note', 'Observação adicionada', text);
    saveState();
    detail(c.id);
  };

  const stageForm = document.querySelector('#stage-form');
  stageForm.onsubmit = event => {
    event.preventDefault();
    const newStage = document.querySelector('#stage-select').value;
    const next = document.querySelector('#next-action').value.trim() || 'Definir próxima ação';

    if (newStage !== c.stage) {
      const oldStage = c.stage;
      const oldIndex = stages.indexOf(oldStage);
      const newIndex = stages.indexOf(newStage);
      c.stage = newStage;

      if (newIndex < oldIndex) {
        addTimeline(
          c,
          'stage-back',
          `Retorno de etapa: ${oldStage} → ${newStage}`,
          'A jornada retornou para uma etapa anterior. O histórico anterior foi preservado.'
        );
      } else {
        addTimeline(
          c,
          'stage-forward',
          `Avanço de etapa: ${oldStage} → ${newStage}`,
          'A jornada avançou para uma nova etapa.'
        );
      }
    }
    c.next = next;
    saveState();
    detail(c.id);
  };

  document.querySelectorAll('[data-save-doc]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.saveDoc;
      const doc = c.documents.find(d => d.id === id);
      if (!doc) return;
      const oldStatus = doc.status;
      doc.status = document.querySelector(`[data-doc-status="${id}"]`).value;
      doc.guidance = document.querySelector(`[data-doc-guidance="${id}"]`).value.trim();
      doc.updatedAt = new Date().toISOString();

      addTimeline(
        c,
        'document',
        `Documento atualizado: ${doc.label}`,
        `${documentStatusLabel(oldStatus)} → ${documentStatusLabel(doc.status)}${doc.guidance ? `. Orientação: ${doc.guidance}` : ''}`
      );

      refreshPendingSummary(c);
      saveState();
      detail(c.id);
    };
  });

  const addDocumentForm = document.querySelector('#add-document-form');
  addDocumentForm.onsubmit = event => {
    event.preventDefault();
    const label = document.querySelector('#new-doc-label').value.trim();
    const guidance = document.querySelector('#new-doc-guidance').value.trim();
    if (!label) return;

    const now = new Date().toISOString();
    c.documents.push({
      id: uid('doc'),
      label,
      status: 'pending',
      requestedAt: now,
      updatedAt: now,
      guidance
    });
    addTimeline(c, 'document', `Documento solicitado: ${label}`, guidance || 'Novo item documental demonstrativo.');
    refreshPendingSummary(c);
    saveState();
    detail(c.id);
  };
}

function detail(id) {
  const c = getClient(id);
  if (!c) return clientList();

  currentClientId = id;
  view = 'clients';

  const health = recalculateClientHealth(c);
  const days = getDaysSinceLastInteraction(c);
  const latestNotes = [...c.notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const progress = getJourneyProgress(c);

  layout(`
    <div class="top">
      <div>
        <button class="link-btn" id="back-clients">← Voltar para clientes</button>
        <h1>Cliente 360º — ${safeText(c.name)}</h1>
        <p class="sub">Visão da experiência e do acompanhamento. Não é análise de crédito.</p>
      </div>
      ${badge(c)}
    </div>

    <div class="grid4">
      <div class="card metric"><strong>${c.score}/100</strong><span>Saúde da jornada • cálculo automático</span></div>
      <div class="card metric"><strong>${safeText(c.stage)}</strong><span>Etapa atual</span></div>
      <div class="card metric"><strong>${days === null ? '—' : `${days} dia(s)`}</strong><span>Desde a última interação</span></div>
      <div class="card metric"><strong>${activeDocumentCount(c)}</strong><span>Itens documentais ativos</span></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="section-head">
        <div>
          <h2>Jornada</h2>
          <p class="small">A etapa atual determina o progresso visual. Avanços e retornos ficam registrados na timeline sem apagar o histórico.</p>
        </div>
      </div>

      <div class="journey-progress-summary">
        <div>
          <strong>Etapa ${progress.step} de ${progress.total}</strong>
          <span>${progress.percent}% da jornada percorrida</span>
        </div>
        <span class="current-stage-label">Atual: ${safeText(c.stage)}</span>
      </div>
      <div class="journey-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}" aria-label="Progresso da jornada">
        <i style="width:${progress.percent}%"></i>
      </div>

      <div class="journey-legend" aria-label="Legenda da jornada">
        <span><i class="legend-dot done"></i>Concluída</span>
        <span><i class="legend-dot current"></i>Atual</span>
        <span><i class="legend-dot upcoming"></i>Próxima</span>
      </div>

      <div class="journey">${journeyMarkup(c)}</div>

      <form id="stage-form" class="form-grid stage-editor">
        <label>
          Etapa atual
          <select id="stage-select">
            ${stages.map(stage => `<option ${stage === c.stage ? 'selected' : ''}>${stage}</option>`).join('')}
          </select>
        </label>
        <label class="span-2">
          Próxima ação
          <input id="next-action" value="${safeText(c.next)}" placeholder="Próxima ação de acompanhamento">
        </label>
        <button class="btn align-end" type="submit">Atualizar jornada</button>
      </form>
    </div>

    <section class="cols">
      <div class="card">
        <h2>Registrar interação</h2>
        <form id="interaction-form" class="form-grid">
          <label>
            Canal
            <select id="interaction-channel">
              <option>Telefone</option>
              <option>WhatsApp demonstrativo</option>
              <option>E-mail demonstrativo</option>
              <option>Atendimento presencial</option>
              <option>Acompanhamento</option>
            </select>
          </label>
          <label class="span-2">
            Resumo
            <textarea id="interaction-summary" rows="3" placeholder="Ex.: cliente orientado sobre o documento pendente." required></textarea>
          </label>
          <button class="btn alt align-end" type="submit">Registrar interação</button>
        </form>

        <h2 class="section-space">Observações</h2>
        <form id="note-form" class="form-grid">
          <label class="span-3">
            Nova observação
            <textarea id="note-text" rows="2" placeholder="Observação interna do acompanhamento"></textarea>
          </label>
          <button class="btn align-end" type="submit">Adicionar</button>
        </form>

        <div class="notes-list">
          ${latestNotes.length ? latestNotes.slice(0, 4).map(note => `
            <div class="note">
              <p>${safeText(note.text)}</p>
              <span class="small">${formatDate(note.createdAt)}</span>
            </div>`).join('') : '<p class="small">Nenhuma observação registrada.</p>'}
        </div>
      </div>

      <div class="card">
        <h2>Resumo de acompanhamento</h2>
        <div class="reason"><b>Pendência:</b><br>${safeText(c.pending)}</div>
        <div class="reason"><b>Próxima ação:</b><br>${safeText(c.next)}</div>
        <div class="reason"><b>Interações registradas:</b><br>${c.interactions.length}</div>
        <p class="small">As alterações desta versão ficam somente no navegador utilizado para a demonstração.</p>
      </div>
    </section>

    <div class="card" style="margin-top:18px">
      <div class="section-head">
        <div>
          <h2>Checklist documental</h2>
          <p class="small">Controle de status e orientação. Nenhum arquivo pessoal real é armazenado.</p>
        </div>
      </div>

      <div>${documentMarkup(c)}</div>

      <details class="add-doc">
        <summary>Adicionar item documental fictício</summary>
        <form id="add-document-form" class="form-grid">
          <label>
            Documento / item
            <input id="new-doc-label" placeholder="Ex.: comprovante complementar" required>
          </label>
          <label class="span-2">
            Orientação
            <input id="new-doc-guidance" placeholder="Orientação que será apresentada ao cliente">
          </label>
          <button class="btn align-end" type="submit">Adicionar</button>
        </form>
      </details>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="section-head">
        <div>
          <h2>Timeline da jornada</h2>
          <p class="small">Etapas, interações, documentos e observações em ordem cronológica.</p>
        </div>
      </div>
      <div class="timeline">${timelineMarkup(c)}</div>
    </div>

    <section class="cols">
      <div class="card">
        <h2>Histórico recente de interações</h2>
        ${[...c.interactions]
          .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
          .slice(0, 5)
          .map(item => `
            <div class="reason">
              <b>${safeText(item.channel)}</b>
              <div>${safeText(item.summary)}</div>
              <span class="small">${formatDate(item.occurredAt)}</span>
            </div>`).join('') || '<p class="small">Nenhuma interação registrada.</p>'}
      </div>

      <div class="card">
        <div class="health-score-title">
          <div>
            <h2>Por que este score?</h2>
            <p class="small">Cálculo automático da saúde da jornada.</p>
          </div>
          <div class="score">${health.total}</div>
        </div>
        ${healthBreakdownMarkup(health)}
        <p class="notice health-disclaimer"><b>Importante:</b> este indicador mede acompanhamento de CX/CS. Não representa score de crédito, risco financeiro, elegibilidade ou probabilidade de aprovação. Renda, idade, gênero, endereço, raça, religião, saúde e outros atributos pessoais não entram no cálculo.</p>
      </div>
    </section>
  `);

  document.querySelector('#back-clients').onclick = clientList;
  bindClientDetail(c);
}

function priorities() {
  const priorityList = getPriorityList();
  const metrics = JornadaPriorities.priorityMetrics(priorityList);

  layout(`
    <div class="top">
      <div>
        <h1>Central de Prioridades</h1>
        <p class="sub">Prioridades calculadas com base na saúde da jornada, com motivo e próxima ação explicáveis.</p>
      </div>
      <span class="pill">${metrics.needsAction} jornada(s) pedem acompanhamento</span>
    </div>

    <div class="grid4">
      <div class="card metric"><strong>${metrics.high}</strong><span>Acompanhamento</span></div>
      <div class="card metric"><strong>${metrics.attention}</strong><span>Em atenção</span></div>
      <div class="card metric"><strong>${metrics.activeDocuments}</strong><span>Itens documentais ativos</span></div>
      <div class="card metric"><strong>${metrics.withoutInteraction}</strong><span>8+ dias sem interação</span></div>
    </div>

    <div class="toolbar priority-toolbar">
      <input id="priority-q" placeholder="Buscar cliente" aria-label="Buscar cliente na Central de Prioridades">
      <select id="priority-filter" aria-label="Filtrar prioridades">
        <option value="needs-action">Acompanhamento + Atenção</option>
        <option value="high">Somente acompanhamento</option>
        <option value="attention">Somente atenção</option>
        <option value="healthy">Somente saudáveis</option>
        <option value="all">Todos</option>
      </select>
    </div>

    <div id="priority-list" class="priority-list"></div>

    <p class="notice">
      A prioridade indica necessidade de acompanhamento de CX/CS. Ela não representa risco de crédito,
      elegibilidade, capacidade financeira ou probabilidade de aprovação.
    </p>
  `);

  const draw = () => {
    const q = document.querySelector('#priority-q').value.trim().toLowerCase();
    const filter = document.querySelector('#priority-filter').value;

    const filtered = getPriorityList().filter(item => {
      const matchesName = item.name.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'needs-action' && item.status !== 'healthy') ||
        item.status === filter;
      return matchesName && matchesFilter;
    });

    document.querySelector('#priority-list').innerHTML = filtered.length
      ? filtered.map(item => priorityCardMarkup(item)).join('')
      : '<div class="card empty">Nenhum cliente encontrado para este filtro.</div>';

    bindPriorityButtons();
  };

  document.querySelector('#priority-q').oninput = draw;
  document.querySelector('#priority-filter').onchange = draw;
  draw();
}

function cx() {
  layout(`
    <div class="top">
      <div>
        <h1>Voz do Cliente</h1>
        <p class="sub">Feedback transformado em aprendizado sobre a jornada.</p>
      </div>
    </div>
    <div class="grid4">
      <div class="card metric"><strong>4,3/5</strong><span>CSAT demonstrativo</span></div>
      <div class="card metric"><strong>+42</strong><span>NPS demonstrativo</span></div>
      <div class="card metric"><strong>76%</strong><span>Conclusão</span></div>
      <div class="card metric"><strong>24%</strong><span>Interrupção</span></div>
    </div>
    <section class="cols">
      <div class="card">
        <h2>Atritos mais citados</h2>
        <div class="reason">Documentação — 41%</div>
        <div class="reason">Tempo de espera — 28%</div>
        <div class="reason">Comunicação/status — 19%</div>
        <div class="reason">Outros — 12%</div>
      </div>
      <div class="card">
        <h2>Comentários fictícios</h2>
        <p>“Gostei de saber exatamente o que faltava.”</p>
        <p>“Queria receber atualização mesmo quando ainda estivesse aguardando.”</p>
        <p class="small">A IA futura poderá classificar temas e resumir feedback, mas não decidirá questões financeiras.</p>
      </div>
    </section>
  `);
}

function customer() {
  const c = clients[0];
  const activeDocs = c.documents.filter(d => d.status !== 'resolved');
  const progress = getJourneyProgress(c);

  layout(`
    <div class="top">
      <div>
        <h1>Experiência mobile do cliente</h1>
        <p class="sub">A tela deve responder: onde estou, preciso fazer algo e qual é o próximo passo?</p>
      </div>
    </div>

    <div class="mobile-wrap">
      <div class="phone">
        <div class="small">Jornada360</div>
        <h2>Olá, ${safeText(c.name.split(' ')[0])}</h2>
        <p class="small">Sua jornada demonstrativa está em andamento.</p>
        <div class="mobile-progress-label">
          <span>Etapa ${progress.step} de ${progress.total}</span>
          <b>${progress.percent}%</b>
        </div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
          <i style="width:${progress.percent}%"></i>
        </div>
        <p><b>Etapa atual:</b> ${safeText(c.stage)}</p>

        <div class="action-box">
          <b>Você precisa fazer algo agora?</b>
          <h3>${activeDocs.length ? 'Sim' : 'Não'}</h3>
          <p>${activeDocs.length ? safeText(activeDocs[0].guidance || activeDocs[0].label) : 'Nenhuma ação documental pendente no momento.'}</p>
          <button class="btn">Ver orientação</button>
        </div>

        <div class="card">
          <b>Próximo passo</b>
          <p>${safeText(c.next)}</p>
          <span class="small">Última atualização: ${getDaysSinceLastInteraction(c)} dia(s)</span>
        </div>

        <h3>Como foi sua experiência até aqui?</h3>
        <div class="survey">
          ${[1,2,3,4,5].map(n => `<button>${n}</button>`).join('')}
        </div>

        <p class="notice">Demonstração de portfólio. O acompanhamento exibido não representa aprovação ou decisão de instituição financeira.</p>
      </div>
    </div>
  `);
}

function render() {
  ({
    dashboard,
    clients: clientList,
    priorities,
    cx,
    customer
  }[view] || dashboard)();
}

render();
