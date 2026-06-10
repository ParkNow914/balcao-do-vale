# Balcão do Vale — monorepo

O sistema operacional do comércio local de Lorena-SP e Vale do Paraíba.
Plano completo do produto: ver os documentos `01–05` na pasta acima (`SISTEMA REVOLUCIONARIO`).

## Estrutura

| Pasta | O que é | Stack |
|---|---|---|
| `apps/api` | API REST (`/v1`) + jobs (outbox/cron) | Hono + Cloudflare Workers + D1 |
| `apps/pdv` | PDV e gestão do lojista (PWA offline-first) | React 19 + Vite |
| `apps/cidade` | Site público, catálogos e app da cidade | Astro |
| `packages/db` | Schema do banco (multi-tenant) e migrações | Drizzle ORM (SQLite/D1) |
| `packages/shared` | Tipos, validações e regras compartilhadas | Zod |

## Comandos

```bash
pnpm install        # instalar tudo
pnpm dev            # rodar tudo em modo dev (turbo)
pnpm typecheck      # checagem de tipos em todos os pacotes
pnpm test           # testes
pnpm lint           # Biome (lint + formato)
pnpm build          # build de produção
```

## Regras inegociáveis do código (doc 04)

1. **Dinheiro em centavos** (inteiro). Nunca float.
2. **Toda tabela e toda query carregam `tenant_id`** — isolamento multi-tenant por construção.
3. **Tudo que é crítico e assíncrono passa pela tabela `outbox`** (NFC-e, Pix, WhatsApp) com retry.
4. **IDs de venda nascem no PDV (UUID)** — sincronização offline idempotente.
5. API versionada (`/v1`); nada de breaking change sem `/v2`.
