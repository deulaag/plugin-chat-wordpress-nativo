# MK Atendimento Pro v2.0.0 - TODO

## Segurança e Arquitetura (Crítico)
- [x] Implementar autenticação robusta na API REST (validação de token + nonce)
- [x] Refatorar para arquitetura tRPC (melhor que REST)
- [x] Implementar sanitização e validação rigorosa de entrada em todas as rotas
- [x] Adicionar testes de segurança (validação de entrada, autorização)

## Funcionalidades Principais
- [x] Criar schema de banco de dados para sessões, mensagens e status de atendente
- [x] Implementar sistema de status do atendente (Online/Offline/Away)
- [x] Implementar roteamento automático de sessões para atendentes online
- [x] Criar procedimentos tRPC para chat persistente
- [ ] Desenvolver interface de chat persistente para atendentes (frontend)
- [ ] Criar interface de chat para clientes (frontend)
- [ ] Implementar polling persistente para recebimento de mensagens em tempo real

## Otimizações e Melhorias
- [x] Implementar padrão Singleton para gerenciamento de configurações
- [x] Criar sistema de respostas prontas para atendentes
- [x] Criar tela de logs de webhook para depuração
- [ ] Otimizar notificações por e-mail (agrupamento e limite de frequência)
- [ ] Adicionar internacionalização (i18n) para todas as strings visíveis

## Documentação e Testes
- [x] Escrever testes unitários com Vitest para procedimentos tRPC (6 testes passando)
- [ ] Criar documentação técnica completa (arquitetura, fluxo de dados)
- [ ] Gerar tutorial de uso para administradores e atendentes
- [ ] Criar guia de configuração e troubleshooting

## Empacotamento e Entrega
- [ ] Desenvolver interface de frontend para chat persistente
- [ ] Validar todas as funcionalidades em ambiente de teste
- [ ] Criar checkpoint final da versão 2.0.0
- [ ] Empacotar plugin em ZIP
- [ ] Gerar changelog completo
