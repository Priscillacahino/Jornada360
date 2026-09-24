# Jornada360

**Customer Experience aplicado à jornada de financiamento habitacional**

Projeto independente e demonstrativo de portfólio, criado a partir da minha experiência profissional no acompanhamento da jornada de financiamento habitacional e reinterpretado sob a perspectiva de Customer Experience (CX), Customer Success (CS) e tecnologia.

> Este projeto não representa, não integra e não possui vínculo institucional com a CAIXA ou qualquer outra instituição financeira. Todos os dados utilizados serão fictícios.

## Da minha trajetória profissional ao Jornada360

O projeto nasceu da minha vivência no setor financeiro. Durante minha atuação, acompanhei clientes desde o primeiro atendimento e entendimento da necessidade, passando por orientação e conferência documental, análise de crédito e risco dentro das atribuições da função, acompanhamento de retornos e pendências e preparação do processo para contratação.

Ao revisitar essa trajetória, percebi que existia uma jornada de experiência acontecendo paralelamente à operação: expectativa, dúvidas, espera, necessidade de informação, confiança e acompanhamento. O Jornada360 transforma esse aprendizado em um estudo de caso de CX/CS apoiado por tecnologia.

**A experiência profissional que originou o problema é real. Os clientes, nomes, documentos, indicadores, pontuações, comentários e registros usados na demonstração são fictícios.** O projeto não reproduz sistemas, bases de dados, critérios proprietários ou processos internos de nenhuma instituição financeira.

## Problema

A jornada de financiamento habitacional envolve várias etapas, documentos, períodos de espera e interações. Para o cliente, isso pode gerar dúvidas sobre o andamento, pendências e próximos passos. Para o profissional, acompanhar vários processos simultaneamente exige organização e priorização.

## Proposta

O Jornada360 organiza a jornada desde o primeiro atendimento até o pós-contratação, oferecendo duas perspectivas:

- **Cliente:** acompanha etapas, pendências, documentos e orientações.
- **Profissional:** acompanha carteira, prioridades, histórico, saúde da jornada e indicadores de experiência.

## Objetivo de CX

Tornar a jornada mais clara, previsível e acompanhada, reduzindo incertezas e facilitando a comunicação.

## Objetivo de Customer Success

Acompanhar proativamente a evolução de cada cliente e identificar sinais de paralisação ou abandono antes que a jornada seja interrompida.

## Jornada macro

Necessidade → Primeiro atendimento → Diagnóstico inicial → Documentação → Análise → Retorno da instituição → Preparação para contratação → Contratação → Pós-atendimento

## MVP planejado

1. Login demonstrativo
2. Dashboard do profissional
3. Carteira de clientes
4. Cliente 360º
5. Checklist documental
6. Jornada/status
7. Central de prioridades
8. Journey Health Score
9. Pesquisa CSAT/NPS
10. Dashboard CX

## Indicadores previstos

- Journey Health Score
- CSAT
- NPS
- tempo médio por etapa
- processos sem interação
- pendências por categoria
- taxa de conclusão da jornada
- taxa de interrupção/abandono
- principais pontos de atrito

## Limites do projeto

- não realiza aprovação de crédito;
- não substitui análise de instituição financeira;
- não promete concessão de financiamento;
- não utiliza dados reais de clientes;
- não reproduz critérios proprietários de instituições financeiras;
- IA, quando incorporada, será apenas ferramenta de apoio.

## Status

🟡 Em desenvolvimento — fundação e especificação concluídas; MVP funcional local em evolução.

A versão atual já possui **persistência local**, **Cliente 360º interativo**, **checklist documental**, **timeline**, **Journey Health Score automático**, **Central de Prioridades dinâmica**, **Dashboard calculado pela carteira**, **CSAT/NPS funcionais** e **registro de conclusão/interrupção da jornada**. O Figma permanece adiado para a etapa final de acabamento visual.

## Documentação já estruturada

- Fundação e escopo
- Jornada CX e momentos da verdade
- Requisitos e regras de negócio
- Journey Health Score v1 e v2
- Arquitetura de informação
- Personas e cenários
- Fluxos e casos de uso
- Métricas CX/CS e Voz do Cliente
- Diretrizes de privacidade/LGPD
- Customer Journey Map textual
- Wireframes textuais do MVP
- Esquema lógico de dados
- Plano de dados fictícios
- Backlog e roadmap
- Origem profissional e estudo de caso
- Service Blueprint
- Critérios de aceite do MVP
- Plano de testes e usabilidade
- Escopo seguro de IA
- Roteiro do case de portfólio
- Dicionário de dados
- Registro de decisões de produto

## MVP funcional local

A validação do produto acontece primeiro em uma aplicação web local, sem dependências externas.

Além das telas de Dashboard CX/CS, Carteira, Cliente 360º, Central de Prioridades, Voz do Cliente e experiência mobile, o MVP agora permite:

- salvar alterações localmente no navegador;
- registrar interações e observações;
- alterar a etapa da jornada e a próxima ação;
- acompanhar e atualizar itens documentais fictícios;
- visualizar uma timeline com o histórico da jornada.
- visualizar o progresso real da jornada por etapa e percentual;
- distinguir avanços e retornos de etapa na timeline;
- recalcular automaticamente o Journey Health Score e explicar seus fatores;
- priorizar automaticamente jornadas com motivo e próxima ação;
- calcular o Dashboard com os dados da própria carteira;
- registrar CSAT/NPS e comentários fictícios na visão do cliente;
- consolidar Voz do Cliente e atritos a partir dos registros locais;
- registrar situação da jornada como em andamento, concluída ou interrompida, com motivo demonstrativo quando aplicável;
- calcular taxas de conclusão e interrupção entre jornadas encerradas;
- classificar comentários fictícios da Voz do Cliente por tema;
- gerar sugestões demonstrativas de abordagem para acompanhamento, sem envio automático;
- executar testes automatizados por `npm test`;

O Journey Health Score já é recalculado automaticamente e exibe os fatores que compõem a pontuação. A Central de Prioridades, o Dashboard e a Voz do Cliente já usam os dados do próprio MVP. CSAT e NPS podem ser registrados na visão mobile e permanecem salvos localmente. A massa demonstrativa foi ampliada para 24 clientes fictícios, incluindo jornadas concluídas e interrompidas para validar os indicadores de desfecho. A suíte automatizada cobre Health Score, prioridades, analytics, desfechos e verificações de qualidade/acessibilidade.

O Figma será retomado apenas no acabamento final, após os fluxos e regras estarem consolidados.

## Testes automatizados

Na raiz do projeto, execute `npm test`. O repositório também inclui um workflow do GitHub Actions para validar as regras principais a cada push ou pull request para `main`.

## Qualidade e segurança do MVP

A versão atual inclui verificações automatizadas para confirmar:
- uso exclusivo de massa demonstrativa fictícia;
- ausência de campos pessoais/sensíveis na massa padrão;
- mensagens explícitas separando CX/CS de decisão financeira;
- carregamento local dos scripts e estilos do MVP;
- recursos básicos de acessibilidade, como `skip link`, foco visível, ARIA e redução de movimento;
- comportamento de jornadas ativas, concluídas e interrompidas.

A validação automatizada pode ser executada com `npm test`.
