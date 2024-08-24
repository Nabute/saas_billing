import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeNextBillingDateNullable1724460259783 implements MigrationInterface {
    name = 'MakeNextBillingDateNullable1724460259783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "nextBillingDate" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "nextBillingDate" SET NOT NULL`);
    }

}
