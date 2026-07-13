import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAppLogsLevelCreatedAtIndex1784600000001 implements MigrationInterface {
  name = 'AddAppLogsLevelCreatedAtIndex1784600000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Loglar sayfası level filtresi + createdAt sıralamasıyla okuyor
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_app_logs_level_createdAt" ON "app_logs" ("level", "createdAt")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_app_logs_level_createdAt"`)
  }
}
