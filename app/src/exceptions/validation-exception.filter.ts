import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const validationErrors = exceptionResponse.message || [];

    response.status(status).json({
      statusCode: status,
      message: 'Validation failed',
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    });
  }
}
