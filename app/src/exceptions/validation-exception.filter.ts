import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  /**
   * Catches and handles BadRequestException specifically related to validation errors.
   *
   * @param exception - The BadRequestException that was thrown, typically containing validation errors.
   * @param host - The current execution context, including the response object.
   */
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Extract validation errors from the exception response
    const validationErrors = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message
      : [exceptionResponse.message];

    response.status(status).json({
      statusCode: status,
      message: 'Validation failed',
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    });
  }
}
