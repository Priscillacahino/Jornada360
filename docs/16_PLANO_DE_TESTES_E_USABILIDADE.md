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
