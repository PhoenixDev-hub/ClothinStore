export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'req.body.apiKey',
  'req.body.password',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.query.token',
  'req.query.access_token',
];

export const LOG_REDACT_CENSOR = '[REDACTED]';
