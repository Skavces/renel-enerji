import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateChatLeads1751900000000 implements MigrationInterface {
  name = 'CreateChatLeads1751900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`
      CREATE TABLE "chat_leads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "conversation" jsonb,
        "messageCount" integer NOT NULL DEFAULT 0,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "rating" smallint,
        "notifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_leads_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chat_leads_sessionId" UNIQUE ("sessionId")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_chat_leads_createdAt" ON "chat_leads" ("createdAt")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_chat_leads_createdAt"`)
    await queryRunner.query(`DROP TABLE "chat_leads"`)
  }
}
