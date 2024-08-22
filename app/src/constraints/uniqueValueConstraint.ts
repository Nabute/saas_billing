import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'isUniqueValue', async: true })
export class IsUniqueValueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly dataLookupService) { }

    async validate(value: string): Promise<boolean> {
        const exists = await this.dataLookupService.existsByValue(value);
        return !exists;
    }

    defaultMessage(): string {
        return 'Value must be unique';
    }
}

export function IsUniqueValue(validationOptions?: ValidationOptions) {
    return function (object: Record<string, any>, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueValueConstraint,
        });
    };
}
