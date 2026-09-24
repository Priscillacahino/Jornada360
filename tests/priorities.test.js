const assert = require('assert');
const Priorities = require('../app/priorities.js');

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

function client(id, name, overrides = {}) {
  return {
    id,
    name,
    stage: 'Documentação',
    next: 'Realizar acompanhamento',
    documents: [],
    interactions: [],
    timeline: [],
    surveys: [],
    ...overrides
  };
}

const high = client('1', 'Cliente A', {
  stage: 'Análise',
  documents: [
    { status: 'pending', requestedAt: ago(12), updatedAt: ago(12) },
    { status: 'review', requestedAt: ago(14), updatedAt: ago(10) }
  ],
  interactions: [{ occurredAt: ago(18) }],
  timeline: [{ type: 'stage', occurredAt: ago(24) }]
});

const attention = client('2', 'Cliente B', {
  documents: [{ status: 'pending', requestedAt: ago(5), updatedAt: ago(5) }],
  interactions: [{ occurredAt: ago(3) }],
  timeline: [{ type: 'stage', occurredAt: ago(3) }]
});

const healthy = client('3', 'Cliente C', {
  stage: 'Pós-atendimento',
  documents: [{ status: 'resolved', requestedAt: ago(8), updatedAt: ago(1) }],
  interactions: [{ occurredAt: ago(1) }],
  timeline: [{ type: 'stage-forward', occurredAt: ago(1) }],
  surveys: [{ score: 5, answeredAt: ago(0) }]
});

const list = Priorities.buildPriorityList([healthy, attention, high], stages, { now: NOW });

assert.strictEqual(list[0].clientId, '1');
assert.strictEqual(list[0].status, 'high');
assert.ok(list[0].reasons.length > 0);
assert.ok(list[0].primaryFactor);
assert.strictEqual(list[1].clientId, '2');
assert.strictEqual(list[1].status, 'attention');
assert.strictEqual(list[2].clientId, '3');
assert.strictEqual(list[2].status, 'healthy');

const metrics = Priorities.priorityMetrics(list);
assert.strictEqual(metrics.high, 1);
assert.strictEqual(metrics.attention, 1);
assert.strictEqual(metrics.needsAction, 2);
assert.strictEqual(metrics.activeDocuments, 3);
assert.strictEqual(metrics.withoutInteraction, 1);

const item = Priorities.buildPriority(attention, stages, { now: NOW });
assert.strictEqual(item.nextAction, 'Realizar acompanhamento');
assert.ok(item.primaryReason.length > 0);

console.log('Central de Prioridades: todos os testes passaram.');
