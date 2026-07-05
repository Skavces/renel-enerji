import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateChatDailyStats1751900000001 implements MigrationInterface {
  name = 'CreateChatDailyStats1751900000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_daily_stats" (
        "date" date NOT NULL,
        "opened" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_chat_daily_stats_date" PRIMARY KEY ("date")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "chat_daily_stats"`)
  }
}
