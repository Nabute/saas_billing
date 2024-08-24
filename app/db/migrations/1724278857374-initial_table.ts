import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTable1724278857374 implements MigrationInterface {
    name = 'InitialTable1724278857374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "data_lookup" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(256) NOT NULL, "name" character varying(256) NOT NULL, "value" character varying(256) NOT NULL, "description" character varying, "category" character varying(256), "note" character varying, "index" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "remark" character varying, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9f60ded44dcddb72401bd6e0d73" UNIQUE ("value"), CONSTRAINT "PK_e50dfedbaea85294d054845459e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "objectStateId" uuid, CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "accountHolderName" character varying(100), "accountNumber" character varying(50), "logo" character varying, "objectStateId" uuid, "typeId" uuid, "statusId" uuid, CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name"), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL, "referenceNumber" character varying(100) NOT NULL, "payerName" character varying(100) NOT NULL, "paymentDate" date, "objectStateId" uuid, "statusId" uuid, "subscriptionId" uuid, "paymentMethodId" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "objectStateId" uuid, "customerId" uuid, "planId" uuid, "statusId" uuid, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "price" numeric NOT NULL, "billingCycleDays" integer NOT NULL, "objectStateId" uuid, "statusId" uuid, CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" character varying NOT NULL, "amount" numeric NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "paymentDueDate" date NOT NULL, "paymentDate" TIMESTAMP, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_128b6a4d0e6f02a7076a604648c" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_9b5a223a0b92d4804864af68e52" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_137bf799227505edd74b045bcce" FOREIGN KEY ("typeId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_f0a221fbe9c5b4004a1479f7bb9" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_4394f8cd4011218d070d80093d1" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_fe15297113c30bf8a39505ac568" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_42329dc93149312811cb8dc7c07" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e0fbe75e9db162a00ecaf7ab56a" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_65f3292e30fccbb0dfe4ae6dcb3" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD CONSTRAINT "FK_b21861cdd922eb98a449c752cdd" FOREIGN KEY ("objectStateId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD CONSTRAINT "FK_437b83f8551833438d63f78086f" FOREIGN KEY ("statusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP CONSTRAINT "FK_437b83f8551833438d63f78086f"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP CONSTRAINT "FK_b21861cdd922eb98a449c752cdd"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_65f3292e30fccbb0dfe4ae6dcb3"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e0fbe75e9db162a00ecaf7ab56a"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_42329dc93149312811cb8dc7c07"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_fe15297113c30bf8a39505ac568"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_4394f8cd4011218d070d80093d1"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_f0a221fbe9c5b4004a1479f7bb9"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_137bf799227505edd74b045bcce"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_9b5a223a0b92d4804864af68e52"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_128b6a4d0e6f02a7076a604648c"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "subscription_plans"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "data_lookup"`);
    }

}
