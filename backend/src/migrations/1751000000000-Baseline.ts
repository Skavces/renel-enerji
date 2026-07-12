import { MigrationInterface, QueryRunner } from 'typeorm'

// Çekirdek şemanın migration karşılığı. Tablolar bugüne kadar DB_SYNC=true (synchronize)
// ile kuruluyordu; bu migration taze bir veritabanında aynı şemayı kurar. Prod'da tablolar
// zaten var olduğundan her blok hasTable korumasıyla no-op olur (indeks/constraint isim
// çakışması yaşanmaz). Timestamp mevcut en eski migration'dan küçüktür ki taze DB'de
// chat/log migration'larından ÖNCE çalışsın.
export class Baseline1751000000000 implements MigrationInterface {
  name = 'Baseline1751000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    if (!(await queryRunner.hasTable('projects'))) {
      await queryRunner.query(`
        CREATE TABLE "projects" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "slug" character varying NOT NULL,
          "name" character varying NOT NULL,
          "location" character varying NOT NULL,
          "kw" numeric(10,2) NOT NULL,
          "date" character varying NOT NULL,
          "category" character varying,
          "description" text NOT NULL,
          "about" text,
          "specsTitle" character varying NOT NULL DEFAULT 'Sistem Özellikleri',
          "specs" text array NOT NULL DEFAULT '{}',
          "highlightsTitle" character varying NOT NULL DEFAULT 'Öne Çıkan Özellikler',
          "highlights" text array NOT NULL DEFAULT '{}',
          "statBoxes" jsonb NOT NULL DEFAULT '[]',
          "ctaText" character varying NOT NULL DEFAULT 'Benzer Proje İçin Teklif Al',
          "published" boolean NOT NULL DEFAULT true,
          "sortOrder" integer NOT NULL DEFAULT 0,
          "instagramMediaId" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_projects_slug" UNIQUE ("slug"),
          CONSTRAINT "UQ_projects_instagramMediaId" UNIQUE ("instagramMediaId")
        )
      `)
      await queryRunner.query(
        `CREATE INDEX "IDX_projects_published_sortOrder" ON "projects" ("published", "sortOrder")`,
      )
      await queryRunner.query(
        `CREATE INDEX "IDX_projects_instagramMediaId" ON "projects" ("instagramMediaId")`,
      )
    }

    if (!(await queryRunner.hasTable('project_media'))) {
      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_media_type_enum') THEN
            CREATE TYPE "project_media_type_enum" AS ENUM ('image', 'video', 'thumbnail');
          END IF;
        END $$
      `)
      await queryRunner.query(`
        CREATE TABLE "project_media" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "project_id" uuid,
          "type" "project_media_type_enum" NOT NULL,
          "src" character varying NOT NULL,
          "sortOrder" integer NOT NULL DEFAULT 0,
          CONSTRAINT "PK_project_media_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_project_media_project" FOREIGN KEY ("project_id")
            REFERENCES "projects"("id") ON DELETE CASCADE
        )
      `)
    }

    if (!(await queryRunner.hasTable('references'))) {
      await queryRunner.query(`
        CREATE TABLE "references" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying NOT NULL,
          "logo" character varying,
          "published" boolean NOT NULL DEFAULT true,
          "sortOrder" integer NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_references_id" PRIMARY KEY ("id")
        )
      `)
      await queryRunner.query(
        `CREATE INDEX "IDX_references_published_sortOrder" ON "references" ("published", "sortOrder")`,
      )
    }

    if (!(await queryRunner.hasTable('blog_posts'))) {
      await queryRunner.query(`
        CREATE TABLE "blog_posts" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "title" character varying NOT NULL,
          "slug" character varying NOT NULL,
          "excerpt" character varying,
          "metaDescription" character varying,
          "content" text NOT NULL DEFAULT '',
          "coverImage" character varying,
          "published" boolean NOT NULL DEFAULT false,
          "publishedAt" TIMESTAMP,
          "sortOrder" integer NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_blog_posts_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_blog_posts_slug" UNIQUE ("slug")
        )
      `)
      await queryRunner.query(
        `CREATE INDEX "IDX_blog_posts_published_sortOrder" ON "blog_posts" ("published", "sortOrder")`,
      )
    }

    if (!(await queryRunner.hasTable('faqs'))) {
      await queryRunner.query(`
        CREATE TABLE "faqs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "question" character varying NOT NULL,
          "answer" text NOT NULL,
          "published" boolean NOT NULL DEFAULT true,
          "sortOrder" integer NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_faqs_id" PRIMARY KEY ("id")
        )
      `)
      await queryRunner.query(
        `CREATE INDEX "IDX_faqs_published_sortOrder" ON "faqs" ("published", "sortOrder")`,
      )
    }

    if (!(await queryRunner.hasTable('admin_config'))) {
      await queryRunner.query(`
        CREATE TABLE "admin_config" (
          "id" integer NOT NULL,
          "totpSecret" text,
          "username" text,
          "passwordHash" text,
          "tokenVersion" integer NOT NULL DEFAULT 0,
          CONSTRAINT "PK_admin_config_id" PRIMARY KEY ("id")
        )
      `)
    }

    if (!(await queryRunner.hasTable('app_settings'))) {
      await queryRunner.query(`
        CREATE TABLE "app_settings" (
          "key" character varying NOT NULL,
          "value" text NOT NULL,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_app_settings_key" PRIMARY KEY ("key")
        )
      `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "project_media"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "project_media_type_enum"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "references"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_posts"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "faqs"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_config"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "app_settings"`)
  }
}
