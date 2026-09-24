# MVP funcional local — Jornada360

A etapa visual no Figma permanece planejada para o encerramento. O projeto está sendo validado primeiro como produto funcional local, sem integrações externas.

## Implementado no protótipo
- dashboard profissional CX/CS;
- carteira de clientes fictícios com busca e filtro;
- Cliente 360º;
- Journey Health Score explicável;
- Central de Prioridades;
- Voz do Cliente com métricas demonstrativas;
- visão mobile do cliente;
- CSAT demonstrativo;
- mensagens explícitas separando saúde da jornada de risco de crédito.

## Evolução funcional — persistência e acompanhamento

A versão atual acrescenta quatro capacidades ao MVP:

### 1. Persistência local demonstrativa
Os dados de acompanhamento passam a ser mantidos em `localStorage`.

Isso permite:
- alterar a jornada;
- registrar interações;
- incluir observações;
- atualizar checklist documental;
- fechar e reabrir o navegador sem perder as alterações da demonstração.

A persistência é exclusivamente local e não substitui banco de dados, autenticação ou infraestrutura de produção.

### 2. Cliente 360º interativo
A tela Cliente 360º agora permite:
- registrar nova interação;
- escolher o canal do contato;
- adicionar observação interna;
- alterar etapa da jornada;
- atualizar a próxima ação;
- visualizar histórico recente.

### 3. Checklist documental
Cada cliente pode possuir itens documentais fictícios com:
- nome do item;
- status: pendente, recebido, em conferência ou concluído;
- data de solicitação;
- data da última atualização;
- orientação ao cliente.

Também é possível adicionar um novo item documental fictício.

Nenhum arquivo, CPF, comprovante real ou dado financeiro deve ser inserido.

### 4. Timeline da jornada
A timeline reúne automaticamente:
- mudança de etapa;
- interação;
- atualização documental;
- observação.

O objetivo é demonstrar rastreabilidade da experiência e continuidade do acompanhamento.

## Decisões mantidas
- sem autenticação real;
- sem documentos pessoais reais;
- sem integração bancária;
- sem WhatsApp/SMS/e-mail real;
- sem decisão financeira automatizada;
- sem uso de Health Score como risco de crédito;
- IA permanece planejada apenas como apoio.

## Limite desta versão
O Journey Health Score continua demonstrativo e ainda não é recalculado automaticamente.

As métricas agregadas de dashboard, Central de Prioridades, CSAT e NPS também permanecem demonstrativas nesta etapa.

Esses itens serão evoluídos separadamente para evitar misturar rastreabilidade da jornada com lógica de pontuação.

## Execução
Abrir `app/index.html` em navegador moderno.

Não requer instalação, conta, servidor ou serviço externo.

## Teste rápido recomendado
1. abrir **Clientes**;
2. escolher um cliente;
3. registrar uma interação;
4. atualizar a etapa ou próxima ação;
5. alterar um item do checklist documental;
6. verificar os novos registros na timeline;
7. atualizar a página do navegador;
8. confirmar que as alterações permanecem;
9. usar **Restaurar demonstração** para voltar à massa fictícia inicial.

## Próximas etapas
1. cálculo automático e explicável do Journey Health Score;
2. Central de Prioridades baseada nas regras reais da jornada;
3. CSAT/NPS funcionais;
4. dashboard alimentado pelos próprios dados;
5. testes funcionais e de acessibilidade;
6. acabamento visual/Figma e case final.

## Correção de usabilidade da jornada

Após o primeiro teste manual do Cliente 360º, a visualização da jornada foi ajustada para evitar confusão entre posição atual e histórico.

A interface agora apresenta:
- progresso real calculado pela etapa atual;
- indicador **Etapa X de 9** e percentual percorrido;
- barra visual de progresso;
- legenda clara para **Concluída**, **Atual** e **Próxima**;
- etapas organizadas em grade, sem uma barra de rolagem que possa ser confundida com progresso;
- timeline distinguindo **avanço de etapa** e **retorno de etapa**;
- migração visual de registros anteriores do navegador para retirar a expressão ambígua “Etapa atual” de eventos históricos;
- progresso dinâmico também na visão mobile do cliente.

O retorno para uma etapa anterior não apaga eventos anteriores. Isso é intencional para preservar a rastreabilidade da jornada.

## Journey Health Score automático

O Journey Health Score deixou de ser um número fixo da massa demonstrativa e passou a ser recalculado a partir do estado atual da jornada.

São considerados:
- evolução da etapa;
- situação documental;
- antiguidade de pendências;
- tempo desde a última interação;
- tempo desde a última atualização da jornada;
- satisfação, quando disponível.

O Cliente 360º mostra a decomposição da pontuação e os fatores que exigem atenção.

A ausência de pesquisa de satisfação recebe valor neutro e não gera alerta isoladamente.

O indicador continua estritamente separado de análise de crédito, elegibilidade e decisão financeira.
