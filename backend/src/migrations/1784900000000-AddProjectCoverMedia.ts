import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectCoverMedia1784900000000 implements MigrationInterface {
  name = 'AddProjectCoverMedia1784900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "coverMediaId" uuid`)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "projects"
          ADD CONSTRAINT "FK_projects_coverMediaId"
          FOREIGN KEY ("coverMediaId") REFERENCES "project_media"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_coverMediaId"`)
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "coverMediaId"`)
  }
}
