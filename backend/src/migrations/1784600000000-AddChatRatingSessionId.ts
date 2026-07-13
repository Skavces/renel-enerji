import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChatRatingSessionId1784600000000 implements MigrationInterface {
  name = 'AddChatRatingSessionId1784600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_ratings" ADD COLUMN IF NOT EXISTS "sessionId" uuid`)
    // Unique index NULL'ları saymaz: sessionId'siz eski/anonim kayıtlar serbest kalır
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_chat_ratings_sessionId" ON "chat_ratings" ("sessionId")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_chat_ratings_sessionId"`)
    await queryRunner.query(`ALTER TABLE "chat_ratings" DROP COLUMN IF EXISTS "sessionId"`)
  }
}
