const STORAGE_KEY = 'jornada360_mvp_v2';
const STORAGE_VERSION = 7;

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
    'note': 'Observação',
    'survey': 'Pesquisa de experiência',
    'outcome': 'Situação da jornada'
  })[type] || 'Evento';
}

function createSeedClient(data, index) {
  const id = `cliente-${index + 1}`;
  const stageIndex = Math.max(0, stages.indexOf(data.stage));
  const documentStageIndex = stages.indexOf('Documentação');
  const interactions = [{
    id: `int-seed-${index + 1}`,
    channel: 'Acompanhamento',
    summary: `Último acompanhamento demonstrativo de ${data.name}.`,
    occurredAt: daysAgoISO(data.last)
  }];

  const hasDocumentPending = /document|comprovante/i.test(data.pending || '');
  let documents = [];

  if (hasDocumentPending) {
    documents = [{
      id: `doc-seed-${index + 1}`,
      label: /comprovante/i.test(data.pending) ? 'Comprovante complementar' : 'Documento solicitado',
      status: data.stage === 'Documentação' ? 'pending' : 'review',
      requestedAt: daysAgoISO(Math.max(data.last + 2, 4)),
      updatedAt: daysAgoISO(Math.max(data.last, 1)),
      guidance: data.next
    }];
  } else if (stageIndex >= documentStageIndex) {
    documents = [{
      id: `doc-seed-${index + 1}`,
      label: 'Documentação principal',
      status: 'resolved',
      requestedAt: daysAgoISO(Math.max(data.last + 5, 6)),
      updatedAt: daysAgoISO(Math.max(data.last, 1)),
      guidance: 'Documentação demonstrativa concluída.'
    }];
  }

  const surveys = [];
  if (Number.isFinite(data.csat)) {
    surveys.push({
      id: `survey-seed-${index + 1}-csat`,
      type: 'csat',
      score: data.csat,
      comment: data.comment || '',
      answeredAt: daysAgoISO(Math.max(data.last, 0))
    });
  }
  if (Number.isFinite(data.nps)) {
    surveys.push({
      id: `survey-seed-${index + 1}-nps`,
      type: 'nps',
      score: data.nps,
      comment: data.npsComment || '',
      answeredAt: daysAgoISO(Math.max(data.last, 0))
    });
  }

  const timeline = [];
  for (let i = 0; i <= stageIndex; i += 1) {
    timeline.push({
      id: `evt-seed-${index + 1}-${i + 1}`,
      type: 'stage',
      title: i === stageIndex ? `Etapa registrada: ${stages[i]}` : `Etapa concluída: ${stages[i]}`,
      detail: i === stageIndex
        ? 'Posição inicial da jornada na massa demonstrativa.'
        : 'Avanço registrado na jornada demonstrativa.',
      occurredAt: daysAgoISO(Math.max((stageIndex - i) * 5 + data.last, data.last))
    });
  }
  timeline.push({
    id: `evt-seed-${index + 1}-interaction`,
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
    outcomeStatus: ['active', 'completed', 'interrupted'].includes(data.outcomeStatus)
      ? data.outcomeStatus
      : (data.stage === 'Pós-atendimento' ? 'completed' : 'active'),
    interruptionReason: data.interruptionReason || '',
    interactions,
    documents,
    notes: [],
    surveys,
    timeline
  };
}

const seedData = [
  {name:'Mariana Costa',stage:'Documentação',score:68,status:'attention',last:3,pending:'Comprovante complementar',next:'Confirmar recebimento do documento'},
  {name:'Carlos Mendes',stage:'Documentação',score:42,status:'high',last:11,pending:'Documento pendente há 11 dias',next:'Confirmar dificuldade no envio',csat:2,comment:'Tive dificuldade para entender qual documento ainda faltava.'},
  {name:'Fernanda Lima',stage:'Análise',score:47,status:'high',last:15,pending:'Sem interação há 15 dias',next:'Realizar contato de acompanhamento',outcomeStatus:'interrupted',interruptionReason:'Cliente optou por pausar a jornada neste momento.',csat:2,comment:'Queria receber atualização mesmo quando ainda estivesse aguardando.'},
  {name:'Pedro Alves',stage:'Diagnóstico',score:73,status:'attention',last:2,pending:'Nova solicitação documental',next:'Orientar sobre documento solicitado',csat:4,comment:'A orientação inicial foi clara.'},
  {name:'Ana Ribeiro',stage:'Análise',score:76,status:'attention',last:8,pending:'Etapa sem atualização há 8 dias',next:'Verificar andamento e atualizar status',csat:3},
  {name:'Luiza Rocha',stage:'Preparação para contrato',score:91,status:'healthy',last:1,pending:'Nenhuma',next:'Orientar etapa final',csat:5,comment:'Gostei de saber exatamente o que faltava em cada etapa.'},
  {name:'Rafael Souza',stage:'Pós-atendimento',score:95,status:'healthy',last:0,pending:'Nenhuma',next:'Encerrar acompanhamento',csat:5,nps:9,comment:'O acompanhamento deixou o processo mais previsível.',npsComment:'Eu recomendaria a experiência de acompanhamento.'},
  {name:'Beatriz Santos',stage:'Pós-atendimento',score:90,status:'healthy',last:2,pending:'Nenhuma',next:'Encerrar acompanhamento',csat:4,nps:8,comment:'Foi fácil visualizar o próximo passo.'},
  {name:'João Almeida',stage:'Retorno da instituição',score:72,status:'attention',last:5,pending:'Nenhuma',next:'Atualizar cliente sobre o retorno',csat:3,comment:'A espera poderia ser comunicada com mais frequência.'},
  {name:'Camila Nunes',stage:'Documentação',score:54,status:'attention',last:9,pending:'Comprovante complementar',next:'Reforçar orientação documental',csat:2,comment:'Ainda tenho dúvida sobre o comprovante solicitado.'},
  {name:'Marcos Oliveira',stage:'Contratação',score:88,status:'healthy',last:2,pending:'Nenhuma',next:'Confirmar agenda de contratação',csat:4},
  {name:'Juliana Ferreira',stage:'Pós-atendimento',score:96,status:'healthy',last:1,pending:'Nenhuma',next:'Encerrar acompanhamento',csat:5,nps:10,comment:'A comunicação foi clara do início ao fim.'},
  {name:'Renata Barbosa',stage:'Diagnóstico',score:79,status:'attention',last:1,pending:'Nenhuma',next:'Concluir diagnóstico inicial',csat:4},
  {name:'André Martins',stage:'Análise',score:82,status:'healthy',last:4,pending:'Nenhuma',next:'Acompanhar retorno da análise',csat:4},
  {name:'Patrícia Gomes',stage:'Primeiro atendimento',score:84,status:'healthy',last:0,pending:'Nenhuma',next:'Realizar diagnóstico inicial'},
  {name:'Eduardo Lima',stage:'Retorno da instituição',score:61,status:'attention',last:12,pending:'Sem atualização há 12 dias',next:'Retomar acompanhamento',outcomeStatus:'interrupted',interruptionReason:'Jornada encerrada a pedido do cliente.',csat:3},
  {name:'Sofia Araújo',stage:'Preparação para contrato',score:89,status:'healthy',last:3,pending:'Nenhuma',next:'Orientar documentos para contratação',csat:5},
  {name:'Bruno Costa',stage:'Pós-atendimento',score:91,status:'healthy',last:2,pending:'Nenhuma',next:'Encerrar acompanhamento',csat:4,nps:7},
  {name:'Larissa Melo',stage:'Documentação',score:58,status:'attention',last:6,pending:'Documento complementar',next:'Confirmar envio do documento',csat:3,comment:'A lista de documentos ajudou, mas ainda precisei tirar uma dúvida.'},
  {name:'Thiago Rocha',stage:'Análise',score:49,status:'high',last:10,pending:'Comprovante complementar',next:'Revisar pendência documental',csat:2},
  {name:'Daniela Alves',stage:'Contratação',score:92,status:'healthy',last:1,pending:'Nenhuma',next:'Confirmar conclusão da contratação',csat:5},
  {name:'Gustavo Ribeiro',stage:'Necessidade',score:80,status:'healthy',last:0,pending:'Nenhuma',next:'Realizar primeiro atendimento'},
  {name:'Paula Mendes',stage:'Retorno da instituição',score:38,status:'high',last:16,pending:'Documento pendente há 16 dias',next:'Retomar contato e revisar pendência',csat:2,comment:'Fiquei insegura por não saber se precisava fazer algo.'},
  {name:'Vinícius Souza',stage:'Pós-atendimento',score:94,status:'healthy',last:1,pending:'Nenhuma',next:'Encerrar acompanhamento',csat:4,nps:9,comment:'A visualização das etapas foi útil.'}
];

const seedClients = seedData.map(createSeedClient);

function normalizeClient(client, index = 0) {
  return {
    id: client.id || `cliente-${index + 1}`,
    name: client.name || 'Cliente fictício',
    stage: stages.includes(client.stage) ? client.stage : 'Necessidade',
    score: Number.isFinite(client.score) ? client.score : 70,
    status: ['healthy', 'attention', 'high'].includes(client.status) ? client.status : 'attention',
    pending: client.pending || 'Nenhuma',
    next: client.next || 'Definir próxima ação',
    outcomeStatus: ['active', 'completed', 'interrupted'].includes(client.outcomeStatus)
      ? client.outcomeStatus
      : (client.stage === 'Pós-atendimento' ? 'completed' : 'active'),
    interruptionReason: client.interruptionReason || '',
    interactions: Array.isArray(client.interactions) ? client.interactions : [],
    documents: Array.isArray(client.documents) ? client.documents : [],
    notes: Array.isArray(client.notes) ? client.notes : [],
    surveys: Array.isArray(client.surveys) ? client.surveys : [],
    timeline: Array.isArray(client.timeline) ? client.timeline.map(normalizeTimelineEvent) : []
  };
}

function cloneSeedClients() {
  return seedClients.map((client, index) => normalizeClient(JSON.parse(JSON.stringify(client)), index));
}

function mergeSeedEnhancements(existingClients, previousVersion = 0) {
  const normalized = existingClients.map(normalizeClient);
  const byId = new Map(normalized.map(client => [client.id, client]));

  seedClients.forEach((seed, index) => {
    const current = byId.get(seed.id);
    if (!current) {
      normalized.push(normalizeClient(JSON.parse(JSON.stringify(seed)), index));
      return;
    }

    if (previousVersion < 6 && current.surveys.length === 0 && seed.surveys.length) {
      current.surveys = JSON.parse(JSON.stringify(seed.surveys));
    }

    if (
      previousVersion < 7 &&
      seed.outcomeStatus === 'interrupted' &&
      current.outcomeStatus === 'active' &&
      current.stage === seed.stage &&
      current.next === seed.next
    ) {
      current.outcomeStatus = 'interrupted';
      current.interruptionReason = seed.interruptionReason || 'Jornada interrompida na massa demonstrativa.';
    }
  });

  return normalized;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: STORAGE_VERSION, clients: cloneSeedClients() };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.clients)) throw new Error('Estrutura inválida');
    return {
      version: STORAGE_VERSION,
      clients: mergeSeedEnhancements(parsed.clients, Number(parsed.version) || 0)
    };
  } catch (error) {
    console.warn('Não foi possível carregar a persistência local. A massa fictícia foi restaurada.', error);
    return { version: STORAGE_VERSION, clients: cloneSeedClients() };
  }
}

