import helmet from '@fastify/helmet';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export async function registerSecurityHeaders(
  app: NestFastifyApplication,
): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: {
      // HSTS já cobre produção; evita quebrar Swagger em HTTP local
      directives: { upgradeInsecureRequests: null },
    },
  });
}
