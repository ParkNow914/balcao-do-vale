import { z } from 'zod';

/**
 * Valores monetários trafegam SEMPRE em centavos (inteiro) — nunca float.
 * Regra de produção: arredondamento só acontece na borda de apresentação.
 */
export const centavosSchema = z.number().int().nonnegative();
export type Centavos = z.infer<typeof centavosSchema>;

export const tenantIdSchema = z.uuid();
export type TenantId = z.infer<typeof tenantIdSchema>;

export const planoSchema = z.enum(['presenca', 'balcao', 'completo', 'profissional']);
export type Plano = z.infer<typeof planoSchema>;

export const papelSchema = z.enum(['dono', 'gerente', 'caixa']);
export type Papel = z.infer<typeof papelSchema>;

/** Formas de pagamento aceitas no PDV (doc 02, Módulo A). */
export const formaPagamentoSchema = z.enum(['dinheiro', 'pix', 'credito', 'debito', 'fiado']);
export type FormaPagamento = z.infer<typeof formaPagamentoSchema>;

const cnpjRegex = /^\d{14}$/;
/** CNPJ somente dígitos; validação de dígito verificador. */
export function validarCnpj(cnpj: string): boolean {
  if (!cnpjRegex.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base: string, pesos: number[]) => {
    const soma = pesos.reduce((acc, p, i) => acc + p * Number(base[i]), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj[12] === String(d1) && cnpj[13] === String(d2);
}

export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine(validarCnpj, 'CNPJ inválido');
