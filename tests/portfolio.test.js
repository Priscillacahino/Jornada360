const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const app = read('app/app.js');
const readme = read('README.md');
const status = read('STATUS_PROJETO.md');
const roadmap = read('docs/11_BACKLOG_E_ROADMAP.md');
const caseDoc = read('docs/18_ROTEIRO_CASE_PORTFOLIO.md');
const demo = read('docs/26_GUIA_DEMONSTRACAO_PORTFOLIO.md');
const captures = read('docs/27_CAPTURAS_FINAIS_RECOMENDADAS.md');
const pkg = JSON.parse(read('package.json'));

assert.strictEqual(pkg.version, '0.8.0');
assert.match(pkg.scripts.test, /portfolio\.test\.js/);

assert.match(app, /\['case', 'Sobre o case'\]/);
assert.match(app, /function caseView\(\)/);
assert.match(app, /MVP funcional local • dados 100% fictícios/);
assert.match(app, /case: caseView/);

assert.match(readme, /MVP funcional local concluído/i);
assert.match(readme, /Sobre o case/);
assert.match(readme, /24 clientes fictícios/i);
assert.match(status, /MVP funcional local — concluído/i);
assert.match(roadmap, /Portfólio \[preparada\]/i);

assert.match(caseDoc, /Pergunta de projeto/);
assert.match(caseDoc, /Minha contribuição/);
assert.match(demo, /3 a 5 minutos/i);
assert.match(captures, /Capturas principais/);

for (const file of [
  'docs/18_ROTEIRO_CASE_PORTFOLIO.md',
  'docs/26_GUIA_DEMONSTRACAO_PORTFOLIO.md',
  'docs/27_CAPTURAS_FINAIS_RECOMENDADAS.md',
  'CHANGELOG.md'
]) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} deve existir`);
}

console.log('Estrutura de portfólio: todos os testes passaram.');
