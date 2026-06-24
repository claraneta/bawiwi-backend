import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceFeedsTable1781659571200 implements MigrationInterface {
  name = 'CreateServiceFeedsTable1781659571200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for service feed status
    await queryRunner.query(`
      CREATE TYPE "service_feed_status_enum" AS ENUM ('active', 'cancelled', 'closed', 'assigned', 'completed')
    `);

    // Create service_feeds table
    await queryRunner.query(`
      CREATE TABLE "service_feeds" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" character varying NOT NULL,
        "status" "service_feed_status_enum" NOT NULL DEFAULT 'active',
        "location" character varying NOT NULL,
        "coordinates" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_feeds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_feeds_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_feeds_service" FOREIGN KEY ("service_id")
          REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "service_feeds"`);
    await queryRunner.query(`DROP TYPE "service_feed_status_enum"`);
  }
}
