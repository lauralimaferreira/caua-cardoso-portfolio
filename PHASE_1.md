# Fase 1 — revisão 2 (correção pós-auditoria)

Base: site versão 2.2, commit `185b2b3de2a0cb80452620d96040b83247c70d5e`. Este pacote substitui integralmente o ZIP anterior da Fase 1. Extraia na raiz da versão 2.2 (ou sobre a entrega anterior da Fase 1). Nenhum arquivo do portfólio público foi alterado.

## Alterações

- Limite de tentativas persistente por IPv4 ou prefixo IPv6 /64: 12 tentativas por 15 minutos, em vez de bloqueio global da conta. Origem normalizada e HMAC; nenhum IP bruto é salvo na tabela de rate limit. Migração idempotente 002 e limpeza periódica de registros antigos. O Railway precisa fornecer o X-Real-IP confiável; apenas tráfego pelo HTTP edge ou serviços privados confiáveis é permitido. Não use proxy TCP. Em desenvolvimento direto, cabeçalhos de proxy são ignorados. Uma rede compartilhada ainda pode sofrer bloqueio temporário e ataques distribuídos/saturação continuam riscos residuais.
- Dois logins simultâneos por processo no trecho de reserva/verificação da senha; recursos são liberados mesmo em erro. Retorno temporário 503 com Retry-After quando ocupado, em vez de bloqueio global duradouro.
- Lockfile com versões exatas e integridades, Dockerfile agora usa npm ci. Metadados públicos usados por indisponibilidade do registro; teste offline de resolução aprovado, instalação real ainda pendente.
- Testes de isolamento, cabeçalhos, normalização, concorrência e capacidade; integração PostgreSQL ampliada para múltiplas conexões, migrações, expiração, limpeza e persistência de sessões.
- Login continua com usuário `caua`, senha fixa escolhida posteriormente e armazenada apenas como hash no Railway; sessão de 12 horas. Interface e site público preservados. Não é ainda um painel de edição.

## Verificações locais da revisão

- 18/18 testes Node de autenticação e rate limit (HTTP real local com armazenamento de teste em memória; não PostgreSQL).
- 10/10 testes Node do portfólio. 30 verificações offline de página/tamanho; 3/3 verificações offline de UI do login com API simulada.
- `npm ci --dry-run --offline --ignore-scripts --no-audit --no-fund --omit=dev`: aprovado (14 dependências). Instalação real offline: não executada com sucesso por falta de cache (`ENOTCACHED`); registro npm também inacessível (`EAI_AGAIN`).
- Teste PostgreSQL preparado, pulado por ausência de TEST_DATABASE_URL. Chromium via HTTP local bloqueado por ERR_BLOCKED_BY_ADMINISTRATOR. Docker/Railway não executados.

## Antes de usar em produção

Ler `backend/README.md`. Validar `npm ci` real e auditoria das dependências, integração em PostgreSQL descartável (`TEST_DATABASE_URL=... npm run test:postgres`), build Docker, origem confiável do Railway, login/refresh/logout via HTTPS, persistência após reinício e ausência de segredos no código. Nenhuma dessas validações remotas é declarada concluída. Só configurar o Railway e enviar código com autorização do responsável.
