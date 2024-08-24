import { ExceptionFilter, Catch, ArgumentsHost, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(NotFoundExceptionFilter.name);

    catch(exception: NotFoundException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message || 'Resource not found';

        // Log the error details
        this.logger.error(`Not Found: ${message}`, exception.stack);

        // Respond to the client
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
        });
    }
}
