import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * REGRA DE OURO MULTI-TENANT: toda tabela de dados de negócio carrega `tenantId`
 * e todo acesso passa pelo repositório que injeta o escopo (ver packages/db/src/index.ts).
 * Dinheiro em centavos (integer). Datas em ISO-8601 UTC (text).
 */

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  criadoEm: text('criado_em').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  atualizadoEm: text('atualizado_em')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
};

export const tenants = sqliteTable('tenants', {
  id: id(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  cnpj: text('cnpj'),
  cidade: text('cidade').notNull().default('Lorena'),
  plano: text('plano', { enum: ['presenca', 'balcao', 'completo', 'profissional'] })
    .notNull()
    .default('presenca'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

export const usuarios = sqliteTable(
  'usuarios',
  {
    id: id(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    papel: text('papel', { enum: ['dono', 'gerente', 'caixa'] }).notNull(),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('usuarios_email_unq').on(t.email),
    index('usuarios_tenant_idx').on(t.tenantId),
  ],
);

export const produtos = sqliteTable(
  'produtos',
  {
    id: id(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    nome: text('nome').notNull(),
    codigoBarras: text('codigo_barras'),
    precoCentavos: integer('preco_centavos').notNull(),
    custoCentavos: integer('custo_centavos'),
    estoque: integer('estoque').notNull().default(0),
    estoqueMinimo: integer('estoque_minimo').notNull().default(0),
    publicadoNoCatalogo: integer('publicado_no_catalogo', { mode: 'boolean' })
      .notNull()
      .default(false),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index('produtos_tenant_idx').on(t.tenantId),
    index('produtos_barras_idx').on(t.tenantId, t.codigoBarras),
  ],
);

export const vendas = sqliteTable(
  'vendas',
  {
    /** UUID gerado no PDV (cliente) — garante idempotência da sincronização offline. */
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    totalCentavos: integer('total_centavos').notNull(),
    descontoCentavos: integer('desconto_centavos').notNull().default(0),
    formaPagamento: text('forma_pagamento', {
      enum: ['dinheiro', 'pix', 'credito', 'debito', 'fiado'],
    }).notNull(),
    status: text('status', { enum: ['concluida', 'cancelada'] })
      .notNull()
      .default('concluida'),
    /** Preenchidos pelo fluxo fiscal (outbox) quando o plano inclui NFC-e. */
    nfceStatus: text('nfce_status', {
      enum: ['nao_aplicavel', 'pendente', 'autorizada', 'rejeitada', 'contingencia'],
    })
      .notNull()
      .default('nao_aplicavel'),
    nfceChave: text('nfce_chave'),
    realizadaEm: text('realizada_em').notNull(),
    ...timestamps,
  },
  (t) => [index('vendas_tenant_data_idx').on(t.tenantId, t.realizadaEm)],
);

export const vendaItens = sqliteTable(
  'venda_itens',
  {
    id: id(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    vendaId: text('venda_id')
      .notNull()
      .references(() => vendas.id),
    produtoId: text('produto_id')
      .notNull()
      .references(() => produtos.id),
    quantidade: integer('quantidade').notNull(),
    precoUnitarioCentavos: integer('preco_unitario_centavos').notNull(),
  },
  (t) => [index('venda_itens_venda_idx').on(t.vendaId)],
);

/**
 * Outbox: tudo que é assíncrono e crítico (emissão NFC-e, webhooks Pix, WhatsApp)
 * entra aqui e é processado por Cron Trigger com retry exponencial (doc 04).
 */
export const outbox = sqliteTable(
  'outbox',
  {
    id: id(),
    tenantId: text('tenant_id').notNull(),
    tipo: text('tipo', { enum: ['emitir_nfce', 'webhook_pix', 'whatsapp', 'email'] }).notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    tentativas: integer('tentativas').notNull().default(0),
    proximaTentativaEm: text('proxima_tentativa_em'),
    status: text('status', { enum: ['pendente', 'processando', 'concluido', 'falhou'] })
      .notNull()
      .default('pendente'),
    erro: text('erro'),
    ...timestamps,
  },
  (t) => [index('outbox_status_idx').on(t.status, t.proximaTentativaEm)],
);

/** Trilha de auditoria imutável para ações sensíveis (doc 04 — Segurança). */
export const auditoria = sqliteTable(
  'auditoria',
  {
    id: id(),
    tenantId: text('tenant_id').notNull(),
    usuarioId: text('usuario_id'),
    acao: text('acao').notNull(),
    entidade: text('entidade').notNull(),
    entidadeId: text('entidade_id'),
    detalhes: text('detalhes', { mode: 'json' }),
    criadoEm: text('criado_em').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [index('auditoria_tenant_idx').on(t.tenantId, t.criadoEm)],
);
