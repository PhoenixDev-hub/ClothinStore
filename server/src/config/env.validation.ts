import { z } from 'zod';

const postgresUrl = z.string().regex(/^postgres(ql)?:\/\//);

export const envSchema = z.object({
  DATABASE_URL: postgresUrl,
  DIRECT_URL: postgresUrl,
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  ADMIN_API_KEY: z.string().min(32),
  WHATSAPP_NUMBER: z.string().regex(/^\d{10,15}$/),
  SUPABASE_URL: z
    .string()
    .url()
    .refine((v) => v.startsWith('https://'))
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
  }

  return { ...config, ...result.data };
}
