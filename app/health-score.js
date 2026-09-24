(function (global) {
  'use strict';

  const DAY = 86400000;

  function daysSince(iso, now = Date.now()) {
    if (!iso) return null;
    const time = new Date(iso).getTime();
    if (!Number.isFinite(time)) return null;
    return Math.max(0, Math.floor((now - time) / DAY));
  }

  function latestDate(items, field) {
    const valid = (items || [])
      .map(item => item && item[field])
      .filter(Boolean)
      .map(value => new Date(value).getTime())
      .filter(Number.isFinite);

    return valid.length ? new Date(Math.max(...valid)).toISOString() : null;
  }

  function latestStageEvent(client) {
    const events = (client.timeline || []).filter(event =>
      ['stage', 'stage-forward', 'stage-back'].includes(event.type)
    );
    return latestDate(events, 'occurredAt');
  }

  function latestJourneyUpdate(client) {
    return latestDate(client.timeline || [], 'occurredAt');
  }

  function latestInteraction(client) {
    return latestDate(client.interactions || [], 'occurredAt');
  }

  function activeDocuments(client) {
    return (client.documents || []).filter(doc => doc.status !== 'resolved');
  }

  function documentAge(doc, now) {
    const reference = doc.status === 'pending'
      ? (doc.requestedAt || doc.updatedAt)
      : (doc.updatedAt || doc.requestedAt);
    return daysSince(reference, now);
  }

  function satisfactionInfo(client) {
    const surveys = Array.isArray(client.surveys) ? client.surveys : [];
    const csatSurveys = surveys.filter(item => {
      const score = Number(item && item.score);
      return item && (item.type === 'csat' || (!item.type && score >= 1 && score <= 5));
    });

    if (!csatSurveys.length) {
      return {
        points: 5,
        message: 'CSAT ainda não coletado: 5/10 (valor neutro; não gera alerta).',
        neutral: true
      };
    }

    const latest = [...csatSurveys].sort((a, b) =>
      new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0)
    )[0];

    const score = Number(latest.score);
    if (score >= 4) {
      return { points: 10, message: `CSAT positivo disponível: ${score}/5.`, neutral: false };
    }
    if (score === 3) {
      return { points: 6, message: 'CSAT neutro disponível: 3/5.', neutral: false };
    }
    return { points: 2, message: `CSAT negativo disponível: ${score}/5.`, neutral: false };
  }

  function factor(id, label, points, max, message, neutral = false) {
    let severity = 'good';
    if (neutral) {
      severity = 'neutral';
    } else if (points < max) {
      severity = points >= Math.ceil(max / 2) ? 'attention' : 'critical';
    }

    return { id, label, points, max, message, severity, neutral };
  }

  function statusFromScore(score) {
    if (score >= 80) return 'healthy';
    if (score >= 50) return 'attention';
    return 'high';
  }

  function calculateHealthScore(client, stages, options = {}) {
    const now = options.now || Date.now();
    const currentIndex = Math.max(0, stages.indexOf(client.stage));
    const finalIndex = stages.length - 1;
    const documentStageIndex = Math.max(0, stages.indexOf('Documentação'));

    const stageDate = latestStageEvent(client);
    const stageAge = daysSince(stageDate, now);

    let evolutionPoints = 10;
    let evolutionMessage = 'Sem histórico suficiente de mudança de etapa.';
    if (currentIndex === finalIndex) {
      evolutionPoints = 25;
      evolutionMessage = 'Jornada alcançou a etapa final.';
    } else if (stageAge === null) {
      evolutionPoints = 10;
      evolutionMessage = 'Sem registro recente de mudança de etapa.';
    } else if (stageAge <= 7) {
      evolutionPoints = 25;
      evolutionMessage = `Etapa atualizada há ${stageAge} dia(s): evolução dentro do período esperado.`;
    } else if (stageAge <= 14) {
      evolutionPoints = 18;
      evolutionMessage = `Etapa sem avanço há ${stageAge} dia(s): pequena estagnação.`;
    } else if (stageAge <= 21) {
      evolutionPoints = 10;
      evolutionMessage = `Etapa sem avanço há ${stageAge} dia(s): estagnação relevante.`;
    } else {
      evolutionPoints = 0;
      evolutionMessage = `Etapa sem avanço há ${stageAge} dia(s): acompanhamento prioritário.`;
    }

    const docs = Array.isArray(client.documents) ? client.documents : [];
    const activeDocs = activeDocuments(client);

    let documentPoints = 20;
    let documentMessage = 'Documentação compatível com a etapa atual.';
    if (!docs.length && currentIndex >= documentStageIndex) {
      documentPoints = 0;
      documentMessage = 'Etapa documental alcançada sem itens documentais registrados.';
    } else if (!docs.length && currentIndex < documentStageIndex) {
      documentPoints = 20;
      documentMessage = 'Documentação ainda não é esperada para esta etapa.';
    } else if (!activeDocs.length) {
      documentPoints = 20;
      documentMessage = 'Itens documentais registrados estão concluídos.';
    } else if (activeDocs.length === 1) {
      documentPoints = 14;
      documentMessage = 'Existe uma pendência documental ativa.';
    } else {
      documentPoints = 7;
      documentMessage = `Existem ${activeDocs.length} itens documentais ativos.`;
    }

    let pendingPoints = 20;
    let pendingMessage = 'Nenhuma pendência documental ativa.';
    if (activeDocs.length) {
      const ages = activeDocs
        .map(doc => documentAge(doc, now))
        .filter(age => age !== null);
      const oldest = ages.length ? Math.max(...ages) : null;

      if (oldest === null) {
        pendingPoints = 7;
        pendingMessage = 'Pendência ativa sem data suficiente para medir antiguidade.';
      } else if (oldest <= 3) {
        pendingPoints = 14;
        pendingMessage = `Pendência recente: ${oldest} dia(s).`;
      } else if (oldest <= 7) {
        pendingPoints = 7;
        pendingMessage = `Pendência próxima do limite de acompanhamento: ${oldest} dia(s).`;
      } else {
        pendingPoints = 0;
        pendingMessage = `Pendência antiga sem resolução: ${oldest} dia(s).`;
      }
    }

    const interactionDate = latestInteraction(client);
    const interactionAge = daysSince(interactionDate, now);
    let interactionPoints = 0;
    let interactionMessage = 'Nenhuma interação registrada.';
    if (interactionAge !== null && interactionAge <= 2) {
      interactionPoints = 15;
      interactionMessage = `Interação recente: ${interactionAge} dia(s).`;
    } else if (interactionAge !== null && interactionAge <= 7) {
      interactionPoints = 11;
      interactionMessage = `Acompanhamento regular: última interação há ${interactionAge} dia(s).`;
    } else if (interactionAge !== null && interactionAge <= 14) {
      interactionPoints = 6;
      interactionMessage = `Baixa interação: último contato há ${interactionAge} dia(s).`;
    } else if (interactionAge !== null) {
      interactionPoints = 0;
      interactionMessage = `Sem retorno por período relevante: ${interactionAge} dia(s).`;
    }

    const updateDate = latestJourneyUpdate(client);
    const updateAge = daysSince(updateDate, now);
    let freshnessPoints = 0;
    let freshnessMessage = 'Nenhuma atualização da jornada registrada.';
    if (updateAge !== null && updateAge <= 3) {
      freshnessPoints = 10;
      freshnessMessage = `Jornada atualizada recentemente: ${updateAge} dia(s).`;
    } else if (updateAge !== null && updateAge <= 7) {
      freshnessPoints = 6;
      freshnessMessage = `Atualização exige atenção: ${updateAge} dia(s).`;
    } else if (updateAge !== null && updateAge <= 14) {
      freshnessPoints = 2;
      freshnessMessage = `Atualização antiga: ${updateAge} dia(s).`;
    } else if (updateAge !== null) {
      freshnessPoints = 0;
      freshnessMessage = `Período crítico sem atualização: ${updateAge} dia(s).`;
    }

    const satisfaction = satisfactionInfo(client);

    const factors = [
      factor('evolution', 'Evolução da jornada', evolutionPoints, 25, evolutionMessage),
      factor('documents', 'Situação documental', documentPoints, 20, documentMessage),
      factor('pending', 'Pendências', pendingPoints, 20, pendingMessage),
      factor('interaction', 'Interação / engajamento', interactionPoints, 15, interactionMessage),
      factor('freshness', 'Atualização da jornada', freshnessPoints, 10, freshnessMessage),
      factor('satisfaction', 'Satisfação', satisfaction.points, 10, satisfaction.message, satisfaction.neutral)
    ];

    const total = factors.reduce((sum, item) => sum + item.points, 0);
    const status = statusFromScore(total);
    const alerts = factors.filter(item => item.severity === 'attention' || item.severity === 'critical');

    return {
      total,
      status,
      factors,
      alerts,
      calculatedAt: new Date(now).toISOString()
    };
  }

  const api = { calculateHealthScore, statusFromScore, daysSince };

  global.JornadaHealth = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
