import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkerServicesEntity1781535207605 implements MigrationInterface {
  name = 'CreateWorkerServicesEntity1781535207605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "worker_services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_worker_services" PRIMARY KEY ("id"),
        CONSTRAINT "FK_worker_services_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_worker_services_service" FOREIGN KEY ("service_id")
          REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "worker_services"`);
  }
}
