# Dicionário de dados — MVP

| Entidade | Campo principal | Finalidade |
|---|---|---|
| customers | display_name | Identificação fictícia na demonstração |
| journeys | current_stage_id | Etapa atual da jornada |
| stage_history | entered_at/exited_at | Histórico de evolução |
| documents | status | Controle documental |
| pending_items | customer_action/status | Pendência e ação esperada |
| interactions | summary/occurred_at | Histórico de relacionamento |
| tasks | due_at/status | Próximas ações |
| survey_responses | survey_type/score | CSAT/NPS |
| voc_items | category/text | Voz do Cliente |
| health_score_snapshots | total_score/reasons | Saúde explicável da jornada |
| audit_events | event_type/occurred_at | Rastreabilidade demonstrativa |

Dados financeiros e atributos sensíveis não são necessários para o objetivo do MVP de CX/CS.
