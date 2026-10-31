import { Catch, ExceptionFilter, Logger } from '@nestjs/common';

interface Normalized {
  statusCode: number;
  message: string | string[];
  error: string;
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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name)
}
