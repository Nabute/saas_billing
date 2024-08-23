import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

/**
 * Custom validation constraint that checks if a value is unique in the database.
 */
@Injectable()
@ValidatorConstraint({ name: 'isUniqueValue', async: true })
export class IsUniqueValueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly dataLookupService) { }

    /**
     * Validates whether the provided value is unique.
     * 
     * @param value - The value to be validated.
     * @param args - Additional validation arguments.
     * @returns A Promise that resolves to true if the value is unique, false otherwise.
     */
    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        if (!value) {
            return true; // Avoid querying for null or undefined values.
        }

        const exists = await this.dataLookupService.existsByValue(value);
        return !exists;
    }

    /**
     * Provides the default error message if validation fails.
     * 
     * @param args - Additional validation arguments.
     * @returns The error message string.
     */
    defaultMessage(args: ValidationArguments): string {
        return `${args.property} must be unique. The provided value "${args.value}" already exists.`;
    }
}

/**
 * Decorator that applies the unique value validation constraint.
 * 
 * @param validationOptions - Optional settings for the validation decorator.
 * @returns A function that registers the custom validator.
 */
export function IsUniqueValue(validationOptions?: ValidationOptions) {
    return function (object: Record<string, any>, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueValueConstraint,
        });
    };
}
