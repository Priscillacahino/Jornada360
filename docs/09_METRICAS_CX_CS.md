# Métricas CX/CS — Jornada360

## Métricas principais

### CSAT
Mede satisfação com momentos específicos, como atendimento ou resolução de pendência. No MVP, usa escala de 1 a 5 e pode ser atualizado na visão mobile do cliente.

### NPS
Utilizado no pós-atendimento para registrar disposição declarada de recomendação da experiência, em escala de 0 a 10. No MVP, o NPS é calculado como percentual de promotores menos percentual de detratores.

### Taxa de conclusão da jornada
Percentual de jornadas concluídas entre as jornadas encerradas.

### Taxa de interrupção
Percentual de jornadas interrompidas entre as jornadas encerradas.

No MVP, jornadas em andamento não entram no denominador dessas duas taxas.

### Tempo sem interação
Apoia acompanhamento proativo e a Central de Prioridades.

### Atritos da carteira
São consolidados a partir dos fatores de atenção do Journey Health Score. O percentual indica quantos clientes da carteira possuem cada fator.

## Voz do Cliente
Comentários de CSAT/NPS são armazenados apenas localmente e são fictícios. A classificação futura por tema permanece como possibilidade de apoio, não como decisão financeira.

## Implementação do MVP
As métricas deixam de ser números fixos e passam a ser calculadas a partir do estado atual da massa fictícia em `localStorage`.

## Regra implementada para conclusão e interrupção

O MVP diferencia três estados:
- `active`: jornada em andamento;
- `completed`: jornada concluída;
- `interrupted`: jornada interrompida.

As taxas usam somente jornadas encerradas como denominador:

**Taxa de conclusão = concluídas / (concluídas + interrompidas)**

**Taxa de interrupção = interrompidas / (concluídas + interrompidas)**
