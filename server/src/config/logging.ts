import pino from 'pino';

export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'req.body.apiKey',
  'req.body.password',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.query.token',
  'req.query.access_token',
];

export const LOG_REDACT_CENSOR = '[REDACTED]';

export function serializeRequest(
  req: Parameters<typeof pino.stdSerializers.req>[0],
): ReturnType<typeof pino.stdSerializers.req> {
  const serialized = pino.stdSerializers.req(req);
  return {
    ...serialized,
    url:
      typeof serialized.url === 'string'
        ? serialized.url.split('?')[0]
        : serialized.url,
  };
}
