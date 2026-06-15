import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1738396800000 implements MigrationInterface {
  name = 'CreateUsersTable1738396800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for user role
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('worker', 'client', 'admin')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deactivated" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
