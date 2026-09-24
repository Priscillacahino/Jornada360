# Privacidade, segurança e LGPD — diretrizes do protótipo

## Escopo demonstrativo
O projeto utilizará somente dados fictícios. Não haverá documentos pessoais reais nem integração com instituição financeira.

## Princípios adotados
- minimização de dados;
- finalidade clara;
- separação de acesso por perfil;
- transparência sobre uso das informações;
- retenção apenas do necessário no ambiente demonstrativo;
- histórico de eventos relevantes;
- não exposição de dados pessoais em indicadores agregados.

## Perfis
### Cliente
Acessa somente a própria jornada demonstrativa.

### Profissional
Acessa a carteira necessária ao acompanhamento.

### Gestão CX
Prioriza indicadores agregados; dados individualizados só aparecem quando necessários à operação demonstrativa.

## Dados que não serão usados no protótipo
- documentos oficiais reais;
- senhas bancárias;
- dados de cartão;
- biometria;
- consultas reais a crédito;
- informações de antigos clientes;
- critérios proprietários de instituições.

## Avisos de interface
Toda simulação deve informar que é demonstrativa e não representa proposta, aprovação ou decisão de instituição financeira.

## Persistência local e limites

O MVP utiliza `localStorage` apenas para preservar alterações demonstrativas no navegador.

Isso significa que:
- não há autenticação real;
- não há criptografia de banco de dados;
- não há sincronização entre dispositivos;
- não há recuperação de senha;
- não há armazenamento de documentos reais;
- limpar os dados do navegador pode apagar as alterações locais.

Por esse motivo, a versão de portfólio deve permanecer restrita a dados fictícios.

## Desfechos da jornada

O estado **Interrompida** registra somente um motivo demonstrativo de interrupção. Esse campo não deve receber dados sensíveis, justificativas médicas, dados financeiros ou informações pessoais desnecessárias.

A taxa de interrupção é um indicador de experiência/processo e não deve ser usada para inferir risco de crédito ou elegibilidade.
