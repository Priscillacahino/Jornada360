const assert = require('assert');
const Analytics = require('../app/analytics.js');

const stages = [
  'Necessidade','Primeiro atendimento','Diagnóstico','Documentação','Análise',
  'Retorno da instituição','Preparação para contrato','Contratação','Pós-atendimento'
];
const NOW = new Date('2026-09-24T15:00:00Z').getTime();
const ago = d => new Date(NOW - d * 86400000).toISOString();

const clients = [
  {
    id:'a',name:'A',stage:'Pós-atendimento',status:'healthy',
    documents:[{status:'resolved',requestedAt:ago(4),updatedAt:ago(1)}],
    interactions:[{occurredAt:ago(1)}],timeline:[{type:'stage-forward',occurredAt:ago(1)}],
    surveys:[
      {type:'csat',score:5,comment:'Muito claro',answeredAt:ago(0)},
      {type:'nps',score:10,comment:'Recomendaria',answeredAt:ago(0)}
    ]
  },
  {
    id:'b',name:'B',stage:'Documentação',status:'attention',
    documents:[{status:'pending',requestedAt:ago(5),updatedAt:ago(5)}],
    interactions:[{occurredAt:ago(3)}],timeline:[{type:'stage',occurredAt:ago(3)}],
    surveys:[{type:'csat',score:3,comment:'Poderia atualizar mais',answeredAt:ago(2)}]
  },
  {
    id:'c',name:'C',stage:'Análise',status:'high',
    documents:[{status:'pending',requestedAt:ago(12),updatedAt:ago(12)}],
    interactions:[{occurredAt:ago(18)}],timeline:[{type:'stage',occurredAt:ago(24)}],
    surveys:[{type:'nps',score:4,answeredAt:ago(4)}]
  }
];

const portfolio = Analytics.portfolioMetrics(clients);
assert.deepStrictEqual(portfolio, {
  total:3,
  active:2,
  completed:1,
  interrupted:0,
  healthy:0,
  attention:1,
  high:1
});

const survey = Analytics.surveyMetrics(clients);
assert.strictEqual(survey.csatAverage, 4);
assert.strictEqual(survey.csatCount, 2);
assert.strictEqual(survey.npsCount, 2);
assert.strictEqual(survey.nps, 0);
assert.strictEqual(survey.completionRate, 100);
assert.strictEqual(survey.interruptionRate, 0);
assert.strictEqual(survey.totalResponses, 4);

const dist = Analytics.stageDistribution(clients, stages);
assert.strictEqual(dist.find(x => x.stage === 'Pós-atendimento').count, 0);
assert.strictEqual(dist.reduce((sum,x)=>sum+x.count,0), 2);

const comments = Analytics.recentComments(clients, 5);
assert.strictEqual(comments.length, 3);
assert.strictEqual(comments[0].clientName, 'A');


assert.strictEqual(Analytics.classifyVocComment('Tive dificuldade com o documento solicitado.'), 'Dificuldade documental');
assert.strictEqual(Analytics.classifyVocComment('Queria receber atualização do status.'), 'Comunicação / status');
assert.strictEqual(Analytics.classifyVocComment('A espera demorou bastante.'), 'Tempo de espera');

const themes = Analytics.vocThemeMetrics(clients);
assert.ok(themes.length >= 2);
assert.strictEqual(themes.reduce((sum,item)=>sum+item.count,0), 3);

const frictions = Analytics.frictionMetrics(clients, stages, { now: NOW });
assert.ok(frictions.length > 0);
assert.ok(frictions[0].affected >= 1);

const insight = Analytics.buildPortfolioInsight(clients, stages, { now: NOW });
assert.ok(insight.title);
assert.ok(insight.summary);
assert.ok(insight.action);

console.log('Analytics e Voz do Cliente: todos os testes passaram.');
