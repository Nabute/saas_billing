import { IsUniqueValueConstraint } from '../../src/constraints/uniqueValueConstraint';
import { DataLookupService } from '../../src/services/data-lookup.service';

describe('IsUniqueValueConstraint', () => {
    let constraint: IsUniqueValueConstraint;
    let dataLookupService: DataLookupService;

    beforeEach(() => {
        dataLookupService = {
            existsByValue: jest.fn(),
        } as any as DataLookupService;

        constraint = new IsUniqueValueConstraint(dataLookupService);
    });

    it('should be defined', () => {
        expect(constraint).toBeDefined();
    });

    it('should return a proper error message', () => {
        const argument = {
            property: 'email',
            value: 'exising@example.com'
        };
        const result = constraint.defaultMessage(argument as any);

        expect(result).toBe(`${argument.property} must be unique. The provided value "${argument.value}" already exists.`);
    });

    it('should return true if the value is unique', async () => {
        jest.spyOn(dataLookupService, 'existsByValue').mockResolvedValue(false);
        expect(await constraint.validate('unique-value')).toBe(true);
    });

    it('should return false if the value is not unique', async () => {
        jest.spyOn(dataLookupService, 'existsByValue').mockResolvedValue(true);
        expect(await constraint.validate('duplicate-value')).toBe(false);
    });
});