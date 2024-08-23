import { ValidationExceptionFilter } from '../../src/exceptions/validation-exception.filter';
import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';

describe('ValidationExceptionFilter', () => {
    let validationExceptionFilter: ValidationExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
        validationExceptionFilter = new ValidationExceptionFilter();
        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: jest.fn().mockReturnValue({
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn(),
                }),
            }),
        } as unknown as ArgumentsHost;
    });

    it('should handle BadRequestException with validation errors correctly', () => {
        const exceptionResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['field1 must be a string', 'field2 is required'],
            error: 'Bad Request',
        };
        const exception = new BadRequestException(exceptionResponse);

        validationExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: exceptionResponse.message,
            timestamp: expect.any(String),
        });
    });

    it('should handle BadRequestException with no validation errors correctly', () => {
        const exceptionResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Some error occurred'],
            error: 'Bad Request',
        };
        const exception = new BadRequestException(exceptionResponse);

        validationExceptionFilter.catch(exception, mockArgumentsHost);

        expect(mockArgumentsHost.switchToHttp().getResponse().status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockArgumentsHost.switchToHttp().getResponse().json).toHaveBeenCalledWith({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: exceptionResponse.message, // In this case, it might be a string rather than an array
            timestamp: expect.any(String),
        });
    });
});
