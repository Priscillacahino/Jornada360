const assert = require('assert');
const { calculateHealthScore, statusFromScore } = require('../app/health-score.js');

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

const NOW = new Date('2026-09-24T15:00:00Z').getTime();
const ago = days => new Date(NOW - days * 86400000).toISOString();

function client(overrides = {}) {
  return {
    stage: 'Documentação',
    documents: [],
    interactions: [],
    timeline: [],
    surveys: [],
    ...overrides
  };
}

{
  const c = client({
    stage: 'Pós-atendimento',
    documents: [{ status: 'resolved', requestedAt: ago(8), updatedAt: ago(1) }],
    interactions: [{ occurredAt: ago(1) }],
    timeline: [{ type: 'stage-forward', occurredAt: ago(1) }]
  });
  const health = calculateHealthScore(c, stages, { now: NOW });
  assert.strictEqual(health.total, 95);
  assert.strictEqual(health.status, 'healthy');
}

{
  const c = client({
    documents: [{ status: 'pending', requestedAt: ago(5), updatedAt: ago(5) }],
    interactions: [{ occurredAt: ago(3) }],
    timeline: [{ type: 'stage', occurredAt: ago(3) }]
  });
  const health = calculateHealthScore(c, stages, { now: NOW });
  assert.strictEqual(health.total, 72);
  assert.strictEqual(health.status, 'attention');
}

{
  const c = client({
    stage: 'Análise',
    documents: [
      { status: 'pending', requestedAt: ago(12), updatedAt: ago(12) },
      { status: 'review', requestedAt: ago(14), updatedAt: ago(10) }
    ],
    interactions: [{ occurredAt: ago(18) }],
    timeline: [{ type: 'stage', occurredAt: ago(24) }]
  });
  const health = calculateHealthScore(c, stages, { now: NOW });
  assert.strictEqual(health.status, 'high');
  assert.ok(health.total < 50);
}

{
  const c = client({
    stage: 'Pós-atendimento',
    documents: [{ status: 'resolved', requestedAt: ago(8), updatedAt: ago(1) }],
    interactions: [{ occurredAt: ago(1) }],
    timeline: [{ type: 'stage-forward', occurredAt: ago(1) }],
    surveys: [{ score: 5, answeredAt: ago(0) }]
  });
  const health = calculateHealthScore(c, stages, { now: NOW });
  assert.strictEqual(health.total, 100);
}

assert.strictEqual(statusFromScore(80), 'healthy');
assert.strictEqual(statusFromScore(79), 'attention');
assert.strictEqual(statusFromScore(50), 'attention');
assert.strictEqual(statusFromScore(49), 'high');

console.log('Health Score: todos os testes passaram.');
