import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorCustomerSubscriptionAndPlan1724323916157 implements MigrationInterface {
    name = 'RefactorCustomerSubscriptionAndPlan1724323916157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "trialPeriodDays"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "maxUsers"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "maxStorage"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "overageCharge"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "autoRenewal"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "setupFee"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "cancellationPolicy"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "gracePeriodDays"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "upgradeToPlanId"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "downgradeToPlanId"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "trialConversionPlanId"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "billingAddress"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "postalCode"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "startDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "endDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_b8512aa9cef03d90ed5744c94d7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_b8512aa9cef03d90ed5744c94d7"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "endDate"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "postalCode" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "billingAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "phoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "trialConversionPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "downgradeToPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "upgradeToPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "gracePeriodDays" integer`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "cancellationPolicy" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "discount" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "currency" character varying NOT NULL DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "setupFee" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "autoRenewal" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "overageCharge" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "maxStorage" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "maxUsers" integer`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "trialPeriodDays" integer`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
