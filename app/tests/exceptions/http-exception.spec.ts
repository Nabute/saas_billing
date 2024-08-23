import { HttpExceptionFilter } from '../../src/exceptions/http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
    let httpExceptionFilter: HttpExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
        httpExceptionFilter = new HttpExceptionFilter();
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

    it('should handle HttpException with a string response correctly', () => {
        const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

        httpExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.FORBIDDEN,
            timestamp: expect.any(String),
            path: '/test-url',
            message: 'Forbidden',
        });
    });

    it('should handle HttpException with an object response correctly', () => {
        const exceptionResponse = { message: 'Forbidden', error: 'Forbidden' };
        const exception = new HttpException(exceptionResponse, HttpStatus.FORBIDDEN);

        httpExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.FORBIDDEN,
            timestamp: expect.any(String),
            path: '/test-url',
            ...exceptionResponse,
        });
    });

    it('should handle HttpException with a complex object response correctly', () => {
        const exceptionResponse = { message: 'Validation failed', errors: ['field1 is required', 'field2 must be unique'] };
        const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);

        httpExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.BAD_REQUEST,
            timestamp: expect.any(String),
            path: '/test-url',
            ...exceptionResponse,
        });
    });
});
