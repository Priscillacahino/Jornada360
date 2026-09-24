# Esquema lógico v1 — Jornada360

## users
id, name, role, email_demo, active

## customers
id, display_name, created_at, status

## journeys
id, customer_id, current_stage_id, progress_percent, started_at, ended_at, outcome_status

## journey_stages
id, code, label, sequence, customer_description

## stage_history
id, journey_id, stage_id, entered_at, exited_at

## documents
id, journey_id, category, label, status, requested_at, updated_at, resolved_at, guidance

## pending_items
id, journey_id, category, description, customer_action, status, opened_at, resolved_at, priority

## interactions
id, journey_id, channel, direction, summary, occurred_at, user_id

## notes
id, journey_id, text, created_at, user_id

## tasks
id, journey_id, title, due_at, status, assigned_user_id

## survey_responses
id, journey_id, survey_type, score, comment, answered_at

## voc_items
id, journey_id, category, sentiment_demo, text, created_at

## health_score_snapshots
id, journey_id, total_score, journey_score, document_score, pending_score, interaction_score, freshness_score, satisfaction_score, reasons, calculated_at

## audit_events
id, actor_user_id, event_type, entity_type, entity_id, occurred_at

## Relacionamentos centrais
customer 1:N journeys

journey 1:N documents/pending_items/interactions/notes/tasks/surveys/health_snapshots

journey N:1 current_stage

## Mapeamento do MVP local v6

Na versão local demonstrativa, `localStorage` representa temporariamente uma estrutura agregada por cliente contendo:
- jornada atual;
- interações;
- documentos;
- observações;
- respostas CSAT/NPS;
- eventos de timeline.

Essa estrutura é deliberadamente simples para a demonstração e preserva a correspondência conceitual com o esquema lógico acima. Não é banco de dados de produção.
