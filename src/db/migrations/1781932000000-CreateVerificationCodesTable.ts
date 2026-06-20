import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVerificationCodesTable1781932000000 implements MigrationInterface {
  name = 'CreateVerificationCodesTable1781932000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "verification_purpose_enum" AS ENUM ('email_verification', 'password_reset', 'signup')
    `);

    await queryRunner.query(`
      CREATE TABLE "verification_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "code" character varying NOT NULL,
        "purpose" "verification_purpose_enum" NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_codes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_verification_codes_email_purpose" ON "verification_codes" ("email", "purpose")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_verification_codes_email_purpose"`);
    await queryRunner.query(`DROP TABLE "verification_codes"`);
    await queryRunner.query(`DROP TYPE "verification_purpose_enum"`);
  }
}
