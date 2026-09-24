# Jornada360

**Customer Experience e Customer Success aplicados à jornada de financiamento habitacional**

Projeto independente e demonstrativo de portfólio, criado a partir de experiência profissional real no acompanhamento da jornada habitacional e reinterpretado sob a perspectiva de **CX, CS, operações, processos e tecnologia**.

> O Jornada360 não representa, não integra e não possui vínculo institucional com a CAIXA ou qualquer outra instituição financeira. Todos os clientes, nomes, documentos, métricas, pontuações, comentários e registros do MVP são fictícios.

## O problema

Uma jornada de financiamento envolve etapas, documentos, períodos de espera e diversos contatos. Mesmo quando a operação está em andamento, o cliente pode perceber falta de clareza sobre:

- em que etapa está;
- se precisa fazer algo;
- o que está pendente;
- qual será o próximo passo;
- quando receberá uma nova atualização.

Para quem acompanha várias jornadas ao mesmo tempo, também existe o desafio de organizar histórico, priorizar contatos e identificar pontos de atrito.

## A proposta

O Jornada360 organiza a experiência em duas perspectivas:

**Profissional de CX/CS**
- Dashboard calculado com a própria carteira;
- carteira de clientes fictícios;
- Cliente 360º;
- Journey Health Score automático e explicável;
- Central de Prioridades;
- checklist documental;
- timeline;
- Voz do Cliente;
- CSAT e NPS;
- conclusão e interrupção da jornada.

**Cliente**
- etapa atual;
- progresso da jornada;
- ação necessária;
- próximo passo;
- pesquisa de satisfação.

## Pergunta de projeto

**Como transformar uma jornada operacional complexa em uma experiência mais clara, acompanhável e orientada ao próximo passo?**

## Jornada macro

Necessidade → Primeiro atendimento → Diagnóstico → Documentação → Análise → Retorno da instituição → Preparação para contrato → Contratação → Pós-atendimento

## O que já está funcional

O MVP local possui:

- persistência em `localStorage`;
- 24 clientes fictícios na massa demonstrativa;
- busca e filtros;
- Cliente 360º interativo;
- registro de interações e observações;
- atualização de etapa e próxima ação;
- checklist documental;
- timeline automática;
- progresso visual da jornada;
- Journey Health Score programático e explicável;
- Central de Prioridades dinâmica;
- sugestões demonstrativas de abordagem, sem envio automático;
- Dashboard alimentado pelos próprios dados;
- CSAT e NPS funcionais;
- classificação determinística de comentários da Voz do Cliente;
- registro de jornadas concluídas e interrompidas;
- taxas de conclusão e interrupção;
- tela **Sobre o case** para apresentação do projeto;
- acessibilidade básica e responsividade;
- testes automatizados executados por `npm test`;
- workflow do GitHub Actions.

## Journey Health Score

O Health Score mede **saúde da jornada de acompanhamento**, considerando evolução, situação documental, pendências, interação, atualização da jornada e satisfação.

Ele **não é score de crédito**, não estima risco financeiro, não determina elegibilidade e não participa de aprovação ou reprovação.

## Central de Prioridades

A Central usa fatores do próprio Health Score para organizar jornadas ativas que precisam de acompanhamento. Cada sinalização apresenta motivo e próxima ação, mantendo a decisão com o profissional.

## Voz do Cliente

CSAT, NPS e comentários fictícios ajudam a demonstrar como feedback pode ser transformado em aprendizado de CX. Os comentários são agrupados por temas simples e transparentes, sem uso de IA externa.

## Privacidade e limites

O projeto:

- não realiza aprovação de crédito;
- não substitui análise de instituição financeira;
- não promete concessão de financiamento;
- não utiliza dados reais de clientes;
- não armazena CPF, RG, renda, endereço, biometria ou documentos pessoais reais;
- não reproduz critérios proprietários de instituições financeiras;
- não envia mensagens automaticamente;
- mantém qualquer apoio automatizado restrito a CX/CS.

## Tecnologias

- HTML
- CSS
- JavaScript
- `localStorage`
- Node.js para testes
- Git/GitHub
- GitHub Actions

## Como executar

Abra `app/index.html` no navegador.

Para executar os testes:

```bash
npm test
```

## Estrutura principal

```text
app/        aplicação local
tests/      testes automatizados
docs/       documentação de produto, CX/CS, qualidade e portfólio
database/   modelo lógico e dicionário de dados
.github/    validação automática
```

## Status

**MVP funcional local concluído.**

O que ainda depende de validação externa ou acabamento:
- teste de usabilidade com participantes;
- revisão visual final/Figma;
- capturas definitivas do case;
- publicação web.

## Origem do case

A experiência profissional que inspirou o problema é real. A solução foi desenvolvida como um projeto independente de estudo e portfólio para demonstrar a transformação de conhecimento de negócio em uma proposta de CX/CS apoiada por tecnologia.

## Documentação de portfólio

Consulte:
- `docs/18_ROTEIRO_CASE_PORTFOLIO.md`
- `docs/23_ROTEIRO_TESTE_USABILIDADE.md`
- `docs/24_CHECKLIST_PUBLICACAO_PORTFOLIO.md`
- `docs/26_GUIA_DEMONSTRACAO_PORTFOLIO.md`
- `docs/27_CAPTURAS_FINAIS_RECOMENDADAS.md`

---

**Projeto de portfólio desenvolvido por Priscilla Cahino.**
