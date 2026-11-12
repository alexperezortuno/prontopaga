import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

function diagnosticMessage(exception: unknown): string {
  const value = exception instanceof Error
    ? `${exception.name}: ${exception.message}\n${exception.stack ?? ''}`
    : 'Unknown unhandled exception';

  return value
    .replace(
      /(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s,}]+/gi,
      '$1[REDACTED]',
    )
    .replace(
      /(password|token|secret|jwt)(\s*[:=]\s*)[^\s,}]+/gi,
      '$1$2[REDACTED]',
    );
}

@Catch()
export class SanitizedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SanitizedExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    if (!(exception instanceof HttpException)) {
      this.logger.error(diagnosticMessage(exception));
    }

    response.status(status).send();
  }
}
