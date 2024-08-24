import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemSettingTableAndUpdatePayment1724367208644 implements MigrationInterface {
    name = 'AddSystemSettingTableAndUpdatePayment1724367208644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_f0a221fbe9c5b4004a1479f7bb9"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08"`);
        await queryRunner.query(`CREATE TABLE "system_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "defaultValue" text NOT NULL, "currentValue" text NOT NULL, "objectStateId" uuid, CONSTRAINT "PK_88dbc9b10c8558420acf7ea642f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_34a784a7ee0ef3450ed68c08a2" ON "system_setting" ("code") `);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "statusId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "subscriptionId"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "code" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "retryCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "nextRetry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "createdDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "updatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "deletedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "objectStateId" uuid`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "statusId" uuid`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "subscriptionId" uuid`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "invoiceId" uuid`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66"`);
        await queryRunner.query(`ALTER TABLE "system_setting" ADD CONSTRAINT "FK_cfcbfe457665632818d9bb5f164" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_0c4ec5c08dae801516118e0e897" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_a595020add15845ff4cb1c743c8" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_2c09534a63cf2e612ab2ca3a252" FOREIGN KEY ("subscriptionId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_2c09534a63cf2e612ab2ca3a252"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_a595020add15845ff4cb1c743c8"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_0c4ec5c08dae801516118e0e897"`);
        await queryRunner.query(`ALTER TABLE "system_setting" DROP CONSTRAINT "FK_cfcbfe457665632818d9bb5f164"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "invoiceId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "subscriptionId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "statusId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "objectStateId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "updatedDate"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "createdDate"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "nextRetry"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "retryCount"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "subscriptionId" uuid`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "currency" character varying(3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "statusId" uuid`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34a784a7ee0ef3450ed68c08a2"`);
        await queryRunner.query(`DROP TABLE "system_setting"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_f0a221fbe9c5b4004a1479f7bb9" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
