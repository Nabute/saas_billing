import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
    /**
     * Catches and handles QueryFailedError exceptions thrown by TypeORM.
     * 
     * @param exception - The QueryFailedError that was thrown.
     * @param host - The current execution context, including request and response objects.
     */
    catch(exception: QueryFailedError, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Extract the error code from the exception's driverError
        const errorCode = (exception as any).driverError?.code;

        // Default error message for database errors
        let message = 'Database error';
        let statusCode = HttpStatus.BAD_REQUEST;

        // Handle specific database error codes
        if (errorCode === '23505') {
            message = 'Unique constraint violation';
        }

        response.status(statusCode).json({
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}
