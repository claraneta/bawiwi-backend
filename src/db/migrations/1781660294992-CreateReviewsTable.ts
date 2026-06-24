import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTable1781660294992 implements MigrationInterface {
  name = 'CreateReviewsTable1781660294992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "service_feed_id" uuid NOT NULL,
        "reviewer_id" uuid NOT NULL,
        "reviewee_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "CK_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5),
        CONSTRAINT "FK_reviews_service_feed" FOREIGN KEY ("service_feed_id")
          REFERENCES "service_feeds"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_reviewer" FOREIGN KEY ("reviewer_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_reviewee" FOREIGN KEY ("reviewee_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reviews"`);
  }
}
