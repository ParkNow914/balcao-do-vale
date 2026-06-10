import { describe, expect, it } from 'vitest';
import app from './index';

describe('balcao-api', () => {
  it('responde ao health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; servico: string };
    expect(body.status).toBe('ok');
    expect(body.servico).toBe('balcao-api');
  });

  it('expõe a raiz da API v1', async () => {
    const res = await app.request('/v1');
    expect(res.status).toBe(200);
  });
});
