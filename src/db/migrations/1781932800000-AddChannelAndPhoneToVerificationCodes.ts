import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChannelAndPhoneToVerificationCodes1781932800000 implements MigrationInterface {
  name = 'AddChannelAndPhoneToVerificationCodes1781932800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "verification_channel_enum" AS ENUM ('email', 'sms')
    `);

    await queryRunner.query(`
      ALTER TABLE "verification_codes"
      ADD COLUMN "phone" character varying,
      ADD COLUMN "channel" "verification_channel_enum" NOT NULL DEFAULT 'email'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_verification_codes_phone_purpose" ON "verification_codes" ("phone", "purpose")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_verification_codes_phone_purpose"`);
    await queryRunner.query(`
      ALTER TABLE "verification_codes"
      DROP COLUMN "channel",
      DROP COLUMN "phone"
    `);
    await queryRunner.query(`DROP TYPE "verification_channel_enum"`);
  }
}
