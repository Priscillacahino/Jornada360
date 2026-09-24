(function (global) {
  'use strict';

  const healthApi = global.JornadaHealth ||
    (typeof require !== 'undefined' ? require('./health-score.js') : null);

  if (!healthApi) {
    throw new Error('JornadaHealth precisa ser carregado antes de JornadaPriorities.');
  }

  function severityRank(severity) {
    return ({ critical: 0, attention: 1, neutral: 2, good: 3 })[severity] ?? 4;
  }

  function statusRank(status) {
    return ({ high: 0, attention: 1, healthy: 2 })[status] ?? 3;
  }

  function activeDocumentCount(client) {
    return (client.documents || []).filter(doc => doc.status !== 'resolved').length;
  }

  function latestInteractionDays(client, now = Date.now()) {
    const dates = (client.interactions || [])
      .map(item => item && item.occurredAt)
      .filter(Boolean)
      .map(value => new Date(value).getTime())
      .filter(Number.isFinite);

    if (!dates.length) return null;

    const latest = Math.max(...dates);
    return Math.max(0, Math.floor((now - latest) / 86400000));
  }

  function orderedAlerts(health) {
    return [...(health.alerts || [])].sort((a, b) => {
      const severity = severityRank(a.severity) - severityRank(b.severity);
      if (severity !== 0) return severity;

      const lossA = a.max - a.points;
      const lossB = b.max - b.points;
      if (lossA !== lossB) return lossB - lossA;

      return a.label.localeCompare(b.label, 'pt-BR');
    });
  }

  function communicationSuggestion(client, primaryFactor, nextAction) {
    const firstName = String(client.name || 'cliente').split(' ')[0];
    const templates = {
      'Situação documental': `Olá, ${firstName}. Estou acompanhando sua jornada e quero confirmar se a orientação sobre a documentação ficou clara. Próximo passo: ${nextAction}.`,
      'Pendências': `Olá, ${firstName}. Estou entrando em contato para ajudar com a pendência atual e confirmar se existe alguma dificuldade. Próximo passo: ${nextAction}.`,
      'Interação / engajamento': `Olá, ${firstName}. Estou retomando nosso acompanhamento para que você tenha clareza sobre a situação atual. Próximo passo: ${nextAction}.`,
      'Atualização da jornada': `Olá, ${firstName}. Passando para manter você atualizado sobre a jornada e alinhar o próximo passo: ${nextAction}.`,
      'Evolução da jornada': `Olá, ${firstName}. Quero revisar com você em que ponto a jornada está e combinar a próxima ação: ${nextAction}.`,
      'Satisfação': `Olá, ${firstName}. Obrigado pelo feedback. Quero entender melhor sua experiência e verificar como podemos melhorar o acompanhamento.`
    };

    return templates[primaryFactor] ||
      `Olá, ${firstName}. Estou acompanhando sua jornada e quero alinhar o próximo passo: ${nextAction}.`;
  }

  function buildPriority(client, stages, options = {}) {
    const now = options.now || Date.now();
    const health = options.health ||
      healthApi.calculateHealthScore(client, stages, { now });

    const alerts = orderedAlerts(health);
    const primary = alerts[0] || null;
    const criticalCount = alerts.filter(item => item.severity === 'critical').length;
    const attentionCount = alerts.filter(item => item.severity === 'attention').length;
    const daysWithoutInteraction = latestInteractionDays(client, now);

    let levelLabel = 'Sem prioridade imediata';
    if (health.status === 'high') levelLabel = 'Acompanhamento';
    if (health.status === 'attention') levelLabel = 'Atenção';
    if (health.status === 'healthy') levelLabel = 'Saudável';

    return {
      clientId: client.id,
      name: client.name,
      stage: client.stage,
      score: health.total,
      status: health.status,
      levelLabel,
      primaryFactor: primary ? primary.label : 'Jornada saudável',
      primaryReason: primary
        ? primary.message
        : 'Nenhum fator crítico identificado no acompanhamento atual.',
      reasons: alerts.slice(0, 3),
      criticalCount,
      attentionCount,
      activeDocuments: activeDocumentCount(client),
      daysWithoutInteraction,
      nextAction: (client.next || '').trim() || 'Definir próxima ação',
      suggestedMessage: communicationSuggestion(
        client,
        primary ? primary.label : 'Jornada saudável',
        (client.next || '').trim() || 'Definir próxima ação'
      ),
      health
    };
  }

  function buildPriorityList(clients, stages, options = {}) {
    const list = (clients || [])
      .filter(client => !client.outcomeStatus || client.outcomeStatus === 'active')
      .map(client => buildPriority(client, stages, options));

    return list.sort((a, b) => {
      const status = statusRank(a.status) - statusRank(b.status);
      if (status !== 0) return status;

      if (a.criticalCount !== b.criticalCount) {
        return b.criticalCount - a.criticalCount;
      }

      if (a.score !== b.score) return a.score - b.score;

      const daysA = a.daysWithoutInteraction === null ? Number.MAX_SAFE_INTEGER : a.daysWithoutInteraction;
      const daysB = b.daysWithoutInteraction === null ? Number.MAX_SAFE_INTEGER : b.daysWithoutInteraction;
      if (daysA !== daysB) return daysB - daysA;

      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }

  function priorityMetrics(list) {
    return {
      high: list.filter(item => item.status === 'high').length,
      attention: list.filter(item => item.status === 'attention').length,
      activeDocuments: list.reduce((sum, item) => sum + item.activeDocuments, 0),
      withoutInteraction: list.filter(item =>
        item.daysWithoutInteraction === null || item.daysWithoutInteraction >= 8
      ).length,
      needsAction: list.filter(item => item.status !== 'healthy').length
    };
  }

  const api = {
    communicationSuggestion,
    buildPriority,
    buildPriorityList,
    priorityMetrics
  };

  global.JornadaPriorities = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
