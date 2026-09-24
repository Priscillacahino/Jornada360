# Dashboard e Voz do Cliente funcionais — v6

## Objetivo
Retirar os indicadores fixos restantes do MVP e conectar Dashboard, Voz do Cliente, pesquisas e Health Score à mesma massa de dados local.

## Dashboard
Calcula automaticamente:
- total de clientes;
- jornadas saudáveis;
- jornadas em atenção;
- jornadas que necessitam acompanhamento;
- distribuição por etapa;
- prioridades do dia;
- principal fator de atrito;
- resumo de CSAT/NPS.

## CSAT
Escala de 1 a 5, disponível na visão mobile. A resposta mais recente do cliente compõe o fator **Satisfação** do Journey Health Score.

## NPS
Escala de 0 a 10, disponibilizada no pós-atendimento. O cálculo agregado segue: `% promotores - % detratores`, com 9–10 como promotores, 7–8 neutros e 0–6 detratores.

## Voz do Cliente
Comentários opcionais de CSAT/NPS são exibidos na tela de Voz do Cliente. Todos os dados da demonstração são fictícios e ficam no navegador.

## Atritos
Os atritos são derivados dos fatores de atenção do Journey Health Score. Isso mantém uma única fonte de lógica para Dashboard, Cliente 360º e Central de Prioridades.

## Acessibilidade
A v6 adiciona foco visível, link de salto para conteúdo, estados ARIA nos botões de pesquisa, região `aria-live` e respeito a `prefers-reduced-motion`.

## Testes
`npm test` executa Health Score, Central de Prioridades e analytics. O workflow `.github/workflows/tests.yml` repete a validação em pushes e pull requests da branch `main`.
