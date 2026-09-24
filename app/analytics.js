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

  function portfolioMetrics(clients) {
    const list = clients || [];
    return {
      total: list.length,
      healthy: list.filter(client => client.status === 'healthy').length,
      attention: list.filter(client => client.status === 'attention').length,
      high: list.filter(client => client.status === 'high').length
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

    const totalClients = (clients || []).length;
    const completed = (clients || []).filter(client => client.stage === 'Pós-atendimento').length;

    return {
      csatAverage,
      csatCount: csat.length,
      nps: npsScore,
      npsCount: nps.length,
      totalResponses: csat.length + nps.length,
      completionRate: totalClients ? Math.round((completed / totalClients) * 100) : 0,
      completed
    };
  }

  function frictionMetrics(clients, stages, options = {}) {
    const counts = new Map();
    const total = (clients || []).length;

    (clients || []).forEach(client => {
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
    const total = (clients || []).length;
    return stages.map(stage => {
      const count = (clients || []).filter(client => client.stage === stage).length;
      return { stage, count, percent: total ? Math.round((count / total) * 100) : 0 };
    });
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
    portfolioMetrics,
    surveyMetrics,
    frictionMetrics,
    stageDistribution,
    recentComments,
    buildPortfolioInsight
  };

  global.JornadaAnalytics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
