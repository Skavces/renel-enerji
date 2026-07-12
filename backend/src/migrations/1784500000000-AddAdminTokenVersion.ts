import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAdminTokenVersion1784500000000 implements MigrationInterface {
  name = 'AddAdminTokenVersion1784500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_config" ADD COLUMN IF NOT EXISTS "tokenVersion" integer NOT NULL DEFAULT 0`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin_config" DROP COLUMN IF EXISTS "tokenVersion"`)
  }
}
