# Journey Health Score — Versão 2

## Objetivo
Priorizar acompanhamento de CX/CS. Não mede risco de crédito, capacidade financeira, elegibilidade ou chance de aprovação.

## Pontuação implementada — 100 pontos

### 1. Evolução da jornada — até 25
A referência é a última mudança registrada de etapa.

- etapa final alcançada: 25;
- mudança de etapa há até 7 dias: 25;
- 8 a 14 dias sem avanço: 18;
- 15 a 21 dias sem avanço: 10;
- mais de 21 dias sem avanço: 0;
- sem histórico suficiente: 10.

### 2. Situação documental — até 20
- antes da etapa documental e sem documentos esperados: 20;
- todos os itens registrados concluídos: 20;
- uma pendência documental ativa: 14;
- múltiplas pendências documentais: 7;
- etapa documental ou posterior sem nenhum item registrado: 0.

### 3. Pendências — até 20
A referência é a pendência documental ativa mais antiga.

- nenhuma pendência ativa: 20;
- pendência de até 3 dias: 14;
- pendência de 4 a 7 dias: 7;
- pendência acima de 7 dias: 0;
- pendência sem data suficiente: 7.

### 4. Interação / engajamento — até 15
A referência é a última interação registrada.

- até 2 dias: 15;
- 3 a 7 dias: 11;
- 8 a 14 dias: 6;
- acima de 14 dias ou nenhuma interação: 0.

### 5. Atualização da jornada — até 10
A referência é o evento mais recente da timeline.

- até 3 dias: 10;
- 4 a 7 dias: 6;
- 8 a 14 dias: 2;
- acima de 14 dias ou sem atualização: 0.

### 6. Satisfação — até 10
- positiva: 10;
- neutra: 6;
- negativa: 2;
- ainda não coletada: 5.

A ausência de pesquisa é tratada como neutra e não gera alerta por si só.

## Faixas
- 80–100: Saudável
- 50–79: Atenção
- 0–49: Necessita acompanhamento

## Comportamento do MVP
O score é recalculado automaticamente:
- ao carregar a aplicação;
- ao registrar interação;
- ao alterar etapa ou próxima ação;
- ao atualizar/adicionar item documental;
- ao salvar alterações locais;
- ao abrir Carteira, Dashboard ou Prioridades.

A mudança do score também atualiza a faixa visual do cliente.

## Transparência
O Cliente 360º exibe os seis componentes, a pontuação obtida em cada um e uma explicação em linguagem simples.

Fatores em atenção ou críticos são apresentados separadamente.

## Segurança
O Journey Health Score mede a saúde da jornada e do acompanhamento.

Não utiliza:
- renda;
- idade;
- gênero;
- endereço;
- raça;
- religião;
- saúde;
- atributos pessoais sensíveis;
- critérios de aprovação de crédito.

O indicador não representa risco financeiro, elegibilidade ou probabilidade de aprovação.
