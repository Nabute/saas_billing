import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCustomerNextBillingDate1724417209527 implements MigrationInterface {
    name = 'UpdateCustomerNextBillingDate1724417209527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "nextBillingDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "amount" TYPE numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "nextBillingDate"`);
    }

}
