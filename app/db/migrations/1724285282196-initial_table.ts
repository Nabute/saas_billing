import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTable1724285282196 implements MigrationInterface {
    name = 'InitialTable1724285282196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "deletedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "trialPeriodDays" integer`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "maxUsers" integer`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "maxStorage" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "overageCharge" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "autoRenewal" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "setupFee" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "currency" character varying NOT NULL DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "discount" numeric`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "cancellationPolicy" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "gracePeriodDays" integer`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "upgradeToPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "downgradeToPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "trialConversionPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "prorate" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "deletedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "phoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "billingAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "postalCode" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "subscriptionPlanId" uuid`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "subscriptionStatusId" uuid`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "deletedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "deletedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "deletedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_88dd6cde3b31a1088abb2e9ad44" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_8ed83c12a858234d7cfe192f79a" FOREIGN KEY ("subscriptionStatusId") REFERENCES "data_lookup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_8ed83c12a858234d7cfe192f79a"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_88dd6cde3b31a1088abb2e9ad44"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "subscriptionStatusId"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "subscriptionPlanId"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "postalCode"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "billingAddress"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "prorate"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "trialConversionPlanId"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "downgradeToPlanId"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "upgradeToPlanId"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "gracePeriodDays"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "cancellationPolicy"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "setupFee"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "autoRenewal"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "overageCharge"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "maxStorage"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "maxUsers"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "trialPeriodDays"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "lastName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "firstName" character varying NOT NULL`);
    }

}
