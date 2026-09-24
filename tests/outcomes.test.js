const assert = require('assert');
const Analytics = require('../app/analytics.js');
const Priorities = require('../app/priorities.js');

const stages = [
  'Necessidade','Primeiro atendimento','Diagnóstico','Documentação','Análise',
  'Retorno da instituição','Preparação para contrato','Contratação','Pós-atendimento'
];

const NOW = new Date('2026-09-24T15:00:00Z').getTime();
const ago = d => new Date(NOW - d * 86400000).toISOString();

function base(id, name, outcomeStatus, stage, status) {
  return {
    id, name, outcomeStatus, stage, status,
    next:'Acompanhar',
    documents:[],
    interactions:[{occurredAt:ago(2)}],
    timeline:[{type:'stage',occurredAt:ago(2)}],
    surveys:[]
  };
}

const clients = [
  base('a','Ativo saudável','active','Diagnóstico','healthy'),
  base('b','Ativo atenção','active','Documentação','attention'),
  base('c','Concluído','completed','Pós-atendimento','healthy'),
  {...base('d','Interrompido','interrupted','Análise','high'), interruptionReason:'Jornada encerrada pelo cliente.'}
];

const outcomes = Analytics.outcomeMetrics(clients);
assert.deepStrictEqual(outcomes, {
  total:4,
  active:2,
  completed:1,
  interrupted:1,
  closed:2,
  completionRate:50,
  interruptionRate:50
});

const portfolio = Analytics.portfolioMetrics(clients);
assert.strictEqual(portfolio.active, 2);
assert.strictEqual(portfolio.healthy, 1);
assert.strictEqual(portfolio.attention, 1);
assert.strictEqual(portfolio.high, 0);

assert.strictEqual(Analytics.normalizedOutcome({stage:'Pós-atendimento'}), 'completed');
assert.strictEqual(Analytics.normalizedOutcome({stage:'Análise'}), 'active');

const priorities = Priorities.buildPriorityList(clients, stages, {now:NOW});
assert.strictEqual(priorities.length, 2);
assert.ok(priorities.every(item => ['a','b'].includes(item.clientId)));

console.log('Desfechos da jornada: todos os testes passaram.');
