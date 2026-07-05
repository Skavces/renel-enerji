import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateChatRatings1751700000000 implements MigrationInterface {
  name = 'CreateChatRatings1751700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`
      CREATE TABLE "chat_ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating" smallint NOT NULL,
        "messageCount" integer NOT NULL DEFAULT 0,
        "conversation" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_ratings_id" PRIMARY KEY ("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "chat_ratings"`)
  }
}
