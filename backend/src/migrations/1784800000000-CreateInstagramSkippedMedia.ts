import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateInstagramSkippedMedia1784800000000 implements MigrationInterface {
  name = 'CreateInstagramSkippedMedia1784800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "instagram_skipped_media" (
        "mediaId" character varying NOT NULL,
        "reason" character varying(20) NOT NULL,
        "failCount" integer NOT NULL DEFAULT 0,
        "lastError" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_instagram_skipped_media_mediaId" PRIMARY KEY ("mediaId")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "instagram_skipped_media"`)
  }
}
