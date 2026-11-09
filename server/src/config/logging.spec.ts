import { Writable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import pino from 'pino';
import {
  LOG_REDACT_CENSOR,
  LOG_REDACT_PATHS,
  serializeRequest,
} from './logging';

const capture = () => {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { stream, output: () => chunks.join('') };
};

describe('request log redaction', () => {
  it('removes passwords and tokens from logged request data', () => {
    const { stream, output: readOutput } = capture();
    const logger = pino(
      {
        redact: { paths: LOG_REDACT_PATHS, censor: LOG_REDACT_CENSOR },
      },
      stream,
    );

    logger.info(
      {
        req: {
          headers: {
            authorization: 'Bearer header-secret',
            'x-api-key': 'header-api-key-secret',
            cookie: 'admin_session=cookie-secret',
            'set-cookie': 'admin_session=response-cookie-secret',
          },
          body: {
            apiKey: 'body-api-key-secret',
            password: 'body-password-secret',
            token: 'body-token-secret',
            accessToken: 'body-access-secret',
            refreshToken: 'body-refresh-secret',
          },
          query: {
            token: 'query-token-secret',
            access_token: 'query-access-secret',
          },
        },
        res: {
          headers: {
            'set-cookie': 'admin_session=res-cookie-secret',
          },
        },
      },
      'request',
    );

    const output = readOutput();
    expect(output).toContain(LOG_REDACT_CENSOR);
    for (const secret of [
      'header-secret',
      'header-api-key-secret',
      'cookie-secret',
      'response-cookie-secret',
      'body-api-key-secret',
      'body-password-secret',
      'body-token-secret',
      'body-access-secret',
      'body-refresh-secret',
      'query-token-secret',
      'query-access-secret',
      'res-cookie-secret',
    ]) {
      expect(output).not.toContain(secret);
    }
  });

  it('strips tokens from the URL query string', () => {
    const { stream, output: readOutput } = capture();
    const logger = pino({ serializers: { req: serializeRequest } }, stream);

    logger.info(
      {
        req: {
          method: 'GET',
          url: '/api/products?token=url-token-secret&search=camiseta',
          headers: {},
        } as unknown as IncomingMessage,
      },
      'request',
    );

    const output = readOutput();
    expect(output).toContain('/api/products');
    expect(output).not.toContain('url-token-secret');
    expect(output).not.toContain('?token=');
  });
});
