import { Hono } from 'hono';

export type Env = {
  Bindings: {
    DB: D1Database;
    FLAGS: KVNamespace;
    // ARQUIVOS: R2Bucket; — descomentar após ativar o R2 no painel Cloudflare
  };
};

const app = new Hono<Env>();

app.get('/health', (c) =>
  c.json({ status: 'ok', servico: 'balcao-api', timestamp: new Date().toISOString() }),
);

/** Toda rota de negócio vive sob /v1 — API versionada desde o dia 1 (doc 04). */
const v1 = new Hono<Env>();

v1.get('/', (c) => c.json({ api: 'Balcão do Vale', versao: 1 }));

app.route('/v1', v1);

export default app;
