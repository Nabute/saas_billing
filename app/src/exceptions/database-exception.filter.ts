import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Casting exception to any to access driverError
        const errorCode = (exception as any).driverError?.code;

        let message = 'Database error';
        if (errorCode === '23505') {
            message = 'Unique constraint violation';
        }

        response.status(400).json({
            statusCode: 400,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}
