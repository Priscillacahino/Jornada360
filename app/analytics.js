(function (global) {
  'use strict';

  const healthApi = global.JornadaHealth ||
    (typeof require !== 'undefined' ? require('./health-score.js') : null);

  if (!healthApi) {
    throw new Error('JornadaHealth precisa ser carregado antes de JornadaAnalytics.');
  }

  function normalizedType(item) {
    if (!item) return null;
    if (item.type === 'csat' || item.type === 'nps') return item.type;
    const score = Number(item.score);
    return score >= 1 && score <= 5 ? 'csat' : null;
  }

  function surveysOf(clients, type) {
    return (clients || []).flatMap(client =>
      (client.surveys || [])
        .filter(item => normalizedType(item) === type)
        .map(item => ({ ...item, clientId: client.id, clientName: client.name, type }))
    );
  }

  function latestSurvey(client, type) {
    const list = (client.surveys || [])
      .filter(item => normalizedType(item) === type)
      .sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0));
    return list[0] || null;
  }

  function normalizedOutcome(client) {
    if (client && ['active', 'completed', 'interrupted'].includes(client.outcomeStatus)) {
      return client.outcomeStatus;
    }
    return client && client.stage === 'Pós-atendimento' ? 'completed' : 'active';
  }

  function outcomeMetrics(clients) {
    const list = clients || [];
    const active = list.filter(client => normalizedOutcome(client) === 'active').length;
    const completed = list.filter(client => normalizedOutcome(client) === 'completed').length;
    const interrupted = list.filter(client => normalizedOutcome(client) === 'interrupted').length;
    const closed = completed + interrupted;

    return {
      total: list.length,
      active,
      completed,
      interrupted,
      closed,
      completionRate: closed ? Math.round((completed / closed) * 100) : 0,
      interruptionRate: closed ? Math.round((interrupted / closed) * 100) : 0
    };
  }

  function portfolioMetrics(clients) {
    const list = clients || [];
    const outcomes = outcomeMetrics(list);
    const activeClients = list.filter(client => normalizedOutcome(client) === 'active');

    return {
      total: list.length,
      active: outcomes.active,
      completed: outcomes.completed,
      interrupted: outcomes.interrupted,
      healthy: activeClients.filter(client => client.status === 'healthy').length,
      attention: activeClients.filter(client => client.status === 'attention').length,
      high: activeClients.filter(client => client.status === 'high').length
    };
  }

  function surveyMetrics(clients) {
    const csat = surveysOf(clients, 'csat').filter(item => Number(item.score) >= 1 && Number(item.score) <= 5);
    const nps = surveysOf(clients, 'nps').filter(item => Number(item.score) >= 0 && Number(item.score) <= 10);

    const csatAverage = csat.length
      ? csat.reduce((sum, item) => sum + Number(item.score), 0) / csat.length
      : null;

    let npsScore = null;
    if (nps.length) {
      const promoters = nps.filter(item => Number(item.score) >= 9).length;
      const detractors = nps.filter(item => Number(item.score) <= 6).length;
      npsScore = Math.round(((promoters - detractors) / nps.length) * 100);
    }

    const outcomes = outcomeMetrics(clients);

    return {
      csatAverage,
      csatCount: csat.length,
      nps: npsScore,
      npsCount: nps.length,
      totalResponses: csat.length + nps.length,
      completionRate: outcomes.completionRate,
      interruptionRate: outcomes.interruptionRate,
      completed: outcomes.completed,
      interrupted: outcomes.interrupted,
      active: outcomes.active,
      closed: outcomes.closed
    };
  }

  function frictionMetrics(clients, stages, options = {}) {
    const counts = new Map();
    const activeClients = (clients || []).filter(client => normalizedOutcome(client) === 'active');
    const total = activeClients.length;

    activeClients.forEach(client => {
      const health = healthApi.calculateHealthScore(client, stages, options);
      const labels = new Set((health.alerts || []).map(item => item.label));
      labels.forEach(label => counts.set(label, (counts.get(label) || 0) + 1));
    });

    return [...counts.entries()]
      .map(([label, affected]) => ({
        label,
        affected,
        percent: total ? Math.round((affected / total) * 100) : 0
      }))
      .sort((a, b) => b.affected - a.affected || a.label.localeCompare(b.label, 'pt-BR'));
  }

  function stageDistribution(clients, stages) {
    const activeClients = (clients || []).filter(client => normalizedOutcome(client) === 'active');
    const total = activeClients.length;
    return stages.map(stage => {
      const count = activeClients.filter(client => client.stage === stage).length;
      return { stage, count, percent: total ? Math.round((count / total) * 100) : 0 };
    });
  }

  function classifyVocComment(comment) {
    const text = String(comment || '').toLowerCase();

    if (!text.trim()) return 'Sem comentário';
    if (/document|comprovante|envio|lista de document/.test(text)) return 'Dificuldade documental';
    if (/esper|demor|tempo/.test(text)) return 'Tempo de espera';
    if (/atualiz|comunica|status|retorno|inform|saber/.test(text)) return 'Comunicação / status';
    if (/poderia|sugest|seria melhor|gostaria/.test(text)) return 'Sugestão';
    if (/gost|clar|fácil|facil|útil|util|recomend|ótim|otim|bom|boa|previsível|previsivel/.test(text)) return 'Elogio';
    return 'Outros';
  }

  function vocThemeMetrics(clients) {
    const counts = new Map();

    (clients || []).forEach(client => {
      (client.surveys || []).forEach(item => {
        const comment = String(item?.comment || '').trim();
        if (!comment) return;
        const category = classifyVocComment(comment);
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });

    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);

    return [...counts.entries()]
      .map(([category, count]) => ({
        category,
        count,
        percent: total ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'pt-BR'));
  }

  function recentComments(clients, limit = 6) {
    return (clients || []).flatMap(client =>
      (client.surveys || [])
        .filter(item => item && String(item.comment || '').trim())
        .map(item => ({
          clientId: client.id,
          clientName: client.name,
          type: normalizedType(item) || item.type || 'pesquisa',
          score: Number(item.score),
          comment: String(item.comment).trim(),
          category: classifyVocComment(item.comment),
          answeredAt: item.answeredAt
        }))
    )
      .sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0))
      .slice(0, limit);
  }

  function buildPortfolioInsight(clients, stages, options = {}) {
    const frictions = frictionMetrics(clients, stages, options);
    if (!frictions.length) {
      return {
        title: 'Carteira sem atrito dominante',
        summary: 'Nenhum fator de atenção aparece de forma recorrente na carteira atual.',
        action: 'Manter o acompanhamento e observar mudanças nos próximos registros.'
      };
    }

    const top = frictions[0];
    const actions = {
      'Evolução da jornada': 'Revisar jornadas sem avanço e confirmar o próximo passo de acompanhamento.',
      'Situação documental': 'Reforçar orientações documentais e conferir se o cliente sabe exatamente o que precisa enviar.',
      'Pendências': 'Tratar primeiro as pendências mais antigas e registrar a ação esperada.',
      'Interação / engajamento': 'Retomar contatos antigos e registrar um novo ponto de acompanhamento.',
      'Atualização da jornada': 'Atualizar status e próxima ação para reduzir períodos sem informação.',
      'Satisfação': 'Ler os comentários recentes e fechar o ciclo de feedback com os pontos de insatisfação.'
    };

    return {
      title: top.label,
      summary: `${top.affected} cliente(s), ${top.percent}% da carteira, apresentam este fator de atenção.`,
      action: actions[top.label] || 'Revisar os casos sinalizados e registrar a próxima ação de acompanhamento.'
    };
  }

  const api = {
    normalizedType,
    surveysOf,
    latestSurvey,
    normalizedOutcome,
    outcomeMetrics,
    portfolioMetrics,
    surveyMetrics,
    frictionMetrics,
    stageDistribution,
    classifyVocComment,
    vocThemeMetrics,
    recentComments,
    buildPortfolioInsight
  };

  global.JornadaAnalytics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
