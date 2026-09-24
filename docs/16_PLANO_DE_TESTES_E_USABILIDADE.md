# Plano de testes — Jornada360

## Testes funcionais
1. Navegar entre Dashboard, Clientes, Prioridades, Voz do Cliente e visão do cliente.
2. Buscar cliente existente e inexistente.
3. Filtrar por Saudável, Atenção e Acompanhamento.
4. Abrir Cliente 360º e conferir etapa, score, pendência e próxima ação.
5. Confirmar que prioridades exibem motivo e ação.
6. Conferir responsividade em celular, tablet e desktop.
7. Registrar uma interação e confirmar que o Health Score é recalculado.
8. Atualizar um documento e confirmar mudança nos componentes documental/pendências.
9. Alterar etapa e confirmar recálculo do componente de evolução.
10. Recarregar a página e confirmar persistência dos dados e novo score.

## Testes automatizados do Health Score
Executar na raiz do projeto:

`node tests/health-score.test.js`

Cenários cobertos:
- jornada saudável;
- atenção;
- acompanhamento;
- ausência de pesquisa como valor neutro;
- satisfação positiva;
- faixas de classificação.

## Testes de conteúdo
- Evitar linguagem que prometa aprovação.
- Evitar chamar Journey Health Score de score financeiro.
- Garantir que “análise” não seja descrita como decisão automatizada.
- Conferir que todos os nomes e comentários sejam fictícios.
- Confirmar que fatores do Health Score sejam explicáveis.

## Teste de usabilidade proposto
Tarefas para participante: localizar a etapa de Mariana; dizer se ela precisa agir; identificar o próximo passo; localizar quem precisa de acompanhamento; explicar por que um cliente foi priorizado; explicar por que o Health Score aumentou ou diminuiu.

### Critério de sucesso
O participante deve completar as tarefas sem explicação externa e sem confundir saúde da jornada com risco de crédito.

## Acessibilidade
- navegação por teclado;
- foco visível;
- contraste adequado;
- labels em campos;
- hierarquia de títulos;
- não depender apenas de cor para status;
- textos compreensíveis em zoom de 200%.

## Central de Prioridades dinâmica

Testes manuais:
1. abrir **Prioridades**;
2. confirmar que Acompanhamento aparece antes de Atenção e Saudável;
3. conferir motivo principal e próxima ação;
4. abrir os fatores explicativos;
5. testar busca por nome;
6. testar cada filtro;
7. usar **Abrir Cliente 360º**;
8. alterar interação/documento de um cliente e conferir se a prioridade muda após o recálculo.

Teste automatizado:

`node tests/priorities.test.js`

O teste valida ordenação, motivo explicável, métricas e contagem de jornadas que precisam de ação.



## Dashboard, CSAT/NPS e analytics

Testes manuais adicionais:
1. confirmar que os quatro indicadores da Visão Geral mudam conforme a carteira;
2. conferir distribuição por etapa;
3. validar o insight CX e o principal atrito;
4. na Visão do cliente, selecionar um cliente fictício e salvar CSAT;
5. selecionar um cliente em Pós-atendimento e salvar NPS;
6. abrir Voz do Cliente e confirmar atualização de métricas e comentários;
7. recarregar a página e confirmar persistência das pesquisas;
8. navegar por teclado e verificar foco visível.

Teste consolidado: `npm test`.
