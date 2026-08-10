import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateQuoteRequests1784600000002 implements MigrationInterface {
  name = 'CreateQuoteRequests1784600000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`
      CREATE TABLE "quote_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120),
        "phone" character varying(20),
        "city" character varying(120),
        "serviceType" character varying(40) NOT NULL,
        "monthlyBill" integer,
        "message" text,
        "kvkkConsent" boolean NOT NULL DEFAULT false,
        "consentAt" TIMESTAMP NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'new',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quote_requests_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_quote_requests_createdAt" ON "quote_requests" ("createdAt")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_quote_requests_createdAt"`)
    await queryRunner.query(`DROP TABLE "quote_requests"`)
  }
}
