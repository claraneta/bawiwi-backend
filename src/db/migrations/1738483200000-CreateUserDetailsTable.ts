import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserDetailsTable1738483200000 implements MigrationInterface {
  name = 'CreateUserDetailsTable1738483200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_details" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "birthdate" date NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_details" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_details_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_user_details_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_details"`);
  }
}