let state = loadState();
let clients = state.clients;
let view = 'dashboard';
let currentClientId = null;
let customerClientId = clients[0]?.id || null;
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
  clients = cloneSeedClients();
  recalculateAllHealth();
  saveState();
  view = 'dashboard';
  currentClientId = null;
  customerClientId = clients[0]?.id || null;
  render();
}

function badge(c) {
  return `<span class="badge ${c.status}">${
    c.status === 'healthy' ? 'Saudável' : c.status === 'attention' ? 'Atenção' : 'Acompanhamento'
  }</span>`;
}

function outcomeLabel(status) {
  return ({
    active: 'Em andamento',
    completed: 'Concluída',
    interrupted: 'Interrompida'
  })[status] || 'Em andamento';
}

function outcomeBadge(c) {
  return `<span class="outcome-badge ${safeText(c.outcomeStatus || 'active')}">${safeText(outcomeLabel(c.outcomeStatus))}</span>`;
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

function getPortfolioAnalytics() {
  recalculateAllHealth();
  return {
    portfolio: JornadaAnalytics.portfolioMetrics(clients),
    surveys: JornadaAnalytics.surveyMetrics(clients),
    frictions: JornadaAnalytics.frictionMetrics(clients, stages),
    stages: JornadaAnalytics.stageDistribution(clients, stages),
    insight: JornadaAnalytics.buildPortfolioInsight(clients, stages),
    themes: JornadaAnalytics.vocThemeMetrics(clients),
    comments: JornadaAnalytics.recentComments(clients, 8)
  };
}

function formatNps(value) {
  if (value === null || value === undefined) return '—';
  return value > 0 ? `+${value}` : String(value);
}

function latestSurvey(c, type) {
  return JornadaAnalytics.latestSurvey(c, type);
}

function surveyScoreButtons(type, max, selected = null) {
  const start = type === 'nps' ? 0 : 1;
  return Array.from({ length: max - start + 1 }, (_, index) => start + index)
    .map(score => `
      <button type="button" class="survey-score ${selected === score ? 'selected' : ''}"
        data-survey-type="${type}" data-survey-score="${score}"
        aria-pressed="${selected === score ? 'true' : 'false'}">${score}</button>
    `).join('');
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
        <div class="communication-suggestion">
          <b>Sugestão de abordagem</b>
          <p>${safeText(item.suggestedMessage)}</p>
          <span>Texto demonstrativo de apoio. Revise antes de usar; nenhuma mensagem é enviada automaticamente.</span>
        </div>
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
    <a class="skip-link" href="#main-content">Ir para o conteúdo principal</a>
    <div class="shell">
      <aside class="side">
        <div class="brand">Jornada360</div>
        <div class="tag">CX • Customer Success</div>
        <nav class="nav" aria-label="Navegação principal">
          ${[
            ['dashboard', 'Visão geral'],
            ['clients', 'Clientes'],
            ['priorities', 'Prioridades'],
            ['cx', 'Voz do Cliente'],
            ['customer', 'Visão do cliente']
          ].map(([v, l]) => `<button type="button" data-v="${v}" class="${view === v ? 'active' : ''}" ${view === v ? 'aria-current="page"' : ''}>${l}</button>`).join('')}
        </nav>
        <div class="side-footer">
          <span id="save-indicator" aria-live="polite">Dados fictícios salvos localmente</span>
          <button type="button" class="reset-btn" id="reset-demo">Restaurar demonstração</button>
        </div>
      </aside>
      <main class="main" id="main-content" tabindex="-1">${content}</main>
    </div>`;

  document.querySelectorAll('[data-v]').forEach(button => {
    button.onclick = () => {
      view = button.dataset.v;
      currentClientId = null;
      render();
      window.requestAnimationFrame(() => document.querySelector('#main-content')?.focus());
    };
  });

  const reset = document.querySelector('#reset-demo');
  if (reset) reset.onclick = resetDemoData;
}

function dashboard() {
  const analytics = getPortfolioAnalytics();
  const p = analytics.portfolio;
  const insight = analytics.insight;
  const survey = analytics.surveys;

  layout(`
    <div class="top">
      <div>
        <h1>Visão geral da carteira</h1>
        <p class="sub">Indicadores calculados a partir da carteira fictícia salva neste navegador.</p>
      </div>
      <span class="pill">${p.total} clientes fictícios • ${p.active} jornada(s) ativa(s)</span>
    </div>

    <section class="grid4" aria-label="Indicadores da carteira">
      <div class="card metric"><strong>${p.active}</strong><span>Jornadas ativas</span></div>
      <div class="card metric"><strong>${p.healthy}</strong><span>Jornadas saudáveis ativas</span></div>
      <div class="card metric"><strong>${p.attention}</strong><span>Em atenção</span></div>
      <div class="card metric"><strong>${p.high}</strong><span>Necessitam acompanhamento</span></div>
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
      <div class="card insight-card">
        <h2>Insight CX da carteira</h2>
        <span class="insight-kicker">${safeText(insight.title)}</span>
        <p>${safeText(insight.summary)}</p>
        <div class="insight-action"><b>Ação sugerida</b><br>${safeText(insight.action)}</div>
        <p class="small">Regra determinística de apoio ao acompanhamento; não é decisão financeira automatizada.</p>
      </div>
    </section>

    <section class="cols">
      <div class="card">
        <h2>Distribuição por etapa</h2>
        <div class="stage-distribution">
          ${analytics.stages.map(item => `
            <div class="distribution-row">
              <div><b>${safeText(item.stage)}</b><span>${item.count}</span></div>
              <div class="distribution-track"><i style="width:${item.percent}%"></i></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <h2>Voz do Cliente — resumo</h2>
        <div class="voc-summary-grid">
          <div><strong>${survey.csatAverage === null ? '—' : `${survey.csatAverage.toFixed(1).replace('.', ',')}/5`}</strong><span>CSAT • ${survey.csatCount} resposta(s)</span></div>
          <div><strong>${formatNps(survey.nps)}</strong><span>NPS • ${survey.npsCount} resposta(s)</span></div>
          <div><strong>${survey.completionRate}%</strong><span>Conclusão entre jornadas encerradas</span></div>
          <div><strong>${survey.interruptionRate}%</strong><span>Interrupção entre jornadas encerradas</span></div>
        </div>
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
    <div class="card" id="list" role="region" aria-live="polite" aria-label="Resultados da carteira"></div>
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
              <div><b>${safeText(c.name)}</b><div class="small">${safeText(c.stage)} • ${safeText(outcomeLabel(c.outcomeStatus))}</div></div>
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

  const outcomeForm = document.querySelector('#outcome-form');
  if (outcomeForm) {
    outcomeForm.onsubmit = event => {
      event.preventDefault();
      const status = document.querySelector('#outcome-status').value;
      const reason = document.querySelector('#interruption-reason').value.trim();

      if (status === 'interrupted' && !reason) {
        const feedback = document.querySelector('#outcome-feedback');
        if (feedback) feedback.textContent = 'Informe um motivo demonstrativo para registrar a interrupção.';
        return;
      }

      const previous = c.outcomeStatus || 'active';
      const previousReason = c.interruptionReason || '';
      c.outcomeStatus = status;
      c.interruptionReason = status === 'interrupted' ? reason : '';

      if (status === 'completed' && c.stage !== 'Pós-atendimento') {
        const oldStage = c.stage;
        c.stage = 'Pós-atendimento';
        addTimeline(
          c,
          'stage-forward',
          `Avanço de etapa: ${oldStage} → Pós-atendimento`,
          'A jornada foi marcada como concluída e avançou para o pós-atendimento.'
        );
      }

      if (previous !== status || (status === 'interrupted' && previousReason !== reason)) {
        addTimeline(
          c,
          'outcome',
          `Situação da jornada: ${outcomeLabel(status)}`,
          status === 'interrupted'
            ? `Motivo: ${reason}`
            : `Situação anterior: ${outcomeLabel(previous)}.`
        );
      }

      saveState();
      detail(c.id);
    };
  }

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
      <div class="top-badges">${badge(c)} ${outcomeBadge(c)}</div>
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
        ${c.outcomeStatus === 'interrupted' ? `<div class="reason"><b>Motivo da interrupção:</b><br>${safeText(c.interruptionReason || 'Não informado')}</div>` : ''}

        <form id="outcome-form" class="outcome-form">
          <label>
            Situação da jornada
            <select id="outcome-status">
              <option value="active" ${c.outcomeStatus === 'active' ? 'selected' : ''}>Em andamento</option>
              <option value="completed" ${c.outcomeStatus === 'completed' ? 'selected' : ''}>Concluída</option>
              <option value="interrupted" ${c.outcomeStatus === 'interrupted' ? 'selected' : ''}>Interrompida</option>
            </select>
          </label>
          <label>
            Motivo da interrupção
            <textarea id="interruption-reason" rows="2" maxlength="220" placeholder="Obrigatório apenas quando a jornada for interrompida">${safeText(c.interruptionReason || '')}</textarea>
          </label>
          <button class="btn" type="submit">Salvar situação</button>
          <div id="outcome-feedback" class="small" aria-live="polite"></div>
        </form>

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

    <div id="priority-list" class="priority-list" role="region" aria-live="polite" aria-label="Lista de prioridades"></div>

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
  const analytics = getPortfolioAnalytics();
  const survey = analytics.surveys;
  const frictions = analytics.frictions;
  const themes = analytics.themes;
  const comments = analytics.comments;

  layout(`
    <div class="top">
      <div>
        <h1>Voz do Cliente</h1>
        <p class="sub">CSAT, NPS, comentários e atritos calculados a partir dos registros fictícios do MVP.</p>
      </div>
      <span class="pill">${survey.totalResponses} resposta(s) registradas</span>
    </div>
    <div class="grid4">
      <div class="card metric"><strong>${survey.csatAverage === null ? '—' : `${survey.csatAverage.toFixed(1).replace('.', ',')}/5`}</strong><span>CSAT • ${survey.csatCount} resposta(s)</span></div>
      <div class="card metric"><strong>${formatNps(survey.nps)}</strong><span>NPS • ${survey.npsCount} resposta(s)</span></div>
      <div class="card metric"><strong>${survey.completionRate}%</strong><span>Conclusão entre jornadas encerradas</span></div>
      <div class="card metric"><strong>${survey.interruptionRate}%</strong><span>Interrupção entre jornadas encerradas</span></div>
    </div>
    <section class="cols">
      <div class="card">
        <h2>Atritos mais frequentes na carteira</h2>
        ${frictions.length ? frictions.slice(0, 6).map(item => `
          <div class="friction-row">
            <div><b>${safeText(item.label)}</b><span>${item.affected} cliente(s) • ${item.percent}% da carteira</span></div>
            <div class="friction-track"><i style="width:${item.percent}%"></i></div>
          </div>
        `).join('') : '<div class="empty">Nenhum fator de atenção identificado.</div>'}
        <p class="small">Os atritos são derivados dos fatores do Journey Health Score; não usam atributos pessoais ou critérios de crédito.</p>
      </div>
      <div class="card">
        <h2>Temas da Voz do Cliente</h2>
        <div class="voc-themes">
          ${themes.length ? themes.map(item => `
            <div class="voc-theme-row">
              <span>${safeText(item.category)}</span>
              <b>${item.count} • ${item.percent}%</b>
            </div>
          `).join('') : '<p class="small">Nenhum comentário classificado.</p>'}
        </div>

        <h2 class="section-space">Comentários fictícios recentes</h2>
        ${comments.length ? comments.map(item => `
          <blockquote class="voc-comment">
            <p>“${safeText(item.comment)}”</p>
            <footer><span class="voc-theme-tag">${safeText(item.category)}</span> ${safeText(item.clientName)} • ${item.type.toUpperCase()} ${item.score}${item.type === 'csat' ? '/5' : '/10'} • ${formatDate(item.answeredAt)}</footer>
          </blockquote>
        `).join('') : '<div class="empty">Nenhum comentário registrado.</div>'}
      </div>
    </section>
    <p class="notice">Feedbacks e métricas desta demonstração são fictícios. CSAT e NPS apoiam a melhoria da experiência e não interferem em decisões financeiras.</p>
  `);
}

function customer() {
  const c = getClient(customerClientId) || clients[0];
  if (!c) return dashboard();
  customerClientId = c.id;

  const activeDocs = c.documents.filter(d => d.status !== 'resolved');
  const progress = getJourneyProgress(c);
  const latestCsat = latestSurvey(c, 'csat');
  const latestNps = latestSurvey(c, 'nps');
  const days = getDaysSinceLastInteraction(c);

  layout(`
    <div class="top">
      <div>
        <h1>Experiência mobile do cliente</h1>
        <p class="sub">Demonstração da visão do cliente com acompanhamento e pesquisas funcionais.</p>
      </div>
      <label class="customer-selector">
        Cliente fictício
        <select id="customer-client-select">
          ${clients.map(client => `<option value="${client.id}" ${client.id === c.id ? 'selected' : ''}>${safeText(client.name)}</option>`).join('')}
        </select>
      </label>
    </div>

    <div class="mobile-wrap">
      <div class="phone">
        <div class="small">Jornada360</div>
        <h2>Olá, ${safeText(c.name.split(' ')[0])}</h2>
        <p class="small">Situação demonstrativa: <b>${safeText(outcomeLabel(c.outcomeStatus))}</b>.</p>
        ${c.outcomeStatus === 'interrupted' ? `<div class="customer-outcome-alert"><b>Jornada interrompida</b><p>${safeText(c.interruptionReason || 'Motivo não informado.')}</p></div>` : ''}
        <div class="mobile-progress-label">
          <span>Etapa ${progress.step} de ${progress.total}</span>
          <b>${progress.percent}%</b>
        </div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}" aria-label="Progresso da jornada">
          <i style="width:${progress.percent}%"></i>
        </div>
        <p><b>Etapa atual:</b> ${safeText(c.stage)}</p>

        <div class="action-box">
          <b>Você precisa fazer algo agora?</b>
          <h3>${activeDocs.length ? 'Sim' : 'Não'}</h3>
          <p>${activeDocs.length ? safeText(activeDocs[0].guidance || activeDocs[0].label) : 'Nenhuma ação documental pendente no momento.'}</p>
          ${activeDocs.length ? `<p class="small">Item: ${safeText(activeDocs[0].label)}</p>` : ''}
        </div>

        <div class="card">
          <b>Próximo passo</b>
          <p>${safeText(c.next)}</p>
          <span class="small">Última interação: ${days === null ? 'não registrada' : `${days} dia(s)`}</span>
        </div>

        <section class="mobile-survey-section">
          <h3>Como foi sua experiência até aqui?</h3>
          <p class="small">CSAT • escolha uma nota de 1 a 5.</p>
          <form id="csat-form" class="survey-form">
            <div class="survey" role="group" aria-label="Nota CSAT de 1 a 5">
              ${surveyScoreButtons('csat', 5, latestCsat ? Number(latestCsat.score) : null)}
            </div>
            <label>
              Comentário opcional
              <textarea id="csat-comment" rows="2" maxlength="300" placeholder="Conte brevemente como foi sua experiência">${safeText(latestCsat?.comment || '')}</textarea>
            </label>
            <button class="btn alt" type="submit">Salvar CSAT</button>
          </form>
        </section>

        ${c.outcomeStatus === 'completed' ? `
          <section class="mobile-survey-section">
            <h3>Você recomendaria esta experiência?</h3>
            <p class="small">NPS • escolha uma nota de 0 a 10.</p>
            <form id="nps-form" class="survey-form">
              <div class="survey nps-scale" role="group" aria-label="Nota NPS de 0 a 10">
                ${surveyScoreButtons('nps', 10, latestNps ? Number(latestNps.score) : null)}
              </div>
              <label>
                Comentário opcional
                <textarea id="nps-comment" rows="2" maxlength="300" placeholder="O que mais influenciou sua nota?">${safeText(latestNps?.comment || '')}</textarea>
              </label>
              <button class="btn alt" type="submit">Salvar NPS</button>
            </form>
          </section>
        ` : `
          <div class="survey-locked">
            <b>NPS no encerramento</b>
            <p class="small">A pesquisa NPS fica disponível quando a jornada é marcada como concluída.</p>
          </div>
        `}

        <div id="survey-feedback" class="survey-feedback" aria-live="polite"></div>
        <p class="notice">Demonstração de portfólio. O acompanhamento exibido não representa aprovação ou decisão de instituição financeira.</p>
      </div>
    </div>
  `);

  document.querySelector('#customer-client-select').onchange = event => {
    customerClientId = event.target.value;
    customer();
  };

  const bindScale = type => {
    document.querySelectorAll(`[data-survey-type="${type}"]`).forEach(button => {
      button.onclick = () => {
        document.querySelectorAll(`[data-survey-type="${type}"]`).forEach(item => {
          item.classList.remove('selected');
          item.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
      };
    });
  };

  const saveSurvey = (type, commentId) => {
    const selected = document.querySelector(`[data-survey-type="${type}"].selected`);
    const feedback = document.querySelector('#survey-feedback');
    if (!selected) {
      feedback.textContent = `Escolha uma nota para ${type.toUpperCase()} antes de salvar.`;
      return false;
    }

    const score = Number(selected.dataset.surveyScore);
    const comment = document.querySelector(commentId)?.value.trim() || '';
    const now = new Date().toISOString();
    const existing = latestSurvey(c, type);

    if (existing) {
      existing.score = score;
      existing.comment = comment;
      existing.answeredAt = now;
    } else {
      c.surveys.push({ id: uid('survey'), type, score, comment, answeredAt: now });
    }

    addTimeline(c, 'survey', `${type.toUpperCase()} registrado`, `Nota ${score}/${type === 'csat' ? 5 : 10}${comment ? ` • ${comment}` : ''}`);
    saveState();
    feedback.textContent = `${type.toUpperCase()} salvo neste navegador.`;
    window.setTimeout(() => customer(), 500);
    return true;
  };

  bindScale('csat');
  document.querySelector('#csat-form').onsubmit = event => {
    event.preventDefault();
    saveSurvey('csat', '#csat-comment');
  };

  const npsForm = document.querySelector('#nps-form');
  if (npsForm) {
    bindScale('nps');
    npsForm.onsubmit = event => {
      event.preventDefault();
      saveSurvey('nps', '#nps-comment');
    };
  }
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
