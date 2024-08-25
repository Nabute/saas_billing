import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1724542311927 implements MigrationInterface {
    name = 'InitialMigration1724542311927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "data_lookup" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(256) NOT NULL, "name" character varying(256) NOT NULL, "value" character varying(256) NOT NULL, "description" character varying, "category" character varying(256), "note" character varying, "index" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "remark" character varying, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9f60ded44dcddb72401bd6e0d73" UNIQUE ("value"), CONSTRAINT "PK_e50dfedbaea85294d054845459e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phoneNumber" character varying, "objectStateId" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "system_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "defaultValue" text NOT NULL, "currentValue" text NOT NULL, "objectStateId" uuid, CONSTRAINT "PK_88dbc9b10c8558420acf7ea642f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_34a784a7ee0ef3450ed68c08a2" ON "system_setting" ("code") `);
        await queryRunner.query(`CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "price" numeric NOT NULL, "billingCycleDays" integer NOT NULL, "prorate" boolean NOT NULL DEFAULT true, "objectStateId" uuid, "statusId" uuid, CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "retryCount" integer NOT NULL DEFAULT '0', "nextRetry" TIMESTAMP, "nextBillingDate" TIMESTAMP NOT NULL, "objectStateId" uuid, "userId" uuid, "subscriptionPlanId" uuid, "subscriptionStatusId" uuid, CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "code" character varying(50) NOT NULL, "customerId" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "paymentDueDate" date NOT NULL, "paymentDate" TIMESTAMP, "objectStateId" uuid, "statusId" uuid, "subscriptionId" uuid, CONSTRAINT "UQ_e38e380c25aacf8cd59d6ae21fe" UNIQUE ("code"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "accountHolderName" character varying(100), "accountNumber" character varying(50), "logo" character varying, "objectStateId" uuid, "typeId" uuid, CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125" UNIQUE ("code"), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "amount" numeric(10,2) NOT NULL, "referenceNumber" character varying(100) NOT NULL, "payerName" character varying(100) NOT NULL, "paymentDate" date, "objectStateId" uuid, "statusId" uuid, "invoiceId" uuid, "paymentMethodId" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_fb02bf159ff549154df233aa6e9" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system_setting" ADD CONSTRAINT "FK_cfcbfe457665632818d9bb5f164" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD CONSTRAINT "FK_b21861cdd922eb98a449c752cdd" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD CONSTRAINT "FK_437b83f8551833438d63f78086f" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_128b6a4d0e6f02a7076a604648c" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_b8512aa9cef03d90ed5744c94d7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_88dd6cde3b31a1088abb2e9ad44" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_8ed83c12a858234d7cfe192f79a" FOREIGN KEY ("subscriptionStatusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_0c4ec5c08dae801516118e0e897" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_a595020add15845ff4cb1c743c8" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_2c09534a63cf2e612ab2ca3a252" FOREIGN KEY ("subscriptionId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_9b5a223a0b92d4804864af68e52" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_137bf799227505edd74b045bcce" FOREIGN KEY ("typeId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_4394f8cd4011218d070d80093d1" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_fe15297113c30bf8a39505ac568" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_fe15297113c30bf8a39505ac568"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_4394f8cd4011218d070d80093d1"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_137bf799227505edd74b045bcce"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_9b5a223a0b92d4804864af68e52"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_2c09534a63cf2e612ab2ca3a252"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_a595020add15845ff4cb1c743c8"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_0c4ec5c08dae801516118e0e897"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_8ed83c12a858234d7cfe192f79a"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_88dd6cde3b31a1088abb2e9ad44"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_b8512aa9cef03d90ed5744c94d7"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_128b6a4d0e6f02a7076a604648c"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP CONSTRAINT "FK_437b83f8551833438d63f78086f"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP CONSTRAINT "FK_b21861cdd922eb98a449c752cdd"`);
        await queryRunner.query(`ALTER TABLE "system_setting" DROP CONSTRAINT "FK_cfcbfe457665632818d9bb5f164"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_fb02bf159ff549154df233aa6e9"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "subscription_plans"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34a784a7ee0ef3450ed68c08a2"`);
        await queryRunner.query(`DROP TABLE "system_setting"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "data_lookup"`);
    }

}
