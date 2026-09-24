const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const index = read('app/index.html');
const app = read('app/app.js');
const css = read('app/styles.css');
const readme = read('README.md');
const privacy = read('docs/10_PRIVACIDADE_SEGURANCA_LGPD.md');

assert.match(index, /<html lang="pt-BR">/);
assert.match(index, /name="description"/);
assert.match(index, /health-score\.js[\s\S]*priorities\.js[\s\S]*analytics\.js[\s\S]*app\.js/);

assert.match(app, /skip-link/);
assert.match(app, /id="main-content"/);
assert.match(app, /aria-label="Navegação principal"/);
assert.match(app, /aria-live="polite"/);
assert.match(app, /não representa score de crédito/i);
assert.match(app, /dados fictícios/i);
assert.match(app, /outcomeStatus/);
assert.match(app, /interruptionReason/);

assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /@media\(max-width:520px\)/);
assert.match(css, /@media print/);

const seedBlock = app.match(/const seedData = \[([\s\S]*?)\n\];/);
assert.ok(seedBlock, 'Massa fictícia seedData não encontrada.');
const names = [...seedBlock[1].matchAll(/name:'([^']+)'/g)].map(match => match[1]);
assert.strictEqual(names.length, 24, 'A massa padrão deve conter 24 clientes fictícios.');
assert.strictEqual(new Set(names).size, names.length, 'Os nomes fictícios da massa padrão devem ser únicos.');
assert.ok(/outcomeStatus:'interrupted'/.test(seedBlock[1]), 'A massa deve demonstrar ao menos uma jornada interrompida.');

const forbiddenSeedFields = /\b(cpf|rg|renda|salario|salário|idade|genero|gênero|religiao|religião|saude|saúde|biometria)\s*:/i;
assert.ok(!forbiddenSeedFields.test(seedBlock[1]), 'A massa demonstrativa contém campo pessoal/sensível não permitido.');

assert.match(readme, /não utiliza dados reais de clientes/i);
assert.match(readme, /não realiza aprovação de crédito/i);
assert.match(privacy, /somente dados fictícios/i);
assert.match(privacy, /minimização de dados/i);

const externalExecutable = /<(script|link)[^>]+(?:src|href)=["']https?:\/\//i;
assert.ok(!externalExecutable.test(index), 'O MVP local não deve depender de scripts ou estilos externos.');

console.log('Qualidade, acessibilidade e conteúdo seguro: todos os testes passaram.');
