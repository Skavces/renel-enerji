import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectFeatured1784700000000 implements MigrationInterface {
  name = 'AddProjectFeatured1784700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false`,
    )
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featuredOrder" integer NOT NULL DEFAULT 0`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_projects_featured_featuredOrder" ON "projects" ("featured", "featuredOrder")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_featured_featuredOrder"`)
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "featuredOrder"`)
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "featured"`)
  }
}
