import { AllExceptionsFilter } from '../../src/exceptions/all-exceptions.filter';
import { HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
    let allExceptionsFilter: AllExceptionsFilter;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
        allExceptionsFilter = new AllExceptionsFilter();
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

    it('should handle HttpException correctly', () => {
        const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        allExceptionsFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.FORBIDDEN,
            timestamp: expect.any(String),
            path: '/test-url',
            message: 'Forbidden',
        });
    });

    it('should handle generic Error correctly', () => {
        const exception = new Error('Some internal error');
        allExceptionsFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: expect.any(String),
            path: '/test-url',
            message: 'Some internal error',
        });
    });

    it('should handle unknown exception types', () => {
        const exception = 'Unknown exception type';
        allExceptionsFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: expect.any(String),
            path: '/test-url',
            message: 'Internal server error',
        });
    });
});
