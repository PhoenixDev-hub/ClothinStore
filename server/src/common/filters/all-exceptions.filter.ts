import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { STATUS_CODES } from 'node:http';

interface Normalized {
  statusCode: number;
  message: string | string[];
  error?: string;
}

const PRISMA_ERRORS: Record<string, Normalized> = {
  P2000: { statusCode: 400, message: 'Valor longo demais para o campo' },
  P2002: {
    statusCode: 409,
    message: 'Já existe um registro com estes dados únicos',
  },
  P2003: {
    statusCode: 409,
    message: 'Operação viola relação com outro registro',
  },
  P2011: { statusCode: 400, message: 'Campo obrigatório ausente' },
  P2014: {
    statusCode: 400,
    message: 'Operação violaria uma relação obrigatória',
  },
  P2025: { statusCode: 404, message: 'Registro não encontrado' },
  P2024: {
    statusCode: 503,
    message: 'Banco de dados sobrecarregado, tente novamente',
  },
  P1001: { statusCode: 503, message: 'Banco de dados indisponível' },
  P1002: { statusCode: 503, message: 'Banco de dados indisponível' },
};

const INTERNAL: Normalized = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Erro interno do servidor',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ id?: string; url?: string }>();

    const { statusCode, message, error } = this.normalize(exception);
    const log = {
      reqId: request.id,
      statusCode,
      path: String(httpAdapter.getRequestUrl(request)).split('?')[0],
    };

    if (statusCode >= 500) {
      this.logger.error(
        { ...log, err: exception instanceof Error ? exception : undefined },
        'Unhandled request error',
      );
    } else {
      this.logger.warn(log, 'Request failed');
    }

    httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode,
        message,
        error: error ?? STATUS_CODES[statusCode] ?? 'Error',
        timestamp: new Date().toISOString(),
        path: String(httpAdapter.getRequestUrl(request)).split('?')[0],
      },
      statusCode,
    );
  }

  private normalize(exception: unknown): Normalized {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { statusCode: exception.getStatus(), message: res };
      }
      const body = res as { message?: string | string[]; error?: string };
      return {
        statusCode: exception.getStatus(),
        message: body.message ?? exception.message,
        error: body.error,
      };
    }

    if (exception instanceof Error) {
      const { name } = exception;
      const code = (exception as { code?: unknown }).code;

      if (
        name === 'PrismaClientKnownRequestError' &&
        typeof code === 'string'
      ) {
        const mapped = PRISMA_ERRORS[code];
        if (!mapped) return INTERNAL;
        const target = (exception as { meta?: { target?: unknown } }).meta
          ?.target;
        return code === 'P2002' && Array.isArray(target)
          ? {
              ...mapped,
              message: `${Array.isArray(mapped.message) ? mapped.message.join(', ') : mapped.message} (${target.join(', ')})`,
            }
          : mapped;
      }
      if (name === 'PrismaClientValidationError') {
        return { statusCode: 400, message: 'Dados inválidos para a operação' };
      }
      if (name === 'PrismaClientInitializationError') {
        return { statusCode: 503, message: 'Banco de dados indisponível' };
      }

      const status = (exception as { statusCode?: unknown }).statusCode;
      if (typeof status === 'number' && status >= 400 && status < 500) {
        return { statusCode: status, message: exception.message };
      }
    }

    return INTERNAL;
  }
}
