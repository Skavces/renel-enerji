import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAppLogs1783900000000 implements MigrationInterface {
  name = 'CreateAppLogs1783900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`
      CREATE TABLE "app_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "level" character varying(10) NOT NULL,
        "context" character varying(100),
        "message" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_logs_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_app_logs_createdAt" ON "app_logs" ("createdAt")`)
    // Kaçan-lead bildirim mekanizması kaldırıldı (dış bildirim kanalı yok artık)
    await queryRunner.query(`ALTER TABLE "chat_leads" DROP COLUMN "notifiedAt"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_leads" ADD "notifiedAt" TIMESTAMP`)
    await queryRunner.query(`DROP INDEX "IDX_app_logs_createdAt"`)
    await queryRunner.query(`DROP TABLE "app_logs"`)
  }
}
