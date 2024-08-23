import { DatabaseExceptionFilter } from '../../src/exceptions/database-exception.filter';
import { ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

describe('DatabaseExceptionFilter', () => {
    let databaseExceptionFilter: DatabaseExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
        databaseExceptionFilter = new DatabaseExceptionFilter();
        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: jest.fn().mockReturnValue({
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn(),
                }),
                getRequest: jest.fn().mockReturnValue({
                    url: '/test-url',
                }),
            }),
        } as unknown as ArgumentsHost;
    });

    it('should handle unique constraint violation (23505) correctly', () => {
        const exception = new QueryFailedError('SELECT 1', [], new Error());
        (exception as any).driverError = { code: '23505' };

        databaseExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(400);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: 400,
            timestamp: expect.any(String),
            path: '/test-url',
            message: 'Unique constraint violation',
        });
    });

    it('should handle generic database error correctly', () => {
        const exception = new QueryFailedError('SELECT 1', [], new Error());
        (exception as any).driverError = { code: '99999' }; // Some generic error code

        databaseExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(400);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: 400,
            timestamp: expect.any(String),
            path: '/test-url',
            message: 'Database error',
        });
    });
});
