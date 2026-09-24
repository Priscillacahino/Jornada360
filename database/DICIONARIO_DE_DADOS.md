# Dicionário de dados — MVP

| Entidade | Campo principal | Finalidade |
|---|---|---|
| customers | display_name | Identificação fictícia na demonstração |
| journeys | current_stage_id | Etapa atual da jornada |
| stage_history | entered_at/exited_at | Histórico de evolução |
| documents | status / guidance / updated_at | Controle documental e orientação |
| pending_items | customer_action/status | Pendência e ação esperada |
| interactions | channel / summary / occurred_at | Histórico de relacionamento |
| notes | text / created_at | Observações internas de acompanhamento |
| tasks | due_at/status | Próximas ações |
| survey_responses | survey_type/score | CSAT/NPS |
| voc_items | category/text | Voz do Cliente |
| health_score_snapshots | total_score/reasons | Saúde explicável da jornada |
| audit_events | event_type/occurred_at | Rastreabilidade demonstrativa |

## Status documental usados no MVP
- `pending`: pendente;
- `received`: recebido;
- `review`: em conferência;
- `resolved`: concluído.

## Persistência local
O MVP funcional usa `localStorage` somente para demonstrar continuidade do acompanhamento entre recargas do navegador.

Não devem ser inseridos dados reais de clientes, documentos pessoais, renda, CPF, endereço ou informações financeiras.
